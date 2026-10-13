import type { Device } from "../types";

export interface DeviceListProps {
  /** 后端枚举到的触控板设备 */
  devices: Device[];
  /** 覆盖头部状态文案，默认按连接数派生 */
  connectionLabel?: string;
}

const STATE_LABELS: Record<string, string> = {
  connected: "已连接",
  listening: "监听中",
  disconnected: "已断开",
  paired: "已配对",
};

const ACTIVE_STATES = ["connected", "listening", "paired"];

const isActive = (state?: string) => ACTIVE_STATES.includes((state ?? "").toLowerCase());
const stateLabel = (state?: string) => (state ? STATE_LABELS[state.toLowerCase()] ?? state : "未知");

export default function DeviceList({ devices, connectionLabel }: DeviceListProps) {
  const activeCount = devices.filter((d) => isActive(d.connectionState)).length;
  const asof = connectionLabel ?? (devices.length === 0 ? "未连接" : `${activeCount} 个已连接`);

  return (
    <section className="card devices-card" data-component="device-list" data-type="list">
      <div className="card-head">
        <svg className="ic sm"><use href="#i-monitor" /></svg>
        <h2>触控板设备</h2>
        <span className="spacer" />
        <span className="asof num" role="status" aria-live="polite">{asof}</span>
      </div>
      <div className="card-body">
        {devices.length === 0 ? (
          <div className="m-empty">未检测到触控板设备</div>
        ) : (
          devices.map((d, i) => {
            const on = isActive(d.connectionState);
            /* 设计稿口径：设备路径 · seat */
            const meta = [d.sys_name, d.seat].filter(Boolean).join(" · ");
            return (
              <div className="dev" key={`${d.name}-${i}`}>
                <div className="dev-ic"><svg className="ic"><use href="#i-cpu" /></svg></div>
                <div className="dev-txt">
                  <div className="n">{d.name}</div>
                  <div className="s mono">{meta || "—"}</div>
                </div>
                <div className="dev-state" style={on ? undefined : { color: "var(--red)" }}>
                  <span className="dot" style={on ? undefined : { background: "var(--red)" }} />
                  {stateLabel(d.connectionState)}
                </div>
              </div>
            );
          })
        )}

        {/* 设计稿口径：权限提示常驻显示 */}
        <div className="tip">
          <div className="t">
            <svg className="ic sm"><use href="#i-info" /></svg>
            <span>需要 <b style={{ color: "var(--text)" }}>input</b> 组权限才能访问触控板设备，重新登录后生效。</span>
          </div>
          <code className="mono">sudo usermod -aG input $USER</code>
        </div>
      </div>
    </section>
  );
}
