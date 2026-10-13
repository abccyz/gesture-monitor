import type React from "react";

// ---------- 手势事件（后端 "gesture-event" 事件载荷）----------
export interface GestureEvent {
  gesture_type: string;
  finger_count: number;
  direction: string;
  dx: number;
  dy: number;
  scale: number;
  angle_delta: number;
  phase: string;
  timestamp: string;
  label: string;
  action_triggered: string | null;
  /** 累计位移（px）；缺省时前端按 hypot(dx, dy) 计算 */
  total_displacement?: number;
  count?: number;
}

// ---------- 触控板设备 ----------
export type ConnectionState = "connected" | "disconnected" | "listening";

export interface Device {
  name: string;
  sys_name?: string;
  /** 设备所在 seat（设备卡副标题第二段），如 "seat0" */
  seat?: string;
  has_gesture?: boolean;
  connectionState?: ConnectionState;
  batteryLevel?: number;
  lastSeenAt?: string;
}

// ---------- 手势映射（后端 actions::GestureMapping）----------
export interface GestureMappingKey {
  gesture_type: string;
  finger_count: number;
  direction: string;
}

export interface GestureMapping {
  id: string;
  key: GestureMappingKey;
  action_name: string;
  action_cmd: string;
  action_args: string[];
  macos_equivalent: string;
  enabled: boolean;
}

// ---------- 手势统计（会话聚合，前端派生）----------
export interface GestureStat {
  gestureType: string;
  count: number;
  avgConfidence?: number;
  lastTriggeredAt?: string;
}

// ---------- 应用外壳 ----------
export interface AppShellProps {
  /** 标题栏品牌名，默认 "Gesture Monitor" */
  title?: string;
  /** 标题栏副标题，默认 "libinput · Tauri 2 · v0.1.0" */
  subtitle?: string;
  /** 监听 seat，如 "seat0" */
  seat?: string;
  connectionState: ConnectionState;
  isCapturing: boolean;
  /** 已启用手势映射数（标题栏 chip） */
  mappingsEnabled?: number;
  /** 手势映射总数（标题栏 chip） */
  mappingsTotal?: number;
  /** 会话时长，格式 mm:ss */
  sessionElapsed?: string;
  /** 手势映射面板是否展开 */
  mappingsOpen?: boolean;
  onToggleCapture?: () => void;
  onOpenMappings?: () => void;
  /** 主面板（.main）内容 */
  children: React.ReactNode;
  /** 侧栏（.sidebar）内容 */
  sidebar?: React.ReactNode;
}
