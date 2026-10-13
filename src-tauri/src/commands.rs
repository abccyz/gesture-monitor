use crate::actions;
use crate::gesture;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::State;

pub struct ListenerState {
    pub running: Arc<AtomicBool>,
}

#[tauri::command]
pub fn start_listening(state: State<ListenerState>, app_handle: tauri::AppHandle) -> Result<String, String> {
    if state.running.load(Ordering::SeqCst) {
        return Ok("already_running".to_string());
    }
    state.running.store(true, Ordering::SeqCst);
    gesture::start_gesture_listener(app_handle, state.running.clone());
    Ok("started".to_string())
}

#[tauri::command]
pub fn stop_listening(state: State<ListenerState>) -> Result<String, String> {
    state.running.store(false, Ordering::SeqCst);
    Ok("stopped".to_string())
}

#[tauri::command]
pub fn get_devices() -> Result<Vec<serde_json::Value>, String> {
    Ok(gesture::list_touchpad_devices())
}

#[tauri::command]
pub fn get_mappings() -> Result<Vec<actions::GestureMapping>, String> {
    Ok(actions::load_mappings())
}

#[tauri::command]
pub fn save_all_mappings(mappings: Vec<actions::GestureMapping>) -> Result<String, String> {
    actions::save_mappings(&mappings)?;
    Ok("saved".to_string())
}

#[tauri::command]
pub fn add_mapping(
    gesture_type: String,
    finger_count: i32,
    direction: String,
    action_name: String,
    action_cmd: String,
    action_args: Vec<String>,
) -> Result<Vec<actions::GestureMapping>, String> {
    let mut mappings = actions::load_mappings();
    mappings.push(actions::GestureMapping {
        id: actions::gen_id(),
        key: actions::GestureKey {
            gesture_type,
            finger_count,
            direction,
        },
        action_name,
        action_cmd,
        action_args,
        macos_equivalent: String::new(),
        enabled: true,
    });
    actions::save_mappings(&mappings)?;
    Ok(mappings)
}

#[tauri::command]
pub fn remove_mapping(id: String) -> Result<Vec<actions::GestureMapping>, String> {
    let mut mappings = actions::load_mappings();
    mappings.retain(|m| m.id != id);
    actions::save_mappings(&mappings)?;
    Ok(mappings)
}

#[tauri::command]
pub fn update_mapping(updated: actions::GestureMapping) -> Result<Vec<actions::GestureMapping>, String> {
    let mut mappings = actions::load_mappings();
    if let Some(m) = mappings.iter_mut().find(|m| m.id == updated.id) {
        *m = updated;
    }
    actions::save_mappings(&mappings)?;
    Ok(mappings)
}

#[tauri::command]
pub fn reset_mappings() -> Result<Vec<actions::GestureMapping>, String> {
    let defaults = actions::get_default_mappings();
    actions::save_mappings(&defaults)?;
    Ok(defaults)
}
