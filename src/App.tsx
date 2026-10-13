import { useCallback, useEffect, useMemo, useState } from "react";
import { core, event } from "@tauri-apps/api";
import AppShell from "./components/AppShell";
import MainPanel from "./components/MainPanel";
import IconSprite from "./components/IconSprite";
import { type ViewTabId, type ViewTabItem } from "./components/ViewTabs";
import RightSidebar from "./components/RightSidebar";
import {
  DEFAULT_GESTURE_FILTERS,
  type GestureStreamRow,
} from "./components/GestureEventStream";
import GestureMappings from "./components/GestureMappings";
import type { TelemetryMetric } from "./components/LiveTelemetry";
import type { TouchpadFinger } from "./components/TouchpadVisualization";
import type { Device, GestureEvent, GestureMapping } from "./types";

const { invoke } = core;
const { listen } = event;

/** 事件流最多保留条数（内存上限，防止长期监听撑爆） */
const MAX_EVENTS = 200;

const GESTURE_ICONS: Record<string, string> = {
  swipe: "i-hand",
  pinch: "i-pinch",
  rotate: "i-wave",
  hold: "i-hand",
  tap: "i-hand",
};

const GESTURE_LABELS: Record<string, string> = {
  swipe: "滑动",
  pinch: "捏合",
  rotate: "旋转",
  hold: "长按",
  tap: "轻点",
};

interface DirectionMeta {
  label: string;
  icon: string;
  arrow: string;
}

const DIRECTION_META: Record<string, DirectionMeta> = {
  up: { label: "上", icon: "i-up", arrow: "↑" },
  down: { label: "下", icon: "i-down", arrow: "↓" },
  left: { label: "左", icon: "i-left", arrow: "←" },
  right: { label: "右", icon: "i-right", arrow: "→" },
  pinch_in: { label: "捏入", icon: "i-pinch", arrow: "⇱" },
  pinch_out: { label: "张开", icon: "i-pinch", arrow: "⇲" },
  rotate_cw: { label: "顺转", icon: "i-wave", arrow: "↻" },
  rotate_ccw: { label: "逆转", icon: "i-wave", arrow: "↺" },
};

const gestureIcon = (type: string) => GESTURE_ICONS[type] ?? "i-hand";
const gestureLabel = (type: string) => GESTURE_LABELS[type] ?? type;

/** 方向 → 图标（无方向或未知回退到右箭头位形） */
const directionIcon = (dir?: string) =>
  (dir && DIRECTION_META[dir]?.icon) || "i-right";

/** 方向 → 中文名（无方向或未知回退到 —） */
const directionLabel = (dir?: string) =>
  (dir && DIRECTION_META[dir]?.label) || "—";

/** 毫秒 → mm:ss */
const mmss = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

/** 手指落点模板：与设计稿触控板内的 1/2/3/4 指布局一致（百分比坐标） */
const FINGER_LAYOUTS: Record<number, TouchpadFinger[]> = {
  1: [{ left: 50, top: 49 }],
  2: [
    { left: 40, top: 56 },
    { left: 60, top: 56 },
  ],
  3: [
    { left: 40, top: 56 },
    { left: 50, top: 50 },
    { left: 60, top: 56 },
  ],
  4: [
    { left: 39, top: 52 },
    { left: 47, top: 43 },
    { left: 55, top: 43 },
    { left: 63, top: 52 },
  ],
};

/** 带符号数值文本：正数补 +，负数用 U+2212 减号（与设计稿排版一致） */
const signed = (value: number, digits = 1) => {
  const text = Math.abs(value).toFixed(digits);
  if (Math.abs(value) < 0.05) return text;
  return value > 0 ? `+${text}` : `\u2212${text}`;
};

/** 实时事件 → 事件流行（快捷键取自映射表，未命中时回退手势标签） */
const toStreamRow = (
  item: GestureEvent,
  mappings: GestureMapping[],
): GestureStreamRow => {
  const mapped = mappings.find(
    (m) =>
      m.key.gesture_type === item.gesture_type &&
      m.key.finger_count === item.finger_count &&
      (m.key.direction ?? "") === (item.direction ?? ""),
  );
  return {
    id: `${item.timestamp}-${item.gesture_type}-${item.finger_count}`,
    time: formatClock(item.timestamp),
    gesture: {
      icon: gestureIcon(item.gesture_type),
      label: gestureLabel(item.gesture_type),
    },
    fingers: `${item.finger_count} 指`,
    direction: item.direction
      ? {
          icon: directionIcon(item.direction),
          label: directionLabel(item.direction),
        }
      : null,
    action: {
      name: item.action_triggered ?? "—",
      combo: mapped ? mapped.action_args.join(" ") : item.label,
    },
    status: item.action_triggered ? "ok" : "off",
  };
};

export default function App() {
  // 全部状态均为空初值：界面只呈现后端真实推送的数据，不做任何种/假数据兜底
  const [events, setEvents] = useState<GestureEvent[]>([]);
  const [status, setStatus] = useState<string>("idle");
  const [devices, setDevices] = useState<Device[]>([]);
  const [mappings, setMappings] = useState<GestureMapping[]>([]);
  const [backendReady, setBackendReady] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState<ViewTabId>("visualization");
  const [isCapturing, setIsCapturing] = useState(false);
  const [killSwitchEnabled, setKillSwitchEnabled] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  // ---------- 后端事件订阅 ----------
  useEffect(() => {
    const disposers: Array<() => void> = [];
    void (async () => {
      disposers.push(
        await listen<GestureEvent>("gesture-event", (evt) => {
          setEvents((prev) => [evt.payload, ...prev].slice(0, MAX_EVENTS));
        }),
      );
      disposers.push(
        await listen<string>("gesture-status", (evt) => {
          setStatus(evt.payload);
          setIsCapturing(evt.payload === "listening");
        }),
      );
      disposers.push(
        await listen<string>("gesture-error", (evt) => {
          setError(evt.payload);
          setStatus("error");
          setIsCapturing(false);
        }),
      );
    })();
    return () => disposers.forEach((dispose) => dispose());
  }, []);

  // ---------- 初始加载：拉取真实设备与映射，随即开始监听 ----------
  useEffect(() => {
    void (async () => {
      try {
        const [devs, maps] = await Promise.all([
          invoke<Device[]>("get_devices"),
          invoke<GestureMapping[]>("get_mappings"),
        ]);
        setDevices(devs);
        setMappings(maps);
        setBackendReady(true);
        // 幂等：已在监听时后端直接返回，不重复启动
        await invoke("start_listening");
        setStatus("listening");
        setIsCapturing(true);
      } catch (e) {
        // 非 Tauri 宿主（浏览器预览）下后端不可用 → 保持空态并给出提示
        setStatus("error");
        setError(String(e));
      }
    })();
  }, []);

  // ---------- 实时时钟 / 会话计时（均取真实时间）----------
  const [now, setNow] = useState(() => formatClock(new Date().toISOString()));

  useEffect(() => {
    const id = window.setInterval(
      () => setNow(formatClock(new Date().toISOString())),
      200,
    );
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isCapturing) return;
    const id = window.setInterval(() => setElapsedMs((v) => v + 1000), 1000);
    return () => window.clearInterval(id);
  }, [isCapturing]);

  // ---------- 控制回调 ----------
  const toggleCapture = useCallback(async () => {
    if (isCapturing) {
      try {
        await invoke("stop_listening");
      } catch (e) {
        setError(String(e));
      }
      setIsCapturing(false);
      setStatus("idle");
    } else {
      setElapsedMs(0);
      setError("");
      try {
        await invoke("start_listening");
        setIsCapturing(true);
        setStatus("listening");
      } catch (e) {
        setError(String(e));
      }
    }
  }, [isCapturing]);

  const openMappings = useCallback(() => setActiveTab("mappings"), []);

  const clearEvents = useCallback(() => setEvents([]), []);

  const toggleKillSwitch = useCallback(() => {
    const next = !killSwitchEnabled;
    setKillSwitchEnabled(next);
    if (next) {
      // 紧急停止：立即停止监听，后端不再触发任何动作
      void invoke("stop_listening").catch(() => {});
      setIsCapturing(false);
      setStatus("idle");
    }
  }, [killSwitchEnabled]);

  const toggleMapping = useCallback(
    async (id: string) => {
      const target = mappings.find((m) => m.id === id);
      if (!target) return;
      try {
        const list = await invoke<GestureMapping[]>("update_mapping", {
          updated: { ...target, enabled: !target.enabled },
        });
        setMappings(list);
      } catch (e) {
        setError(String(e));
      }
    },
    [mappings],
  );

  const isLive = isCapturing && !killSwitchEnabled;

  // 最近一次事件（后端按时间倒序推送，取第一条作为“当前”）。
  // 无事件时为 undefined，由各子组件渲染等待/空态，不填充任何假数据。
  const latest = events[0];

  // 事件流行由「事件 × 映射」派生，不额外维护一份状态
  const streamRows: GestureStreamRow[] = useMemo(
    () => events.map((item) => toStreamRow(item, mappings)),
    [events, mappings],
  );

  // 统计口径：仅本进程采集到的真实事件
  const totalCount = events.length;
  const triggered = events.filter((event) => event.action_triggered).length;
  const successRate = totalCount
    ? `触发成功率 ${((triggered / totalCount) * 100).toFixed(1)}%`
    : "触发成功率 —";

  const tabItems: ViewTabItem[] = [
    { id: "visualization", label: "触控板可视化", icon: "i-hand" },
    { id: "log", label: "事件日志", icon: "i-list", badge: events.length },
    { id: "mappings", label: "手势映射", icon: "i-gear", badge: mappings.length },
  ];

  const metrics: TelemetryMetric[] = latest
    ? [
        {
          key: "ΔX 水平位移",
          value: signed(latest.dx),
          unit: "px",
          percent: clampPercent(latest.dx * 4),
          color: "var(--cyan)",
        },
        {
          key: "ΔY 垂直位移",
          value: signed(latest.dy),
          unit: "px",
          percent: clampPercent(latest.dy * 4),
          color: "var(--gold)",
        },
        {
          key: "缩放 scale",
          value: latest.scale.toFixed(2),
          unit: "×",
          percent: clampPercent((latest.scale - 1) * 100),
          color: "var(--blue)",
        },
        {
          key: "旋转角度",
          value: signed(latest.angle_delta),
          unit: "°",
          percent: clampPercent(latest.angle_delta * 3),
          color: "var(--violet)",
        },
      ]
    : [];

  // 手指落点取自设计稿的 1/2/3/4 指模板，避免多点线性堆叠
  const fingers: TouchpadFinger[] = latest
    ? (FINGER_LAYOUTS[Math.min(4, Math.max(1, latest.finger_count))] ??
      FINGER_LAYOUTS[1])
    : [];

  return (
    <>
      {/* 图标 sprite 需常驻 DOM，所有 <use href="#i-*"> 依赖它 */}
      <IconSprite />
      <AppShell
        connectionState={
          isLive ? "listening" : backendReady ? "connected" : "disconnected"
        }
        isCapturing={isLive}
        mappingsEnabled={mappings.filter((m) => m.enabled).length}
        mappingsTotal={mappings.length}
        sessionElapsed={mmss(elapsedMs)}
        mappingsOpen={activeTab === "mappings"}
        onToggleCapture={toggleCapture}
        onOpenMappings={openMappings}
        sidebar={
          <RightSidebar
            events={events}
            devices={devices}
            sessionMinutes={Math.floor(elapsedMs / 60_000)}
          />
        }
      >
        <MainPanel
          view={activeTab}
          tabs={{
            items: tabItems,
            activeId: activeTab,
            onChange: (id) => setActiveTab(id as ViewTabId),
          }}
          touchpad={
            latest
              ? {
                  asof: `实时 · ${now}`,
                  fingers,
                  actionLabel: latest.action_triggered ?? undefined,
                  actionIcon: gestureIcon(latest.gesture_type),
                  swipeLabel: latest.label,
                  swipeIcon: directionIcon(latest.direction),
                }
              : undefined
          }
          telemetry={
            latest
              ? {
                  timestamp: now,
                  gestureLabel: `${gestureLabel(latest.gesture_type)} · ${directionLabel(latest.direction)}`,
                  gestureMeta: `${latest.gesture_type} · fingers=${latest.finger_count} · direction=${latest.direction}`,
                  arrowIcon: directionIcon(latest.direction),
                  phase: latest.phase,
                  metrics,
                  directionLabel: `${DIRECTION_META[latest.direction]?.arrow ?? ""} ${directionLabel(latest.direction)} · ${latest.direction}`,
                  totalDisplacement: `${Math.hypot(latest.dx, latest.dy).toFixed(1)} px`,
                  gestureType: `${gestureLabel(latest.gesture_type)} ${latest.gesture_type}`,
                  triggeredAction: latest.action_triggered ?? undefined,
                }
              : undefined
          }
          events={{
            rows: streamRows,
            filters: DEFAULT_GESTURE_FILTERS,
            onClear: clearEvents,
            successRate,
            updatedAt: now,
          }}
          mappings={
            <GestureMappings
              mappings={mappings}
              onMappingsChange={setMappings}
              onToggleMapping={toggleMapping}
              compact={false}
            />
          }
        />
      </AppShell>
    </>
  );
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.abs(value)));
}

/** 后端时间戳可能是 ISO 字符串，也可能是 "14:32:07.412"；统一为 HH:mm:ss.SSS */
function formatClock(timestamp?: string): string {
  if (!timestamp) return "--:--:--.---";
  if (!timestamp.includes("T")) return timestamp;
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return timestamp;
  const pad = (value: number, size = 2) => String(value).padStart(size, "0");
  return `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(
    parsed.getSeconds(),
  )}.${pad(parsed.getMilliseconds(), 3)}`;
}
