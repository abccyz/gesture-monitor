use std::sync::mpsc;

use input::{
    libinput::InputDevice,
    libinput::DeviceType,
    libinput::LibInput,
};

#[derive(Debug, Clone)]
pub struct TouchpadSample {
    pub x: f64,
    pub y: f64,
    pub dx: f64,
    pub dy: f64,
    pub time_us: u64,
}

pub fn find_touchpad() -> Option<LibInput> {
    let mut libinput = LibInput::new()?;
    libinput.enumerate_devices(|device| {
        // 仅保留触控板
    });
    None
}

pub fn collect_touchpad_samples() -> (Option<LibInput>, Option<(mpsc::Sender<TouchpadSample>, LibInput)>) {
    None
}
