use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Command;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct GestureKey {
    pub gesture_type: String,
    pub finger_count: i32,
    pub direction: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GestureMapping {
    pub id: String,
    pub key: GestureKey,
    pub action_name: String,
    pub action_cmd: String,
    pub action_args: Vec<String>,
    pub macos_equivalent: String,
    pub enabled: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ActionResult {
    pub gesture_label: String,
    pub action_name: String,
    pub success: bool,
    pub error: Option<String>,
}

fn config_path() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/home/chenyz".into());
    format!("{}/.config/gesture-monitor/mappings.json", home)
}

pub fn load_mappings() -> Vec<GestureMapping> {
    if let Ok(content) = std::fs::read_to_string(config_path()) {
        if let Ok(mappings) = serde_json::from_str::<Vec<GestureMapping>>(&content) {
            return mappings;
        }
    }
    get_default_mappings()
}

pub fn save_mappings(mappings: &[GestureMapping]) -> Result<(), String> {
    let path = config_path();
    let dir = std::path::Path::new(&path)
        .parent()
        .ok_or("Cannot get config directory")?;
    std::fs::create_dir_all(dir).map_err(|e| format!("Create dir failed: {}", e))?;
    let json = serde_json::to_string_pretty(mappings)
        .map_err(|e| format!("Serialize failed: {}", e))?;
    std::fs::write(&path, json).map_err(|e| format!("Write failed: {}", e))?;
    Ok(())
}

pub fn get_default_mappings() -> Vec<GestureMapping> {
    let mut id = 0u32;
    let mut next_id = || {
        id += 1;
        format!("m{:03}", id)
    };

    vec![
        // === 3指 滑动 ===
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "swipe".into(), finger_count: 3, direction: "up".into() },
            action_name: "Mission Control".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["key".into(), "ctrl+alt+Up".into()],
            macos_equivalent: "Mission Control — 显示所有窗口和工作区".into(),
            enabled: true,
        },
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "swipe".into(), finger_count: 3, direction: "down".into() },
            action_name: "App Exposé".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["key".into(), "alt+F3".into()],
            macos_equivalent: "App Exposé — 显示当前应用所有窗口".into(),
            enabled: true,
        },
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "swipe".into(), finger_count: 3, direction: "left".into() },
            action_name: "切换上一工作区".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["key".into(), "ctrl+alt+Left".into()],
            macos_equivalent: "在全屏应用之间向左切换".into(),
            enabled: true,
        },
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "swipe".into(), finger_count: 3, direction: "right".into() },
            action_name: "切换下一工作区".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["key".into(), "ctrl+alt+Right".into()],
            macos_equivalent: "在全屏应用之间向右切换".into(),
            enabled: true,
        },
        // === 4指 滑动 ===
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "swipe".into(), finger_count: 4, direction: "up".into() },
            action_name: "Mission Control".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["key".into(), "ctrl+alt+Up".into()],
            macos_equivalent: "Mission Control (4指)".into(),
            enabled: true,
        },
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "swipe".into(), finger_count: 4, direction: "down".into() },
            action_name: "App Exposé".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["key".into(), "alt+F3".into()],
            macos_equivalent: "App Exposé (4指)".into(),
            enabled: true,
        },
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "swipe".into(), finger_count: 4, direction: "left".into() },
            action_name: "切换上一工作区".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["key".into(), "ctrl+alt+Left".into()],
            macos_equivalent: "切换桌面 (4指左)".into(),
            enabled: true,
        },
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "swipe".into(), finger_count: 4, direction: "right".into() },
            action_name: "切换下一工作区".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["key".into(), "ctrl+alt+Right".into()],
            macos_equivalent: "切换桌面 (4指右)".into(),
            enabled: true,
        },
        // === 2指 捏合/旋转 ===
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "pinch".into(), finger_count: 2, direction: "pinch_in".into() },
            action_name: "缩小".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["key".into(), "ctrl+minus".into()],
            macos_equivalent: "捏合缩小".into(),
            enabled: true,
        },
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "pinch".into(), finger_count: 2, direction: "pinch_out".into() },
            action_name: "放大".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["key".into(), "ctrl+plus".into()],
            macos_equivalent: "捏合放大".into(),
            enabled: true,
        },
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "pinch".into(), finger_count: 2, direction: "rotate_cw".into() },
            action_name: "下一标签页".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["key".into(), "ctrl+Tab".into()],
            macos_equivalent: "旋转 — 下一标签页".into(),
            enabled: false,
        },
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "pinch".into(), finger_count: 2, direction: "rotate_ccw".into() },
            action_name: "上一标签页".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["key".into(), "ctrl+shift+Tab".into()],
            macos_equivalent: "旋转 — 上一标签页".into(),
            enabled: false,
        },
        // === 长按 ===
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "hold".into(), finger_count: 3, direction: "none".into() },
            action_name: "右键菜单".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["click".into(), "3".into()],
            macos_equivalent: "三指轻点 — 查找/数据检测器".into(),
            enabled: true,
        },
        GestureMapping {
            id: next_id(),
            key: GestureKey { gesture_type: "hold".into(), finger_count: 4, direction: "none".into() },
            action_name: "显示桌面".into(),
            action_cmd: "xdotool".into(),
            action_args: vec!["key".into(), "super+d".into()],
            macos_equivalent: "张开拇指和三指 — 显示桌面".into(),
            enabled: true,
        },
    ]
}

pub fn build_mapping_map(mappings: &[GestureMapping]) -> HashMap<GestureKey, GestureMapping> {
    mappings
        .iter()
        .filter(|m| m.enabled)
        .map(|m| (m.key.clone(), m.clone()))
        .collect()
}

pub fn execute_action(mapping: &GestureMapping) -> ActionResult {
    let result = Command::new(&mapping.action_cmd)
        .args(&mapping.action_args)
        .env("DISPLAY", std::env::var("DISPLAY").unwrap_or_else(|_| ":0".into()))
        .env(
            "XAUTHORITY",
            std::env::var("XAUTHORITY").unwrap_or_else(|_| {
                let home = std::env::var("HOME").unwrap_or_else(|_| "/home/chenyz".into());
                format!("{}/.Xauthority", home)
            }),
        )
        .output();

    match result {
        Ok(output) => ActionResult {
            gesture_label: format!(
                "{}指 {} {}",
                mapping.key.finger_count, mapping.key.gesture_type, mapping.key.direction
            ),
            action_name: mapping.action_name.clone(),
            success: output.status.success(),
            error: if output.status.success() {
                None
            } else {
                Some(String::from_utf8_lossy(&output.stderr).to_string())
            },
        },
        Err(e) => ActionResult {
            gesture_label: format!(
                "{}指 {} {}",
                mapping.key.finger_count, mapping.key.gesture_type, mapping.key.direction
            ),
            action_name: mapping.action_name.clone(),
            success: false,
            error: Some(format!("执行失败: {}", e)),
        },
    }
}

pub fn gen_id() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    format!("c{}", ts)
}
