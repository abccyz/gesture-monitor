# 实现规格文档

> 由设计模式生成；编码模式应以本文件为实现依据（按页面分段，引用 pageId）。

## 全局

- 生成方式: hybrid
- 生成时间: 2026-09-29T05:09:15.357423442+00:00
- 页面: 1 / 组件: 10 / 验收项: 14 / 绑定覆盖率: 100%
- 断点: desktop 1024+
- 设计 token: design-tokens.css

### 实测设计令牌（取自设计稿 HTML，编码须以此为准）

- 配色: background=#4fd1c5, primary=#d4a853, secondary=#4fd1c5, surface=#ffffff, text=#d4a853, text_secondary=#000000
- 字体: Inter
- 字号: body=12px, h1=18px
- 圆角: lg=8px, md=6px, sm=var(--r2), xl=999px
- 间距: lg=6px, md=5px, sm=2px, xl=9px, xs=0px
- 实测色板（只用这些色，勿引入色板外的颜色）: #ffffff, #d4a853, #4fd1c5, #000000, #4ecb8f, #e05c5c, #1a1f27, #222831, #151920, #5b9dff, #8ee6b6, #f09393, #080a0d, #0c0e12, #0f1216, #12161c, #161a20, #181c22, #191d24, #1c2129, #1e2229, #1e232b, #22262d, #231a07, #262b33, #2b323c, #2c3138, #31373f, #3a4048

## 页面：page-6a673190

- 路由: /gesture-monitor
- 源文件: pages/page-6a673190.html
- 源哈希: 49e34ae1dbcd066c5fb2cb29f5969900b1bbb10c5e632abed89f32bff7c369c4

### 视觉事实（实测，编码须对齐）

- 画板: 112×112（来源: css）
- 设备类型: desktop
- 页面背景: #4fd1c5

#### 组件实测样式

- `app-shell`: display: flex; flex-direction: column; height: 100vh; overflow: hidden
- `device-list`: background: linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,0) 120px),
      var(--panel); border: 1px solid var(--border); border-radius: var(--r3); box-shadow: inset 0 1px 0 rgba(255,255,255,.035), var(--sh-1); display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden
- `gesture-event-stream`: background: linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,0) 120px),
      var(--panel); border: 1px solid var(--border); border-radius: var(--r3); box-shadow: inset 0 1px 0 rgba(255,255,255,.035), var(--sh-1); display: flex; flex: none; flex-direction: column; height: 236px; min-height: 0; min-width: 0; overflow: hidden
- `gesture-stats`: background: linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,0) 120px),
      var(--panel); border: 1px solid var(--border); border-radius: var(--r3); box-shadow: inset 0 1px 0 rgba(255,255,255,.035), var(--sh-1); display: flex; flex: none; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden
- `live-telemetry`: background: linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,0) 120px),
      var(--panel); border: 1px solid var(--border); border-radius: var(--r3); box-shadow: inset 0 1px 0 rgba(255,255,255,.035), var(--sh-1); display: flex; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden
- `main-panel`: display: flex; flex-direction: column; gap: var(--s4); min-height: 0; min-width: 0
- `right-sidebar`: display: flex; flex-direction: column; gap: var(--s4); min-height: 0; min-width: 0; overflow: hidden
- `title-bar`: align-items: center; background: linear-gradient(180deg,#1a1f27 0%,#151920 100%); border-bottom: 1px solid var(--border); box-shadow: 0 1px 0 rgba(255,255,255,.02), var(--sh-1); display: flex; flex: none; gap: var(--s4); height: 56px; padding: 0 var(--s4); position: relative
- `touchpad-visualization`: background: linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,0) 120px),
      var(--panel); border: 1px solid var(--border); border-radius: var(--r3); box-shadow: inset 0 1px 0 rgba(255,255,255,.035), var(--sh-1); display: flex; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden
- `view-tabs`: align-items: center; background: var(--panel); border: 1px solid var(--border); border-radius: var(--r3); box-shadow: var(--sh-1); display: flex; flex: none; gap: var(--s1); padding: var(--s1)

### 组件树

- `app-shell` **GestureMonitorApp** (layout) · role: Full-viewport application shell that stacks the titlebar over the content region
  - ref: `comp-app-shell`
  - visual (@.app): display: flex; flex-direction: column; height: 100vh; overflow: hidden
  - props: children: node, sidebarOpen?: boolean
  - states: default, loading
  - binding: entity=Device api=— direction=read fields=[name, connectionState]
  - `app-shell > title-bar` **MonitorTitlebar** (navigation) · role: Top app bar with page title, active device indicator and capture toggles
    - ref: `comp-title-bar`
    - visual (@.titlebar): align-items: center; background: linear-gradient(180deg,#1a1f27 0%,#151920 100%); border-bottom: 1px solid var(--border); box-shadow: 0 1px 0 rgba(255,255,255,.02), var(--sh-1); display: flex; flex: none; gap: var(--s4); height: 56px; padding: 0 var(--s4); position: relative
    - props: title: string, deviceName?: string, connectionState: enum, isCapturing: boolean, onToggleCapture?: function
    - states: default, hover, disabled, error
    - binding: entity=Device api=— direction=readwrite fields=[name, connectionState, isCapturing, lastSeenAt]
  - `app-shell > main-panel` **MonitorMainColumn** (layout) · role: Primary content column holding the view tabs and the three stacked gesture cards
    - ref: `comp-main-panel`
    - visual (@.main): display: flex; flex-direction: column; gap: var(--s4); min-height: 0; min-width: 0
    - props: children: node
    - states: default, empty
    - binding: entity=GestureEvent api=— direction=read fields=[id, type, timestamp]
    - `app-shell > main-panel > view-tabs` **GestureViewTabs** (navigation) · role: Segmented switcher that filters the monitor by gesture type or view
      - ref: `comp-view-tabs`
      - visual (@.tabs): align-items: center; background: var(--panel); border: 1px solid var(--border); border-radius: var(--r3); box-shadow: var(--sh-1); display: flex; flex: none; gap: var(--s1); padding: var(--s1)
      - props: items: node, activeId: string, onChange: function
      - states: default, hover, focus, disabled
      - binding: entity=GestureEvent api=— direction=read fields=[type]
    - `app-shell > main-panel > touchpad-visualization` **GestureEventStreamCard** (display) · role: Live list of the most recent trackpad gesture events
      - ref: `comp-touchpad-visualization`
      - visual (@.card): background: linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,0) 120px),
      var(--panel); border: 1px solid var(--border); border-radius: var(--r3); box-shadow: inset 0 1px 0 rgba(255,255,255,.035), var(--sh-1); display: flex; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden
      - props: title: string, events: node, maxRows?: number, isStreaming?: boolean
      - states: default, loading, empty, error
      - binding: entity=GestureEvent api=— direction=read fields=[id, type, phase, deltaX, deltaY, magnitude, timestamp]
    - `app-shell > main-panel > live-telemetry` **GestureStatsCard** (display) · role: Aggregated per-gesture counters and recognition quality for the session
      - ref: `comp-live-telemetry`
      - visual (@.card): background: linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,0) 120px),
      var(--panel); border: 1px solid var(--border); border-radius: var(--r3); box-shadow: inset 0 1px 0 rgba(255,255,255,.035), var(--sh-1); display: flex; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden
      - props: title: string, stats: node, period?: enum
      - states: default, loading, empty, error
      - binding: entity=GestureStat api=— direction=read fields=[gestureType, count, avgConfidence, lastTriggeredAt]
    - `app-shell > main-panel > gesture-event-stream` **GestureTimelineCard** (display) · role: Fixed-height timeline strip plotting gesture occurrences over the session
      - ref: `comp-gesture-event-stream`
      - visual (@.card): background: linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,0) 120px),
      var(--panel); border: 1px solid var(--border); border-radius: var(--r3); box-shadow: inset 0 1px 0 rgba(255,255,255,.035), var(--sh-1); display: flex; flex: none; flex-direction: column; height: 236px; min-height: 0; min-width: 0; overflow: hidden
      - props: title: string, points: node, height?: number
      - states: default, loading, empty, error
      - binding: entity=GestureEvent api=— direction=read fields=[timestamp, type, magnitude]
  - `app-shell > right-sidebar` **MonitorSidebar** (layout) · role: Right-hand rail stacking the device status card above the gesture mapping list
    - ref: `comp-right-sidebar`
    - visual (@.sidebar): display: flex; flex-direction: column; gap: var(--s4); min-height: 0; min-width: 0; overflow: hidden
    - props: children: node
    - states: default, empty
    - binding: entity=Device api=— direction=read fields=[name, connectionState]
    - `app-shell > right-sidebar > gesture-stats` **DeviceStatusCard** (display) · role: Shows the paired trackpad identity, connection and battery state
      - ref: `comp-gesture-stats`
      - visual (@.card): background: linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,0) 120px),
      var(--panel); border: 1px solid var(--border); border-radius: var(--r3); box-shadow: inset 0 1px 0 rgba(255,255,255,.035), var(--sh-1); display: flex; flex: none; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden
      - props: device?: node, showBattery?: boolean
      - states: default, loading, empty, error
      - binding: entity=Device api=— direction=readwrite fields=[name, connectionState, batteryLevel, lastSeenAt]
    - `app-shell > right-sidebar > device-list` **GestureMappingListCard** (display) · role: Scrollable list of gesture-to-action bindings with enable toggles
      - ref: `comp-device-list`
      - visual (@.card): background: linear-gradient(180deg,rgba(255,255,255,.028),rgba(255,255,255,0) 120px),
      var(--panel); border: 1px solid var(--border); border-radius: var(--r3); box-shadow: inset 0 1px 0 rgba(255,255,255,.035), var(--sh-1); display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; min-width: 0; overflow: hidden
      - props: title: string, mappings: node, onToggle?: function
      - states: default, hover, focus, disabled, empty
      - binding: entity=GestureMapping api=— direction=readwrite fields=[gesture, action, enabled, shortcut]

### 页面状态

- idle: Monitor opened but capture is stopped; last-known data is shown
- capturing: Gesture capture is live and events stream into the cards
- empty: No gestures recorded and no mappings configured yet
- loading: Initial load of device, stats and mappings
- error: Device or data source became unavailable
- no-device: No trackpad is paired, so monitoring cannot start

### 依赖

- Entities: Device, GestureEvent, GestureMapping, GestureStat

### 验收标准

- [ ] (layout) App shell fills the viewport without page-level scrolling — Set the window to 1440x900; assert .app (c1) computed height equals 100vh, overflow is hidden, and body has no scrollbar.
- [ ] (layout) Content region is a main column beside a right sidebar rail — Verify c3 (.main) and c8 (.sidebar) are siblings inside c1, both flex children with gap var(--s4), and that the three main cards (c5, c6, c7) plus the two sidebar cards (c9, c10) are direct children of their respective columns.
- [ ] (layout) Timeline card keeps its fixed 236px height — Assert computed height of c7 is 236px and flex: none, and that it does not grow when c5 and c6 have little content.
- [ ] (visual) Titlebar matches the measured bar spec — Measure c2: height 56px, horizontal padding var(--s4), gap var(--s4), background linear-gradient(180deg,#1a1f27 0%,#151920 100%), bottom border 1px var(--border).
- [ ] (visual) All cards use the shared panel treatment — For c5, c6, c7, c9, c10 assert background gradient rgba(255,255,255,.028) to transparent over var(--panel), 1px var(--border), border-radius var(--r3) (8px), and box-shadow inset 0 1px 0 rgba(255,255,255,.035), var(--sh-1).
- [ ] (visual) Only palette colours from the design tokens are used — Sample every filled surface and text colour in the rendered page and confirm each is one of #ffffff, #d4a853, #4fd1c5, #000000, #4ecb8f, #e05c5c, #5b9dff or the listed dark neutrals; typography is Inter with body 12px and headings 18px.
- [ ] (interaction) Tabs switch the displayed gesture data — Click a non-active tab in c4 and assert the active pill moves, the active tab text is #d4a853, and the event/stats/timeline cards re-query for the selected gesture type.
- [ ] (interaction) Capture can be started and stopped from the titlebar — Click the capture control in c2 and assert isCapturing flips, the live indicator changes between pulsing and static, and event rows stop appending while stopped.
- [ ] (data) Event stream reads from the local GestureEvent entity — Seed five GestureEvent records and assert c5 renders exactly five rows, newest first, each showing type, phase and timestamp, with no network request issued.
- [ ] (data) Mapping toggles persist locally — Toggle a row in c10 and assert the GestureMapping.enabled flag is written to the local store, the row renders in its disabled visual state (45% text opacity), and the change survives a page reload.
- [ ] (data) Device card reflects pairing state — With no Device record, assert c9 shows the empty state; after pairing one, assert name, connectionState and battery render and the titlebar status accent turns #4ecb8f.
- [ ] (responsive) Desktop breakpoint layout holds down to 1024px — At 1024px viewport width assert the main column and sidebar still render side by side with no horizontal overflow and no clipped card content; below 1024px the sidebar stacks under the main column.
- [ ] (a11y) Tabs and mapping rows are keyboard operable — Tab into c4 and c10 from the titlebar, assert focus rings (#5b9dff, 2px) are visible, arrow keys move between tabs with the active tab announced, and each mapping toggle exposes role=switch with aria-checked matching its state.
- [ ] (a11y) Status information is not conveyed by colour alone — Simulate a disconnected device and assert c9 and c2 show an explicit text label alongside the #e05c5c colour, and that the warning region is announced via aria-live.

## 未决项

- page-6a673190: tech_plan.apis 为空，10 处 dataBinding 无法回填接口（请先在技术规划补全 API 契约）
