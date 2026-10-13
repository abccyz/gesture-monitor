import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { GestureMapping } from "../types";

export interface GestureMappingsProps {
  /** 当前映射列表（父级共享状态） */
  mappings: GestureMapping[];
  /** 列表变更后回写父级（后端命令返回全量列表） */
  onMappingsChange?: (mappings: GestureMapping[]) => void;
  /** 切换单个映射启用状态 */
  onToggleMapping?: (id: string) => void;
  /** 右栏紧凑模式（默认 true；紧凑模式顶部只有图标 + 标题行 + 计数） */
  compact?: boolean;
  /** 追加到列表末尾的自定义区块（右栏用于插入「紧急停止」） */
  safety?: ReactNode;
}

/** 手势类型 → 中文名 */
const GESTURE_LABELS: Record<string, string> = {
  swipe: "滑动",
  pinch: "捏合",
  rotate: "旋转",
  hold: "长按",
  tap: "轻点",
};

/** 方向 → 中文名 + 图标（无方向手势回退到空） */
const DIRECTION_META: Record<string, { label: string; icon?: string }> = {
  up: { label: "上", icon: "i-up" },
  down: { label: "下", icon: "i-down" },
  left: { label: "左", icon: "i-left" },
  right: { label: "右", icon: "i-right" },
  pinch_in: { label: "捏入", icon: "i-pinch" },
  pinch_out: { label: "张开", icon: "i-pinch" },
  rotate_cw: { label: "顺转", icon: "i-wave" },
  rotate_ccw: { label: "逆转", icon: "i-wave" },
  none: { label: "无" },
};

const gestureLabel = (t: string) => GESTURE_LABELS[t] ?? t;
const directionMeta = (d: string) => DIRECTION_META[d] ?? { label: d };

/** motion → 人话：滑动 / 3 指 / 上 */
function motionText(m: GestureMapping): string {
  const parts = [gestureLabel(m.key.gesture_type)];
  if (m.key.finger_count > 0) parts.push(`${m.key.finger_count} 指`);
  const dir = directionMeta(m.key.direction).label;
  if (dir && dir !== "无") parts.push(dir);
  return parts.join(" / ");
}

export default function GestureMappings({
  mappings,
  onMappingsChange,
  onToggleMapping,
  compact = true,
  safety,
}: GestureMappingsProps) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabledCount = mappings.filter((m) => m.enabled).length;

  const apply = (next: GestureMapping[]) => {
    setError(null);
    onMappingsChange?.(next);
  };

  const run = async (fn: () => Promise<GestureMapping[]>) => {
    setBusy(true);
    setError(null);
    try {
      apply(await fn());
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const toggle = (m: GestureMapping) => {
    if (onToggleMapping) {
      onToggleMapping(m.id);
      return;
    }
    void run(() => invoke<GestureMapping[]>("update_mapping", { updated: { ...m, enabled: !m.enabled } }));
  };

  const remove = (m: GestureMapping) => void run(() => invoke<GestureMapping[]>("remove_mapping", { id: m.id }));

  const saveEdit = (m: GestureMapping) => {
    setEditingId(null);
    void run(() => invoke<GestureMapping[]>("update_mapping", { updated: m }));
  };

  const reset = () => void run(() => invoke<GestureMapping[]>("reset_mappings"));

  return (
    <section className={`card map-card${compact ? " compact" : ""}`} data-component="gesture-mappings" data-type="list">
      <div className="card-head">
        <svg className="ic sm"><use href="#i-hand" /></svg>
        <h2>手势映射</h2>
        <span className="count num">{enabledCount}/{mappings.length}</span>
        <span className="spacer" />
        <button type="button" className="btn btn-ghost sm" onClick={() => setAdding((v) => !v)} disabled={busy} title="新增映射" aria-label="新增映射">
          <svg className="ic sm"><use href="#i-max" /></svg><span className="txt">新增映射</span>
        </button>
        <button type="button" className="btn btn-ghost sm" onClick={reset} disabled={busy} title="恢复默认" aria-label="恢复默认">
          <svg className="ic sm"><use href="#i-wave" /></svg><span className="txt">恢复默认</span>
        </button>
      </div>

      <div className="card-body">
        {adding ? (
          <AddMappingForm
            onAdded={(next) => {
              setAdding(false);
              apply(next);
            }}
            onCancel={() => setAdding(false)}
          />
        ) : null}

        {error ? <div className="m-error" role="alert">{error}</div> : null}

        {mappings.length === 0 ? (
          <div className="m-empty">尚未配置任何手势映射</div>
        ) : (
          <div className="map-list">
            {!compact ? (
              <div className="map-head" aria-hidden="true">
                <span />
                <span>手势 / 触发条件</span>
                <span>动作</span>
                <span>状态</span>
              </div>
            ) : null}
            {mappings.map((m) => {
              const dir = directionMeta(m.key.direction);
              const isEditing = editingId === m.id;
              return (
                <div className={`map${m.enabled ? "" : " off"}${isEditing ? " editing" : ""}`} key={m.id}>
                  {isEditing ? (
                    <MappingEditor mapping={m} onSave={saveEdit} onCancel={() => setEditingId(null)} />
                  ) : (
                    <>
                      <div className="map-ic">
                        <svg className="ic"><use href={`#${dir.icon ?? "i-hand"}`} /></svg>
                      </div>

                      {/* 手势列：手势名 + 可配置的触发条件（手指数 / 方向） */}
                      <div className="map-col">
                        <div className="map-name">{gestureLabel(m.key.gesture_type)}</div>
                        <div className="mchips">
                          <span className="mchip num">
                            <svg className="ic"><use href="#i-hand" /></svg>
                            {m.key.finger_count > 0 ? `${m.key.finger_count} 指` : "不限指数"}
                          </span>
                          {dir.label !== "无" ? (
                            <span className="mchip dir">
                              <svg className="ic"><use href={`#${dir.icon ?? "i-up"}`} /></svg>
                              {dir.label}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* 动作列：动作名 + 实际执行的命令 */}
                      <div className="map-col map-act">
                        <div className="map-name">{m.action_name}</div>
                        {m.action_cmd ? (
                          <div className="mchips">
                            <span className="mchip cmd">{[m.action_cmd, ...m.action_args].join(" ")}</span>
                          </div>
                        ) : null}
                      </div>

                      <div className="map-actions">
                        <button type="button" className="ibtn" aria-label="编辑映射" onClick={() => setEditingId(m.id)} disabled={busy}>
                          <svg className="ic sm"><use href="#i-gear" /></svg>
                        </button>
                        <button type="button" className="ibtn danger" aria-label="删除映射" onClick={() => remove(m)} disabled={busy}>
                          <svg className="ic sm"><use href="#i-trash" /></svg>
                        </button>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={m.enabled}
                          aria-label={`启用 ${motionText(m)}`}
                          className={`switch sm${m.enabled ? " on" : ""}`}
                          onClick={() => toggle(m)}
                        >
                          <span className="knob" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {safety ? <div className="card-foot">{safety}</div> : null}
    </section>
  );
}

/** 方向全集（编辑器下拉） */
const DIRECTION_OPTIONS: { value: string; label: string }[] = [
  { value: "up", label: "上" },
  { value: "down", label: "下" },
  { value: "left", label: "左" },
  { value: "right", label: "右" },
  { value: "pinch_in", label: "捏入" },
  { value: "pinch_out", label: "张开" },
  { value: "rotate_cw", label: "顺转" },
  { value: "rotate_ccw", label: "逆转" },
  { value: "none", label: "无" },
];

/** 行内编辑器：改写单条映射（手势 + 动作） */
function MappingEditor({
  mapping,
  onSave,
  onCancel,
}: {
  mapping: GestureMapping;
  onSave: (m: GestureMapping) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(mapping.action_name);
  const [cmd, setCmd] = useState(mapping.action_cmd);
  const [args, setArgs] = useState(mapping.action_args.join(" "));
  const [fingerCount, setFingerCount] = useState(mapping.key.finger_count);
  const [direction, setDirection] = useState(mapping.key.direction);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      ...mapping,
      key: { ...mapping.key, finger_count: fingerCount, direction },
      action_name: name.trim() || mapping.action_name,
      action_cmd: cmd.trim(),
      action_args: args.split(/\s+/).filter(Boolean),
    });
  };

  return (
    <form className="map-edit" onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          <span className="lbl">动作名称</span>
          <input className="inp" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span className="lbl">命令</span>
          <input className="inp mono" value={cmd} onChange={(e) => setCmd(e.target.value)} />
        </label>
        <label className="field">
          <span className="lbl">手指数</span>
          <select className="inp" value={fingerCount} onChange={(e) => setFingerCount(Number(e.target.value))}>
            {[0, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "不限" : `${n} 指`}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="lbl">方向</span>
          <select className="inp" value={direction} onChange={(e) => setDirection(e.target.value)}>
            {DIRECTION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field span2">
          <span className="lbl">参数（空格分隔）</span>
          <input className="inp mono" value={args} onChange={(e) => setArgs(e.target.value)} />
        </label>
      </div>
      <div className="map-edit-actions">
        <button type="button" className="btn btn-ghost sm" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn btn-gold sm">
          保存
        </button>
      </div>
    </form>
  );
}

/** 手势类型 → 可选方向（新增表单联动） */
const ADD_GESTURES: { value: string; label: string; directions: string[] }[] = [
  { value: "swipe", label: "滑动", directions: ["up", "down", "left", "right"] },
  { value: "pinch", label: "捏合", directions: ["pinch_in", "pinch_out"] },
  { value: "rotate", label: "旋转", directions: ["rotate_cw", "rotate_ccw"] },
  { value: "hold", label: "长按", directions: ["none"] },
  { value: "tap", label: "轻点", directions: ["none"] },
];

const dirLabel = (d: string) => directionMeta(d).label;

/** 新增映射表单：调用 add_mapping 后端命令 */
function AddMappingForm({ onAdded, onCancel }: { onAdded: (mappings: GestureMapping[]) => void; onCancel: () => void }) {
  const [gestureType, setGestureType] = useState("swipe");
  const [fingerCount, setFingerCount] = useState(3);
  const [direction, setDirection] = useState("up");
  const [actionName, setActionName] = useState("");
  const [actionCmd, setActionCmd] = useState("xdotool");
  const [actionArgs, setActionArgs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dirs = ADD_GESTURES.find((g) => g.value === gestureType)?.directions ?? ["none"];

  const changeGesture = (value: string) => {
    setGestureType(value);
    const next = ADD_GESTURES.find((g) => g.value === value)?.directions ?? ["none"];
    setDirection(next[0]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!actionName.trim()) {
      setError("请填写动作名称");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await invoke<GestureMapping[]>("add_mapping", {
        gestureType,
        fingerCount,
        direction,
        actionName: actionName.trim(),
        actionCmd: actionCmd.trim(),
        actionArgs: actionArgs.split(/\s+/).filter(Boolean),
      });
      onAdded(result);
    } catch (err) {
      setError(String(err));
      setBusy(false);
    }
  };

  return (
    <form className="map-add" onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          <span className="lbl">手势</span>
          <select className="inp" value={gestureType} onChange={(e) => changeGesture(e.target.value)}>
            {ADD_GESTURES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="lbl">手指数</span>
          <select className="inp" value={fingerCount} onChange={(e) => setFingerCount(Number(e.target.value))}>
            {[0, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "不限" : `${n} 指`}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="lbl">方向</span>
          <select className="inp" value={direction} onChange={(e) => setDirection(e.target.value)}>
            {dirs.map((d) => (
              <option key={d} value={d}>
                {dirLabel(d)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="lbl">动作名称</span>
          <input className="inp" value={actionName} placeholder="例如：浏览器后退" onChange={(e) => setActionName(e.target.value)} />
        </label>
        <label className="field">
          <span className="lbl">命令</span>
          <input className="inp mono" value={actionCmd} onChange={(e) => setActionCmd(e.target.value)} />
        </label>
        <label className="field">
          <span className="lbl">参数（空格分隔）</span>
          <input className="inp mono" value={actionArgs} placeholder="key alt+Left" onChange={(e) => setActionArgs(e.target.value)} />
        </label>
      </div>

      {error ? <div className="m-error" role="alert">{error}</div> : null}

      <div className="map-edit-actions">
        <button type="button" className="btn btn-ghost sm" onClick={onCancel} disabled={busy}>
          取消
        </button>
        <button type="submit" className="btn btn-gold sm" disabled={busy}>
          {busy ? "添加中…" : "添加"}
        </button>
      </div>
    </form>
  );
}
