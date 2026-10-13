import type { ReactNode } from "react";
import ViewTabs, { type ViewTabId, type ViewTabsProps } from "./ViewTabs";
import TouchpadVisualization, { type TouchpadVisualizationProps } from "./TouchpadVisualization";
import LiveTelemetry, { type LiveTelemetryProps } from "./LiveTelemetry";
import GestureEventStream, { type GestureEventStreamProps } from "./GestureEventStream";

export interface MainPanelProps {
  /** 当前视图（visualization / log / mappings） */
  view?: ViewTabId;
  /** 顶部视图标签栏配置 */
  tabs?: ViewTabsProps;
  /** 触控板可视化配置 */
  touchpad?: TouchpadVisualizationProps;
  /** 实时遥测配置 */
  telemetry?: LiveTelemetryProps;
  /** 手势事件流配置 */
  events?: GestureEventStreamProps;
  /** 手势映射视图内容（仅 view="mappings" 时渲染） */
  mappings?: ReactNode;
}

/**
 * 主栏（渲染于 AppShell 的 <main class="main" data-component="main-panel"> 内）。
 * 对应设计稿 .tabs / .main-top(.viz + .telemetry) / .events 三段。
 * ponytail: 根节点用 fragment —— .main 已提供 flex 列布局与 gap，多包一层会破坏设计稿间距。
 */
export default function MainPanel({
  view = "visualization",
  tabs = {},
  touchpad = {},
  telemetry = {},
  events = {},
  mappings,
}: MainPanelProps) {
  return (
    <>
      <ViewTabs {...tabs} />
      {view === "visualization" && (
        <div className="main-top">
          <TouchpadVisualization {...touchpad} />
          <LiveTelemetry {...telemetry} />
        </div>
      )}
      {view === "mappings" && mappings}
      {view !== "mappings" && <GestureEventStream {...events} />}
    </>
  );
}
