use crate::actions::{self, GestureKey};
use input::{
    event::gesture::{
        GestureEvent, GestureEventCoordinates, GestureEventTrait,
        GesturePinchEvent, GesturePinchEventTrait, GestureSwipeEvent,
        GestureHoldEvent,
    },
    event::{Event, EventTrait},
    DeviceCapability, Libinput, LibinputInterface,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::OpenOptions;
use std::os::unix::fs::OpenOptionsExt;
use std::os::unix::io::OwnedFd;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::Emitter;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GestureEventData {
    pub gesture_type: String,
    pub finger_count: i32,
    pub direction: String,
    pub dx: f64,
    pub dy: f64,
    pub scale: f64,
    pub angle_delta: f64,
    pub phase: String,
    pub timestamp: String,
    pub label: String,
    pub action_triggered: Option<String>,
}

struct GestureState {
    cumulative_dx: f64,
    cumulative_dy: f64,
    cumulative_scale: f64,
    cumulative_angle: f64,
    last_direction: String,
}

impl Default for GestureState {
    fn default() -> Self {
        GestureState {
            cumulative_dx: 0.0,
            cumulative_dy: 0.0,
            cumulative_scale: 1.0,
            cumulative_angle: 0.0,
            last_direction: "none".into(),
        }
    }
}

struct UdevInterface;

impl LibinputInterface for UdevInterface {
    fn open_restricted(&mut self, path: &Path, flags: i32) -> Result<OwnedFd, i32> {
        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .custom_flags(flags)
            .open(path)
            .map_err(|e| e.raw_os_error().unwrap_or(-1))?;
        Ok(OwnedFd::from(file))
    }

    fn close_restricted(&mut self, fd: OwnedFd) {
        drop(fd);
    }
}

impl UdevInterface {
    fn new() -> Self {
        UdevInterface
    }
}

fn load_mappings() -> HashMap<GestureKey, actions::GestureMapping> {
    let mappings = actions::load_mappings();
    actions::build_mapping_map(&mappings)
}

pub fn start_gesture_listener(app_handle: tauri::AppHandle, running: Arc<AtomicBool>) {
    std::thread::spawn(move || {
        let mut li = Libinput::new_with_udev(UdevInterface::new());
        if let Err(e) = li.udev_assign_seat("seat0") {
            eprintln!("Failed to assign seat: {:?}", e);
            let _ = app_handle.emit(
                "gesture-error",
                format!(
                    "无法初始化libinput: {:?}\n请确保用户在input组中: sudo usermod -aG input $USER",
                    e
                ),
            );
            running.store(false, Ordering::SeqCst);
            return;
        }

        let _ = app_handle.emit("gesture-status", "listening");

        let mut mappings = load_mappings();
        let mut swipe_state = GestureState::default();
        let mut pinch_state = GestureState::default();
        let mut last_reload = std::time::Instant::now();

        while running.load(Ordering::SeqCst) {
            li.dispatch().ok();

            // Reload mappings every 5 seconds to pick up config changes
            if last_reload.elapsed().as_secs() >= 5 {
                mappings = load_mappings();
                last_reload = std::time::Instant::now();
            }

            for event in &mut li {
                if !running.load(Ordering::SeqCst) {
                    break;
                }

                if let Some(gesture_data) =
                    process_event(event, &mut swipe_state, &mut pinch_state, &mappings, &app_handle)
                {
                    let _ = app_handle.emit("gesture-event", &gesture_data);
                }
            }

            std::thread::sleep(std::time::Duration::from_micros(100));
        }

        let _ = app_handle.emit("gesture-status", "stopped");
    });
}

fn process_event(
    event: Event,
    swipe_state: &mut GestureState,
    pinch_state: &mut GestureState,
    mappings: &HashMap<GestureKey, actions::GestureMapping>,
    app_handle: &tauri::AppHandle,
) -> Option<GestureEventData> {
    match event {
        Event::Gesture(gesture_event) => match gesture_event {
            GestureEvent::Swipe(swipe_event) => {
                process_swipe(swipe_event, swipe_state, mappings, app_handle)
            }
            GestureEvent::Pinch(pinch_event) => {
                process_pinch(pinch_event, pinch_state, mappings, app_handle)
            }
            GestureEvent::Hold(hold_event) => process_hold(hold_event, mappings, app_handle),
            _ => None,
        },
        _ => None,
    }
}

fn try_trigger_action(
    gesture_type: &str,
    finger_count: i32,
    direction: &str,
    mappings: &HashMap<GestureKey, actions::GestureMapping>,
    app_handle: &tauri::AppHandle,
) -> Option<String> {
    let key = GestureKey {
        gesture_type: gesture_type.into(),
        finger_count,
        direction: direction.into(),
    };

    if let Some(mapping) = mappings.get(&key) {
        let result = actions::execute_action(mapping);
        let _ = app_handle.emit("action-triggered", &result);
        if result.success {
            Some(mapping.action_name.clone())
        } else {
            Some(format!("{} (失败)", mapping.action_name))
        }
    } else {
        None
    }
}

fn process_swipe(
    event: GestureSwipeEvent,
    state: &mut GestureState,
    mappings: &HashMap<GestureKey, actions::GestureMapping>,
    app_handle: &tauri::AppHandle,
) -> Option<GestureEventData> {
    let (phase, dx, dy, finger_count) = match event {
        GestureSwipeEvent::Begin(e) => {
            *state = GestureState::default();
            ("begin".to_string(), 0.0, 0.0, e.finger_count())
        }
        GestureSwipeEvent::Update(e) => {
            let dx = e.dx();
            let dy = e.dy();
            state.cumulative_dx += dx;
            state.cumulative_dy += dy;
            state.last_direction = classify_swipe_direction(dx, dy);
            ("update".to_string(), dx, dy, e.finger_count())
        }
        GestureSwipeEvent::End(e) => ("end".to_string(), 0.0, 0.0, e.finger_count()),
        _ => return None,
    };

    let direction = if phase == "update" {
        state.last_direction.clone()
    } else {
        "none".to_string()
    };

    // On end, determine final direction from cumulative movement and trigger action
    let action_triggered = if phase == "end" {
        let final_dir = classify_swipe_direction(state.cumulative_dx, state.cumulative_dy);
        if final_dir != "none" {
            try_trigger_action("swipe", finger_count, &final_dir, mappings, app_handle)
        } else {
            None
        }
    } else {
        None
    };

    let label = format!(
        "{}指滑动{}",
        finger_count,
        if let Some(ref action) = action_triggered {
            format!(" → {}", action)
        } else if direction != "none" {
            format!(" ({})", direction)
        } else {
            format!(" [{}]", phase)
        }
    );

    Some(GestureEventData {
        gesture_type: "swipe".to_string(),
        finger_count,
        direction,
        dx,
        dy,
        scale: 0.0,
        angle_delta: 0.0,
        phase,
        timestamp: chrono::Local::now().format("%H:%M:%S%.3f").to_string(),
        label,
        action_triggered,
    })
}

fn process_pinch(
    event: GesturePinchEvent,
    state: &mut GestureState,
    mappings: &HashMap<GestureKey, actions::GestureMapping>,
    app_handle: &tauri::AppHandle,
) -> Option<GestureEventData> {
    let (phase, dx, dy, scale, angle_delta, finger_count) = match event {
        GesturePinchEvent::Begin(e) => {
            *state = GestureState::default();
            ("begin".to_string(), 0.0, 0.0, 1.0, 0.0, e.finger_count())
        }
        GesturePinchEvent::Update(e) => {
            let dx = e.dx();
            let dy = e.dy();
            let s = e.scale();
            let a = e.angle_delta();
            state.cumulative_dx += dx;
            state.cumulative_dy += dy;
            state.cumulative_scale *= s;
            state.cumulative_angle += a;
            state.last_direction = classify_pinch_direction(s, a, dx, dy);
            ("update".to_string(), dx, dy, s, a, e.finger_count())
        }
        GesturePinchEvent::End(e) => {
            ("end".to_string(), 0.0, 0.0, 1.0, 0.0, e.finger_count())
        }
        _ => return None,
    };

    let direction = if phase == "update" {
        state.last_direction.clone()
    } else {
        "none".to_string()
    };

    // On end, trigger action based on cumulative state
    let action_triggered = if phase == "end" {
        let final_dir = classify_pinch_direction(
            state.cumulative_scale,
            state.cumulative_angle,
            state.cumulative_dx,
            state.cumulative_dy,
        );
        if final_dir != "none" {
            try_trigger_action("pinch", finger_count, &final_dir, mappings, app_handle)
        } else {
            None
        }
    } else {
        None
    };

    let label = format!(
        "{}指捏合{}",
        finger_count,
        if let Some(ref action) = action_triggered {
            format!(" → {}", action)
        } else if direction != "none" && phase == "update" {
            format!(" ({})", direction)
        } else {
            format!(" [{}]", phase)
        }
    );

    Some(GestureEventData {
        gesture_type: "pinch".to_string(),
        finger_count,
        direction,
        dx,
        dy,
        scale,
        angle_delta,
        phase,
        timestamp: chrono::Local::now().format("%H:%M:%S%.3f").to_string(),
        label,
        action_triggered,
    })
}

fn process_hold(
    event: GestureHoldEvent,
    mappings: &HashMap<GestureKey, actions::GestureMapping>,
    app_handle: &tauri::AppHandle,
) -> Option<GestureEventData> {
    let (phase, finger_count) = match event {
        GestureHoldEvent::Begin(e) => ("begin".to_string(), e.finger_count()),
        GestureHoldEvent::End(e) => ("end".to_string(), e.finger_count()),
        _ => return None,
    };

    // Trigger hold action on begin
    let action_triggered = if phase == "begin" {
        try_trigger_action("hold", finger_count, "none", mappings, app_handle)
    } else {
        None
    };

    let label = format!(
        "{}指长按{}",
        finger_count,
        if let Some(ref action) = action_triggered {
            format!(" → {}", action)
        } else {
            format!(" [{}]", phase)
        }
    );

    Some(GestureEventData {
        gesture_type: "hold".to_string(),
        finger_count,
        direction: "none".to_string(),
        dx: 0.0,
        dy: 0.0,
        scale: 0.0,
        angle_delta: 0.0,
        phase,
        timestamp: chrono::Local::now().format("%H:%M:%S%.3f").to_string(),
        label,
        action_triggered,
    })
}

fn classify_pinch_direction(scale: f64, angle_delta: f64, dx: f64, dy: f64) -> String {
    if (scale - 1.0).abs() > 0.02 {
        if scale < 1.0 {
            "pinch_in".to_string()
        } else {
            "pinch_out".to_string()
        }
    } else if angle_delta.abs() > 0.5 {
        if angle_delta > 0.0 {
            "rotate_cw".to_string()
        } else {
            "rotate_ccw".to_string()
        }
    } else {
        classify_swipe_direction(dx, dy)
    }
}

fn classify_swipe_direction(dx: f64, dy: f64) -> String {
    let threshold = 0.5;
    if dx.abs() < threshold && dy.abs() < threshold {
        return "none".to_string();
    }

    if dx.abs() > dy.abs() {
        if dx > 0.0 {
            "right".to_string()
        } else {
            "left".to_string()
        }
    } else if dy > 0.0 {
        "down".to_string()
    } else {
        "up".to_string()
    }
}

pub fn list_touchpad_devices() -> Vec<serde_json::Value> {
    let mut devices = Vec::new();

    let mut li = Libinput::new_with_udev(UdevInterface::new());
    if li.udev_assign_seat("seat0").is_err() {
        return devices;
    }

    li.dispatch().ok();

    for event in &mut li {
        if let Event::Device(d) = event {
            let dev = d.device();
            if dev.has_capability(DeviceCapability::Gesture) {
                devices.push(serde_json::json!({
                    "name": dev.name().to_string(),
                    "sys_name": dev.sysname().to_string(),
                    "has_gesture": true,
                }));
            }
        }
    }

    devices
}
