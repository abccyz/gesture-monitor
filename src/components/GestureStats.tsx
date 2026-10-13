import type { GestureEvent } from "../types";

export interface GestureStatsProps {
  /** 本会话捕获的手势事件（后端 "gesture-event" 事件载荷） */
  events: GestureEvent[];
  /** 本会话时长（分钟），头部显示 "本会话 · 42 分钟" */
  sessionMinutes?: number;
}

/** 手势类型 → 中文名（未知类型回退到原始 key） */
const TYPE_LABELS: Record<string, string> = {
  swipe: "滑动",
  pinch: "捏合",
  rotate: "旋转",
  hold: "长按",
  tap: "轻点",
};

/** 分类配色，按事件量降序循环取用（仅用 tokens.css 中的调色板） */
const TYPE_STYLES = [
  { color: "var(--gold)", swatch: "swatch gold" },
  { color: "var(--cyan)", swatch: "swatch cyan" },
  { color: "var(--violet)", swatch: "swatch violet" },
  { color: "var(--blue)", swatch: "swatch blue" },
];

const DIRECTION_CHIPS: { key: string; label: string; icon?: string }[] = [
  { key: "up", label: "上", icon: "i-up" },
  { key: "down", label: "下", icon: "i-down" },
  { key: "left", label: "左", icon: "i-left" },
  { key: "right", label: "右", icon: "i-right" },
  { key: "pinch_out", label: "张开", icon: "i-pinch" },
  { key: "pinch_in", label: "捏入", icon: "i-pinch" },
  { key: "rotate_cw", label: "顺转" },
  { key: "rotate_ccw", label: "逆转" },
];

const FINGER_TILES = [2, 3, 4];
const RECENT_WINDOW_MS = 60_000;

const fmt = (n: number) => n.toLocaleString("en-US");

export default function GestureStats({ events, sessionMinutes = 0 }: GestureStatsProps) {
  const typeCounts = new Map<string, number>();
  const fingerCounts = new Map<number, number>();
  const directionCounts = new Map<string, number>();
  let succeeded = 0;
  let recent = 0;
  const now = Date.now();

  for (const e of events) {
    typeCounts.set(e.gesture_type, (typeCounts.get(e.gesture_type) ?? 0) + 1);
    fingerCounts.set(e.finger_count, (fingerCounts.get(e.finger_count) ?? 0) + 1);
    directionCounts.set(e.direction, (directionCounts.get(e.direction) ?? 0) + 1);
    if (e.action_triggered) succeeded += 1;
    const t = Date.parse(e.timestamp);
    if (Number.isFinite(t) && now - t <= RECENT_WINDOW_MS) recent += 1;
  }

  const total = events.length;

  const topTypes = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxTypeCount = topTypes.length > 0 ? topTypes[0][1] : 0;

  return (
    <section className="card stats-card" data-component="gesture-stats">
      <div className="card-head">
        <svg className="ic sm"><use href="#i-bars" /></svg>
        <h2>手势统计</h2>
        <span className="spacer" />
        <span className="asof num">本会话 · {sessionMinutes} 分钟</span>
      </div>
      <div className="card-body">
        {total === 0 ? (
          <div className="m-empty">本会话暂未捕获手势事件</div>
        ) : (
          <>
            <div className="kpi">
              <div>
                <div className="big num">{fmt(total)}</div>
                <div className="lab">手势识别总数</div>
              </div>
              <div className="side">
                <div className="delta">
                  <svg className="ic sm"><use href="#i-up" /></svg>
                  {`近 1 分钟 ${recent} 次`}
                </div>
                <div className="line">触发成功 <b className="num">{fmt(succeeded)}</b></div>
                <div className="line">失败 / 禁用 <b className="num">{fmt(total - succeeded)}</b></div>
              </div>
            </div>

            <div className="sec">
              <div className="sec-title">按类型分布<span className="r num">共 {fmt(total)}</span></div>
              <div className="bars">
                {topTypes.map(([type, count], i) => {
                  const style = TYPE_STYLES[i % TYPE_STYLES.length];
                  return (
                    <div className="barrow" key={type}>
                      <div className="nm">
                        <span className={style.swatch} />
                        {TYPE_LABELS[type] ?? type}
                      </div>
                      <div className="track">
                        <i
                          style={{
                            width: `${maxTypeCount > 0 ? Math.round((count / maxTypeCount) * 100) : 0}%`,
                            background: style.color,
                          }}
                        />
                      </div>
                      <div className="vl num">{fmt(count)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sec">
              <div className="sec-title">按手指数</div>
              <div className="finger-tiles">
                {FINGER_TILES.map((n) => (
                  <div className="ftile" key={n}>
                    <div className="v num">{fmt(fingerCounts.get(n) ?? 0)}</div>
                    <div className="k">{n} 指</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sec">
              <div className="sec-title">按方向</div>
              <div className="dir-chips">
                {DIRECTION_CHIPS.map((d) => (
                  <span className="dchip" key={d.key}>
                    {d.icon ? <svg className="ic sm"><use href={`#${d.icon}`} /></svg> : null}
                    {d.label} <b className="num">{fmt(directionCounts.get(d.key) ?? 0)}</b>
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
