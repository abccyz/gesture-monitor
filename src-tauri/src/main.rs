#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod actions;
mod commands;
mod gesture;

use commands::ListenerState;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Listener, Manager,
};

fn create_tray_icon_rgba() -> Vec<u8> {
    let size = 22u32;
    let mut pixels = vec![0u8; (size * size * 4) as usize];
    let cx = size as i32 / 2;
    let cy = size as i32 / 2;
    let palm_r = (size as f32 * 0.25) as i32;

    for y in 0..size as i32 {
        for x in 0..size as i32 {
            let idx = ((y * size as i32 + x) * 4) as usize;
            let dx = (x - cx).abs();
            let dy = y - cy;

            let is_palm = dx * dx + (dy - 2) * (dy - 2) < palm_r * palm_r;

            let finger_w = (size as f32 * 0.08) as i32;
            let finger_top = cy - (size as f32 * 0.25) as i32 - 4;
            let finger_bottom = cy - 2;
            let is_finger = [
                cx - (size as f32 * 0.15) as i32,
                cx,
                cx + (size as f32 * 0.15) as i32,
            ]
            .iter()
            .any(|&fx| (x - fx).abs() < finger_w && y > finger_top && y < finger_bottom);

            if is_palm || is_finger {
                pixels[idx] = 59;
                pixels[idx + 1] = 130;
                pixels[idx + 2] = 246;
                pixels[idx + 3] = 255;
            }
        }
    }
    pixels
}

fn build_tray_menu(app: &tauri::AppHandle, is_listening: bool) -> tauri::menu::Menu<tauri::Wry> {
    let status_text = if is_listening {
        "状态: ● 监听中"
    } else {
        "状态: ○ 未启动"
    };

    let status_item = MenuItemBuilder::with_id("status", status_text)
        .enabled(false)
        .build(app)
        .unwrap();
    let show_item = MenuItemBuilder::with_id("show", "显示窗口")
        .build(app)
        .unwrap();
    let hide_item = MenuItemBuilder::with_id("hide", "隐藏窗口")
        .build(app)
        .unwrap();
    let toggle_item = if is_listening {
        MenuItemBuilder::with_id("stop", "停止监听")
            .build(app)
            .unwrap()
    } else {
        MenuItemBuilder::with_id("start", "开始监听")
            .build(app)
            .unwrap()
    };
    let quit_item = MenuItemBuilder::with_id("quit", "退出")
        .build(app)
        .unwrap();

    MenuBuilder::new(app)
        .item(&status_item)
        .separator()
        .item(&toggle_item)
        .separator()
        .item(&show_item)
        .item(&hide_item)
        .separator()
        .item(&quit_item)
        .build()
        .unwrap()
}

fn main() {
    tauri::Builder::default()
        .manage(ListenerState {
            running: Arc::new(AtomicBool::new(false)),
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_listening,
            commands::stop_listening,
            commands::get_devices,
            commands::get_mappings,
            commands::save_all_mappings,
            commands::add_mapping,
            commands::remove_mapping,
            commands::update_mapping,
            commands::reset_mappings,
        ])
        .setup(|app| {
            // ponytail: 初始尺寸按屏幕可用区域自适应（宽 ~78%、高 ~85%），并 clamp 到
            // [1280x840, 1760x1100]，避免高分屏上窗口过小导致内容拥挤、低分屏上超出屏幕
            if let Some(window) = app.get_webview_window("main") {
                let (mut w, mut h) = (1680.0_f64, 1050.0_f64);

                if let Ok(Some(monitor)) = app.primary_monitor() {
                    let scale = monitor.scale_factor();
                    let avail_w = monitor.size().width as f64 / scale;
                    let avail_h = monitor.size().height as f64 / scale;
                    w = (avail_w * 0.78).clamp(1280.0, 1760.0).min(avail_w);
                    h = (avail_h * 0.85).clamp(840.0, 1100.0).min(avail_h);
                }

                let _ = window.set_min_size(Some(tauri::LogicalSize::new(
                    1100.0_f64.min(w),
                    700.0_f64.min(h),
                )));
                let _ = window.set_size(tauri::LogicalSize::new(w, h));
                let _ = window.center();

                // Xfwm4 等 WM 会在窗口映射后按自身放置策略覆盖位置，延迟再居中一次
                let win = window.clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(250));
                    let _ = win.center();
                });
            }

            let handle = app.handle();

            let tray_menu = build_tray_menu(handle, false);

            let rgba = create_tray_icon_rgba();
            let icon = Image::new_owned(rgba, 22, 22);

            let _tray = TrayIconBuilder::with_id("main")
                .icon(icon)
                .menu(&tray_menu)
                .tooltip("Gesture Monitor - 监听中")
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .on_menu_event(move |app, event| {
                    let id = event.id.as_ref();
                    match id {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.hide();
                            }
                        }
                        "start" => {
                            let state = app.state::<ListenerState>();
                            if !state.running.load(Ordering::SeqCst) {
                                state.running.store(true, Ordering::SeqCst);
                                gesture::start_gesture_listener(
                                    app.clone(),
                                    state.running.clone(),
                                );
                                if let Some(tray) = app.tray_by_id("main") {
                                    let _ = tray.set_menu(Some(build_tray_menu(app, true)));
                                }
                            }
                        }
                        "stop" => {
                            let state = app.state::<ListenerState>();
                            state.running.store(false, Ordering::SeqCst);
                            if let Some(tray) = app.tray_by_id("main") {
                                let _ = tray.set_menu(Some(build_tray_menu(app, false)));
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            // Listen for status changes from the gesture listener to update tray
            let app_handle = app.handle().clone();
            app.listen("gesture-status", move |event| {
                let is_listening = event.payload().contains("listening");
                if let Some(tray) = app_handle.tray_by_id("main") {
                    let _ = tray.set_menu(Some(build_tray_menu(&app_handle, is_listening)));
                    let tooltip = if is_listening {
                        "Gesture Monitor - 监听中"
                    } else {
                        "Gesture Monitor - 已停止"
                    };
                    let _ = tray.set_tooltip(Some(tooltip));
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
