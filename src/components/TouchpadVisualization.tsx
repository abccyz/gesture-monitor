export interface TouchpadFinger {
  /** 手指在触控板内的水平位置（百分比） */
  left: number;
  /** 手指在触控板内的垂直位置（百分比） */
  top: number;
}

export interface TouchpadLegend {
  swatch?: "cyan" | "gold";
  text: string;
}

export interface TouchpadVisualizationProps {
  /** 右上角时间戳，设计稿为 "实时 · 14:32:07.412" */
  asof?: string;
  /** 手指位置（百分比坐标） */
  fingers?: TouchpadFinger[];
  /** 轨迹 SVG path d 值，第一条默认带动画 */
  trailPaths?: string[];
  /** 触控板上方动作提示文字 */
  actionLabel?: string;
  actionIcon?: string;
  /** 触控板下方手势提示文字 */
  swipeLabel?: string;
  swipeIcon?: string;
  swipeColor?: string;
  legends?: TouchpadLegend[];
}

export default function TouchpadVisualization({
  asof = "实时",
  fingers = [],
  trailPaths = [],
  actionLabel,
  actionIcon = "i-zap",
  swipeLabel,
  swipeIcon = "i-up",
  swipeColor = "var(--cyan)",
  legends = [],
}: TouchpadVisualizationProps) {
  const idle = fingers.length === 0 && trailPaths.length === 0;

  return (
    <section className="card viz" data-component="touchpad-visualization" data-type="media">
      <div className="card-head">
        <svg className="ic sm">
          <use href="#i-hand" />
        </svg>
        <h2>触控板可视化</h2>
        <span className="spacer" />
        <span className="asof num">{asof}</span>
      </div>
      <div className="card-body">
        <div className="laptop">
          <div className="hinge" />
          <div className="deck">
            <div className="touchpad">
              <div className="tp-glow" />
              <svg className="trail" viewBox="0 0 100 62" preserveAspectRatio="none">
                {trailPaths.map((d, i) =>
                  i === 0 ? (
                    <path key={d} d={d} />
                  ) : (
                    <path key={d} d={d} strokeDasharray="none" style={{ animation: "none" }} />
                  )
                )}
              </svg>
              <span className="tp-tick tl mono">0,0</span>
              <span className="tp-tick tr mono">x=+</span>
              <span className="tp-tick bl mono">y=+</span>
              <span className="tp-tick br mono">abs</span>
              {fingers.map((f, i) => (
                <div
                  key={`${f.left}-${f.top}-${i}`}
                  className={`finger f${i + 1}`}
                  style={{ left: `${f.left}%`, top: `${f.top}%` }}
                />
              ))}
              {idle && (
                <span
                  className="mono"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "var(--text-3)",
                    fontSize: 11,
                  }}
                >
                  等待手势输入
                </span>
              )}
              {actionLabel && (
                <div className="tp-action">
                  <svg className="ic sm">
                    <use href={`#${actionIcon}`} />
                  </svg>
                  {actionLabel}
                </div>
              )}
              {swipeLabel && (
                <div className="tp-label">
                  <svg className="ic sm" style={{ color: swipeColor }}>
                    <use href={`#${swipeIcon}`} />
                  </svg>
                  {swipeLabel}
                </div>
              )}
            </div>
          </div>
          <div className="front-edge" />
        </div>

        {legends.length > 0 && (
          <div className="viz-caption">
            {legends.map((l) => (
              <span className="legend" key={l.text}>
                {l.swatch && <i className={`swatch ${l.swatch}`} />}
                {l.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
