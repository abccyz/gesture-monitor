import type { Device, GestureEvent } from "../types";
import GestureStats from "./GestureStats";
import DeviceList from "./DeviceList";

export interface RightSidebarProps {
  /** 本会话手势事件（统计卡聚合） */
  events: GestureEvent[];
  /** 已枚举的触控板设备 */
  devices: Device[];
  /** 会话时长（分钟），统计卡右上角显示 "本会话 · 42 分钟" */
  sessionMinutes?: number;
}

/**
 * 右栏（.sidebar）：手势统计 + 触控板设备。
 * 与设计稿一致只有两张卡；映射表在中间栏的「映射」标签页中展示。
 */
export default function RightSidebar({
  events,
  devices,
  sessionMinutes,
}: RightSidebarProps) {
  return (
    <>
      <GestureStats events={events} sessionMinutes={sessionMinutes} />
      <DeviceList devices={devices} />
    </>
  );
}
