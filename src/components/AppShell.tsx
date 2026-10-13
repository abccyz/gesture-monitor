import { getCurrentWindow } from "@tauri-apps/api/window";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { AppShellProps } from "../types";

type WindowAction = "minimize" | "maximize" | "close";

/** 窗口控制：非 Tauri 环境（浏览器预览）下静默忽略 */
async function windowAction(action: WindowAction) {
  try {
    const win = getCurrentWindow();
    if (action === "minimize") await win.minimize();
    else if (action === "maximize") await win.toggleMaximize();
    else await win.close();
  } catch {
    /* noop */
  }
}

/** 交互控件不参与拖动，避免点按钮时整窗跟着动 */
function isInteractive(target: EventTarget | null) {
  return target instanceof HTMLElement && !!target.closest("button, a, input, select, textarea");
}

/** 拖动自定义标题栏窗体 */
async function startWindowDrag(e: ReactMouseEvent<HTMLElement>) {
  if (e.button !== 0 || isInteractive(e.target)) return;
  try {
    await getCurrentWindow().startDragging();
  } catch {
    /* 非 Tauri 环境忽略 */
  }
}

/** 双击标题栏切换最大化 */
function onTitlebarDoubleClick(e: ReactMouseEvent<HTMLElement>) {
  if (isInteractive(e.target)) return;
  void windowAction("maximize");
}

export default function AppShell({
  title = "Gesture Monitor",
  subtitle = "libinput · Tauri 2 · v0.1.0",
  seat = "seat0",
  connectionState,
  isCapturing,
  mappingsEnabled = 0,
  mappingsTotal = 0,
  sessionElapsed = "00:00",
  mappingsOpen = false,
  onToggleCapture,
  onOpenMappings,
  children,
  sidebar,
}: AppShellProps) {
  const listening = isCapturing || connectionState === "listening";

  return (
    <div className="app" data-component="app-shell" data-type="container">
      <header
        className="titlebar"
        data-component="title-bar"
        data-type="header"
        onMouseDown={startWindowDrag}
        onDoubleClick={onTitlebarDoubleClick}
      >
        <div className="brand">
          <div className="brand-mark">
            <svg className="ic">
              <use href="#i-hand" />
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-title">{title}</div>
            <div className="brand-sub">{subtitle}</div>
          </div>
        </div>

        <div className="tb-spacer" />

        <span className="chip accent" data-type="card">
          <svg className="ic sm">
            <use href="#i-zap" />
          </svg>
          映射 <b>{mappingsEnabled}</b> /{mappingsTotal} 启用
        </span>
        <span className="chip" data-type="card">
          <svg className="ic sm">
            <use href="#i-clock" />
          </svg>
          会话 <b className="num">{sessionElapsed}</b>
        </span>

        <div className={listening ? "status-pill" : "status-pill off"} data-type="card">
          <span className="dot" />
          {listening ? `监听中 · ${seat}` : "未监听"}
        </div>

        <button
          type="button"
          className={listening ? "btn btn-stop" : "btn btn-gold"}
          data-type="button"
          onClick={onToggleCapture}
        >
          <svg className="ic sm">
            <use href={listening ? "#i-stop" : "#i-play"} />
          </svg>
          {listening ? "停止监听" : "开始监听"}
        </button>
        <button
          type="button"
          className={mappingsOpen ? "icon-btn active" : "icon-btn"}
          data-type="button"
          title="手势映射配置"
          onClick={onOpenMappings}
        >
          <svg className="ic">
            <use href="#i-gear" />
          </svg>
        </button>

        <div className="tb-divider" />
        <div className="win-ctl" data-type="device-frame">
          <button type="button" title="最小化" onClick={() => windowAction("minimize")}>
            <svg className="ic sm">
              <use href="#i-min" />
            </svg>
          </button>
          <button type="button" title="最大化" onClick={() => windowAction("maximize")}>
            <svg className="ic sm">
              <use href="#i-max" />
            </svg>
          </button>
          <button type="button" className="close" title="关闭" onClick={() => windowAction("close")}>
            <svg className="ic sm">
              <use href="#i-x" />
            </svg>
          </button>
        </div>
      </header>

      <div className="body">
        <main className="main" data-component="main-panel" data-type="container">
          {children}
        </main>
        <aside className="sidebar" data-component="sidebar" data-type="container">
          {sidebar}
        </aside>
      </div>
    </div>
  );
}
