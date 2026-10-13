import { useState } from "react";

export type GestureStatus = "ok" | "off" | "fail";

export interface GestureStreamRow {
  id: string;
  /** 时间列，等宽字体，如 "14:32:07.412" */
  time: string;
  /** 手势列：sprite 图标 id + 文案 */
  gesture: { icon: string; label: string };
  /** 手指列，如 "3 指" */
  fingers: string;
  /** 方向列：null 渲染为 — */
  direction: { icon: string; label: string } | null;
  /** 触发动作：名称 + 快捷键组合 */
  action: { name: string; combo: string };
  status: GestureStatus;
}

export interface GestureEventStreamProps {
  rows?: GestureStreamRow[];
  /** 头部过滤标签 */
  filters?: string[];
  /** 非受控初始过滤项 */
  defaultFilter?: string;
  onFilterChange?: (filter: string) => void;
  /** 右上清空按钮 */
  onClear?: () => void;
  /** 底部左侧文案 */
  visibleLabel?: string;
  /** 底部成功率 */
  successRate?: string;
  /** 底部最近更新时间 */
  updatedAt?: string;
}

export const DEFAULT_GESTURE_FILTERS = ["全部", "已触发", "滑动"];

const STATUS_LABEL: Record<GestureStatus, string> = {
  ok: "成功",
  off: "已禁用",
  fail: "失败",
};

/** 按过滤标签筛选事件行 */
function matchFilter(row: GestureStreamRow, filter: string) {
  if (filter === "已触发") return row.status === "ok";
  if (filter === "滑动") return row.gesture.label === "滑动";
  return true;
}

export default function GestureEventStream({
  rows = [],
  filters = DEFAULT_GESTURE_FILTERS,
  defaultFilter = DEFAULT_GESTURE_FILTERS[0],
  onFilterChange,
  onClear,
  visibleLabel,
  successRate,
  updatedAt,
}: GestureEventStreamProps) {
  const [filter, setFilter] = useState(defaultFilter);
  const visible = rows.filter((row) => matchFilter(row, filter));

  const handleFilter = (next: string) => {
    setFilter(next);
    onFilterChange?.(next);
  };

  return (
    <section
      className="card events"
      data-component="gesture-event-stream"
      data-type="table"
    >
      <div className="card-head">
        <svg className="ic sm">
          <use href="#i-list" />
        </svg>
        <h2>手势事件流</h2>
        <span className="spacer" />
        <div className="mini-tabs">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              className={item === filter ? "on" : undefined}
              onClick={() => handleFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost" type="button" onClick={onClear}>
          <svg className="ic sm">
            <use href="#i-trash" />
          </svg>
          清空
        </button>
      </div>
      <div className="card-body" style={{ padding: "var(--s3) var(--s3) 0" }}>
        <table>
          <colgroup>
            <col style={{ width: 126 }} />
            <col style={{ width: 104 }} />
            <col style={{ width: 66 }} />
            <col style={{ width: 104 }} />
            <col />
            <col style={{ width: 92 }} />
          </colgroup>
          <thead>
            <tr>
              <th>时间</th>
              <th>手势</th>
              <th>手指</th>
              <th>方向</th>
              <th>触发动作</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    color: "var(--text-3)",
                    padding: "var(--s5) 0",
                  }}
                >
                  暂无手势事件
                </td>
              </tr>
            )}
            {visible.map((row) => (
              <tr key={row.id}>
                <td className="time mono num">{row.time}</td>
                <td className="gesture">
                  <span className="gcell">
                    <svg className="ic sm">
                      <use href={`#${row.gesture.icon}`} />
                    </svg>
                    {row.gesture.label}
                  </span>
                </td>
                <td className="num">{row.fingers}</td>
                <td>
                  {row.direction ? (
                    <span className="gcell">
                      <svg className="ic sm">
                        <use href={`#${row.direction.icon}`} />
                      </svg>
                      {row.direction.label}
                    </span>
                  ) : (
                    <span className="gcell" style={{ color: "var(--text-3)" }}>
                      —
                    </span>
                  )}
                </td>
                <td className="action">
                  {row.action.name}{" "}
                  <span
                    className="mono"
                    style={{ color: "var(--text-3)", fontSize: 11 }}
                  >
                    {row.action.combo}
                  </span>
                </td>
                <td>
                  <span className={`pill ${row.status}`}>
                    {row.status === "ok" && (
                      <svg className="ic" style={{ width: 11, height: 11 }}>
                        <use href="#i-check" />
                      </svg>
                    )}
                    {STATUS_LABEL[row.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-foot">
        <span>{visibleLabel ?? `显示 ${visible.length} / ${rows.length} 条事件`}</span>
        <span className="tb-spacer" />
        <span className="num">{successRate}</span>
        <span className="num">{updatedAt}</span>
      </div>
    </section>
  );
}
