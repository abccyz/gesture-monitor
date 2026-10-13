import { useState } from "react";

export type ViewTabId = "visualization" | "log" | "mappings";

export interface ViewTabItem {
  id: string;
  label: string;
  /** sprite 图标 id，如 "i-hand" */
  icon: string;
  /** 标签右侧数字徽标，如 12 / 13 */
  badge?: number | string;
}

export interface ViewTabsProps {
  items?: ViewTabItem[];
  /** 受控选中项 */
  activeId?: string;
  /** 非受控初始选中项，默认第一个标签 */
  defaultActiveId?: string;
  onChange?: (id: string) => void;
  /** 右侧元信息，设计稿为 "采样 120 Hz · 延迟 8 ms" */
  meta?: string;
}

export const DEFAULT_VIEW_TABS: ViewTabItem[] = [
  { id: "visualization", label: "触控板可视化", icon: "i-hand" },
  { id: "log", label: "事件日志", icon: "i-list", badge: 12 },
  { id: "mappings", label: "手势映射", icon: "i-gear", badge: 13 },
];

export default function ViewTabs({
  items = DEFAULT_VIEW_TABS,
  activeId,
  defaultActiveId = DEFAULT_VIEW_TABS[0].id,
  onChange,
  meta = "采样 120 Hz · 延迟 8 ms",
}: ViewTabsProps) {
  const [innerActive, setInnerActive] = useState(defaultActiveId);
  const active = activeId ?? innerActive;

  const handleClick = (id: string) => {
    if (activeId === undefined) setInnerActive(id);
    onChange?.(id);
  };

  return (
    <nav className="tabs" data-component="view-tabs" data-type="navigation">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={item.id === active ? "tab active" : "tab"}
          onClick={() => handleClick(item.id)}
        >
          <svg className="ic sm">
            <use href={`#${item.icon}`} />
          </svg>
          {item.label}
          {item.badge != null && <span className="badge num">{item.badge}</span>}
        </button>
      ))}
      <span className="tb-spacer" />
      <span className="meta num">{meta}</span>
    </nav>
  );
}
