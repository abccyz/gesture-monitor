export interface TelemetryMetric {
  /** 指标名，如 "ΔX 水平位移" */
  key: string;
  /** 数值文本，如 "+12.4" */
  value: string;
  /** 单位，如 "px" / "×" / "°" */
  unit: string;
  /** 进度条百分比 0-100 */
  percent: number;
  /** 进度条颜色（CSS 值），如 "var(--cyan)" */
  color: string;
}

export interface LiveTelemetryProps {
  /** 右上角时间戳，设计稿显示为 "t=14:32:07.412" */
  timestamp?: string;
  /** 当前手势标题，如 "3 指滑动 · 上" */
  gestureLabel?: string;
  /** 当前手势副标题，如 "swipe · fingers=3 · direction=up" */
  gestureMeta?: string;
  /** 方向箭头 sprite 图标 id */
  arrowIcon?: string;
  /** 手势相位，如 "end" */
  phase?: string;
  metrics?: TelemetryMetric[];
  /** 罗盘信息：识别方向 */
  directionLabel?: string;
  /** 罗盘信息：累计位移 */
  totalDisplacement?: string;
  /** 罗盘信息：手势类型 */
  gestureType?: string;
  /** 罗盘信息：触发动作 */
  triggeredAction?: string;
}

export default function LiveTelemetry({
  timestamp,
  gestureLabel,
  gestureMeta,
  arrowIcon = "i-up",
  phase,
  metrics = [],
  directionLabel,
  totalDisplacement,
  gestureType,
  triggeredAction,
}: LiveTelemetryProps) {
  const hasData = Boolean(gestureLabel) || metrics.length > 0;
  const dash = (v?: string) => (v == null || v === "" ? "—" : v);

  return (
    <section className="card telemetry" data-component="live-telemetry" data-type="card">
      <div className="card-head">
        <svg className="ic sm">
          <use href="#i-wave" />
        </svg>
        <h2>实时遥测</h2>
        <span className="spacer" />
        <span className="asof num">t={dash(timestamp)}</span>
      </div>
      <div className="card-body">
        {!hasData ? (
          <div className="m-empty">等待手势输入</div>
        ) : (
          <>
            <div className="now-gesture">
              <div className="now-arrow">
                <svg className="ic">
                  <use href={`#${arrowIcon}`} />
                </svg>
              </div>
              <div className="now-text">
                <div className="t1">{gestureLabel}</div>
                <div className="t2">{gestureMeta}</div>
              </div>
              <span className="phase-tag">{dash(phase)}</span>
            </div>

            <div className="metric-grid">
              {metrics.map((m) => (
                <div className="metric" key={m.key}>
                  <div className="k">{m.key}</div>
                  <div className="v num">
                    {m.value}
                    <small>{m.unit}</small>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${m.percent}%`, background: m.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="compass-row">
              <svg className="compass" viewBox="0 0 112 112">
                <circle className="ring" cx="56" cy="56" r="46" />
                <circle className="ring" cx="56" cy="56" r="30" strokeDasharray="2 4" />
                <line className="cross" x1="56" y1="8" x2="56" y2="104" />
                <line className="cross" x1="8" y1="56" x2="104" y2="56" />
                <text x="56" y="18">N</text>
                <text x="56" y="102">S</text>
                <text x="14" y="60">W</text>
                <text x="98" y="60">E</text>
                <polygon className="arrow" points="56,20 64,40 56,34 48,40" />
                <circle cx="56" cy="56" r="3" fill="#4fd1c5" />
              </svg>
              <div className="compass-info">
                <div className="row">
                  <span>识别方向</span>
                  <span>{dash(directionLabel)}</span>
                </div>
                <div className="row">
                  <span>累计位移</span>
                  <span className="num">{dash(totalDisplacement)}</span>
                </div>
                <div className="row">
                  <span>手势类型</span>
                  <span>{dash(gestureType)}</span>
                </div>
                <div className="row">
                  <span>触发动作</span>
                  <span style={{ color: "var(--green)" }}>{dash(triggeredAction)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
