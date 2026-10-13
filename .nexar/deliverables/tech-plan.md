# 技术方案文档

> 由设计模式 AI 分析生成；编码模式应以本文件为实现依据。

## Design Deliverable Context

**Project**: gesture-monitor
**Generated**: 2026-09-29T05:07:08.179539915+00:00
**Pages**: 1

### Pages

- Gesture Monitor — 触控板手势监控 (`page-6a673190`) — device: desktop

### Components

- view-tabs (`navigation`): used in page-6a673190
- main-panel (`container`): used in page-6a673190
- right-sidebar (`container`): used in page-6a673190
- gesture-stats (`chart`): used in page-6a673190
- app-shell (`container`): used in page-6a673190
- device-list (`list`): used in page-6a673190
- title-bar (`header`): used in page-6a673190
- touchpad-visualization (`media`): used in page-6a673190
- live-telemetry (`card`): used in page-6a673190
- gesture-event-stream (`table`): used in page-6a673190

### Design Tokens

```css
/* Design Tokens - exported from Nexar Design Mode */
:root {
  --color-background: #4fd1c5;
  --color-primary: #d4a853;
  --color-secondary: #4fd1c5;
  --color-surface: #ffffff;
  --color-text: #d4a853;
  --color-text_secondary: #000000;
  --spacing-lg: 6px;
  --spacing-md: 5px;
  --spacing-sm: 2px;
  --spacing-xl: 9px;
  --spacing-xs: 0px;
  --radius-lg: 8px;
  --radius-md: 6px;
  --radius-sm: var(--r2);
  --radius-xl: 999px;
}
```

### Tech Stack Analysis

- Type: 前端 (React)
- Framework: React
- Language: TypeScript
- Build Tool: Vite
- Package Manager: npm

**Existing Structure**:
- Makefile
- README.md
- README_EN.md
- design-export/
- design-export/page-6a673190.html
- design-export/tokens.css
- index.html
- package-lock.json
- package.json
- postcss.config.js
- src/
- src/App.tsx
- src/components/
- src/components/DeviceList.tsx
- src/components/GestureCard.tsx
- src/components/GestureLog.tsx
- src/components/GestureMappings.tsx
- src/components/GestureStats.tsx
- src/components/TitleBar.tsx
- src/components/TouchpadVisualization.tsx

**Recommendations**:
- 检测到标记文件: package.json, Makefile, tsconfig.json, vite.config.ts, package-lock.json

### Tech Plan

- Scenario: greenfield (Rules + AI generated)
- Target platforms: web
- Architecture: Tauri 2 单进程桌面单体（WebView 展示层 + Rust 原生核心双段式）：React 18 单页 UI 通过 Tauri IPC（#[tauri::command] 请求/响应 + event 推送）与 src-tauri 内的 gesture.rs / actions.rs / commands.rs 直接通信；无 HTTP 后端、无独立服务进程、无数据库，运行时状态以 Rust 内存集合为准、前端状态以 React 本地 state 为准
  Rationale: 本项目只有 1 个页面（page-6a673190，device: desktop），是一个单窗口三栏固定布局（app-shell + title-bar + main-panel + right-sidebar）的桌面工具，页面内 view-tabs 只是本地视图切换、由 React 条件渲染即可承载，因此任何分层 Web 后端、网关、路由服务、领域服务拆分都缺乏页面与调用方支撑——架构的最小可行形态就是「一个窗口、一个 WebView、一个 Rust 进程」。具体落到已确定的栈与数据：src-tauri/main.rs 启动窗口并注册 commands.rs 中的命令，gesture.rs 负责 macOS/Windows/Linux 原生触控板采集，actions.rs 负责全局输入与系统动作执行，前端唯一入口 src/App.tsx 组合 TitleBar、TouchpadVisualization、GestureCard、GestureLog、GestureStats、DeviceList、GestureMappings。通信按数据形态一分为二：一次性/低频率读操作走 invoke，例如 list_devices、get_gesture_stats、list_gesture_mappings、set_gesture_mapping_enabled、set_active_device，分别填充 DeviceList、GestureStats、GestureMappings；高频率实时数据（每帧的 deltaX/deltaY/pressure、GestureEvent 流）走 listen 订阅，例如 gesture:event、gesture:frame、device:state-changed，由 App.tsx 统一订阅后向下传 props，避免轮询与高频 invoke 造成的 IPC 抖动。数据模型完全落在原生侧：Device(connected/isActive/lastSeen/gestureCount) 对应 DeviceList 的在线态与当前选中设备，GestureEvent(timestamp/gestureType/fingers/direction/deltaX/deltaY/pressure/durationMs/confidence/actionExecuted/deviceId) 天然就是 GestureLog 表格的行，GestureStat(count/percentage/avgDurationMs) 是 GestureStats 图表的直接数据源（可由 Rust 侧在采集时增量聚合，前端不做二次统计），GestureMapping(gestureType/fingers/actionName/actionCommand/appScope/enabled) 由 GestureMappings 组件读写并落盘到本地配置文件——由于没有 server 也没有 DB，这些实体以 Rust 内存结构 + 事件环形缓冲区持有，仅 GestureMapping 需要持久化到用户目录的 JSON，属于 Tauri 应用自身文件职责，不构成独立数据层。前端侧刻意不引入 router 与状态库（已确定），是把「应用级状态」上提到 App.tsx：手势事件流只保留最近 N 条、统计值由原生侧推送，state 体量与页面数量（1 页）完全匹配。跨平台一致性（WebView2 / WKWebView / WebKitGTK）由 Tailwind + design-export/tokens.css 的 CSS 变量和 tauri.conf.json 的 decorations 配置保证，自绘 TitleBar 与原生窗口行为对齐——这是选择「Tauri 内嵌 WebView 单体」而非 Electron 或纯 Web 的决定性理由：只有 Tauri 能在一个二进制内同时满足「像素级复刻设计稿」与「直接调用各平台原生输入 API、完全离线、无服务端」。
  Alternatives: Rust 本地 HTTP/WebSocket 服务 + 浏览器前端（axum/actix + REST + WS）：能力上可行，但需要额外端口、进程生命周期管理与本地鉴权，且要为 list_devices、get_gesture_stats 这类只服务于一个窗口的调用设计完整 API 契约，收益为负；Tauri 的 invoke/listen 已在 IPC 层提供同等能力且无端口暴露风险。仅当未来需要让外部浏览器或第三方客户端接入手势数据时才值得演进。, Electron + Node 原生模块：UI 复用性相近，但打包体积、内存占用与「调用各平台触控板底层 API」的实现成本明显高于 Tauri，需为每个平台维护 N-API 原生插件，且与已确定的 Rust 采集/执行逻辑（gesture.rs、actions.rs）无法复用，需整体重写。, 无头 Rust 守护进程 + Tauri 作为纯展示客户端（Socket/共享内存通信）：把采集常驻化后仍能工作，但当前只有 1 个页面、1 个窗口，引入守护进程会带来两套进程的启动顺序、崩溃恢复与配置同步问题；只有当需要「窗口关闭后仍持续监听手势并触发系统动作」时才有必要拆出。, 引入 react-router + Redux/Zustand + 后端服务与数据库的前后端分离方案（规则引擎默认推荐）：与页面事实不符——1 个页面、view-tabs 仅为本地视图切换、无多端共享数据、无跨会话查询需求；引入路由、全局状态库与数据库只会增加 GestureEvent 高频流的状态同步复杂度，属于过度设计。
- Frontend: React 18 + TypeScript（Tauri 2 桌面外壳内的单页 WebView 应用；src/App.tsx 直接组合 TitleBar、TouchpadVisualization、GestureCard、GestureLog、GestureStats、DeviceList、GestureMappings 等既有组件，按 design-export/page-6a673190.html 设计稿完全复刻 app-shell / main-panel / right-sidebar 三栏固定布局） / 无（单页单窗口应用，index.html → src/main.tsx → src/App.tsx 直接渲染；页面内的 view-tabs 导航只是本地视图切换，用 React 条件渲染实现，不引入 react-router 等路由库） / 无第三方状态库（使用 React 内置 useState/useReducer + useContext 管理本地 UI 状态；手势事件流、设备列表、统计等实时数据通过 @tauri-apps/api 的 invoke 调用 Rust command 并用 listen 订阅 event 更新，状态保持在 App.tsx 顶部并向下传递） / Tailwind CSS 3（tailwind.config.js + postcss.config.js + autoprefixer 已配置）+ design-export/tokens.css 的 CSS 变量作为设计令牌，配合 src/styles/app.css 全局样式；图标使用 lucide-react；仅用跨平台通用样式以保证 WebView2 / WKWebView / WebKitGTK 外观一致，不做移动端响应式适配 / Vite 5（vite.config.ts + @vitejs/plugin-react，tsconfig.json 为 bundler 解析、jsx: react-jsx、noEmit）；npm run dev / build / preview 与 @tauri-apps/cli 配合，vite build 输出静态资源后由 Tauri 打包为各平台原生安装包
- Backend: Rust / Tauri 2（src-tauri：main.rs 应用入口、commands.rs 暴露 #[tauri::command] 供前端 invoke 调用、gesture.rs 负责原生手势采集与解析、actions.rs 负责全局输入与系统动作执行；通过 @tauri-apps/api 的 invoke/event 与 React 前端通信，无独立 HTTP 服务） / 原生可执行进程（Tauri 2 打包为 Windows/macOS/Linux 桌面安装包，内嵌系统 WebView2 / WKWebView / WebKitGTK 渲染前端，Rust 侧直接调用各平台原生输入 API，全程离线运行，无后端服务与数据库）
- Infrastructure: container=不需要容器化。本应用是 Tauri 2 桌面程序（React 前端 + Rust 原生外壳），运行形态是用户机器上的原生可执行文件，没有服务端进程、HTTP 服务或数据库，Docker 容器无法承载系统 WebView（WebView2 / WKWebView / WebKitGTK）与原生输入 API（gesture.rs 的全局手势采集、actions.rs 的系统动作执行），容器化会直接破坏其核心能力。唯一可选的容器用途是：在 Linux CI 中用一个一次性 Docker 镜像（ubuntu:22.04 + libwebkit2gtk-4.1-dev、libgtk-3-dev、librsvg2-dev、libappindicator3-dev、patchelf、build-essential、curl + rustup + Node 20）作为 Linux 安装包的构建环境，这属于 CI 构建沙箱，不是部署产物。 / ci-cd=使用 GitHub Actions（或等价的 GitLab CI）做「跨平台打包发布」而非服务发布。触发：push 到 main 与打 v* tag。矩阵策略必须使用各平台原生 runner，因为 Tauri 无法交叉编译出可用的系统 WebView 依赖：
- windows-latest → bundle target nsis / msi
- macos-latest → bundle target app / dmg（如需通用二进制再加 --target universal-apple-darwin）
- ubuntu-22.04 → bundle target deb / appimage

单 job 步骤：actions/checkout → actions/setup-node@v4（node 20，npm ci，缓存基于 package-lock.json）→ dtolnay/rust-toolchain@stable → Swatinem/rust-cache@v2（缓存 src-tauri/target，按 key 区分平台）→ Linux 额外 apt-get 安装 webkit2gtk/gtk/rsvg/appindicator/patchelf → 前端质量门 `npm run build`（tsc + vite build，确保 TypeScript strict 无错、设计稿布局可编译）→ `npm run tauri build` → 用 tauri-apps/tauri-action 上传 src-tauri/target/release/bundle/** 下的安装包为 Artifacts；tag 触发时直接创建 GitHub Release 并附上各平台产物（.exe/.msi、.dmg/.app、.deb/.AppImage）。因为无后端，不需要再做镜像推送、灰度发布或数据库迁移步骤；代码签名（Windows 证书、macOS notarization）作为后续可选增强。 / env=单一离线运行环境，无多环境（dev/staging/prod）之分，也没有需要注入的服务端密钥或连接串。开发期：`npm run dev` 启动 Vite dev server（默认 5173，HMR），配合 `npm run tauri dev` 打开带 Rust 后端的原生窗口调试 invoke/event 链路；通过 src-tauri/capabilities/default.json 声明前端可调用的权限（invoke 白名单、event 监听）与 tauri.conf.json 的窗口配置（decorations 配合自定义 TitleBar、单窗口固定尺寸、桌面端不做移动端适配）。构建期：`npm run build` 由 Vite 输出静态资源到 dist/，`npm run tauri build` 触发 cargo release 编译并内嵌 dist 资源。设计令牌来自 design-export/tokens.css 的 CSS 变量 + Tailwind CSS 3（tailwind.config.js / postcss.config.js / autoprefixer），运行时不依赖 CDN、不读取环境变量、不联网。Makefile 可作为本地统一的 dev / build / lint / tauri 打包快捷入口。 / deploy=交付目标是各桌面平台的原生安装包，而非 Web 站点或服务器。产物：Windows（WebView2 运行时环境下，NSIS 安装器 .exe / MSI）、macOS（WKWebView，.dmg / .app，x64 与 arm64 或 universal）、Linux（WebKitGTK，.deb / .AppImage）；图标由 src-tauri/icons 提供，Tauri 生成的 updater 清单（latest.json + 签名）作为后续可选升级通道。不需要静态托管/CDN：应用必须访问操作系统原生输入与手势 API（gesture.rs / actions.rs），浏览器中运行的纯静态版本无法实现监控功能；也正因为核心逻辑在 Rust 侧、前端只做展示，所以既不容器化也不部署到云。分发方式为 GitHub Releases 上传安装包，用户下载安装后全程离线运行。

**Data Model**:
- Device [id: string, name: string, deviceType: enum, connected: boolean, isActive?: boolean, lastSeen?: date, gestureCount?: number]
  Relations: Device 1:N GestureEvent（一个设备产生多条手势事件）; Device 1:N GestureStat（统计按设备维度聚合）
- GestureEvent [id: string, timestamp: date, gestureType: enum, fingers?: number, direction?: enum, deltaX?: number, deltaY?: number, pressure?: number, durationMs?: number, confidence?: number, actionExecuted?: string, deviceId: reference]
  Relations: GestureEvent N:1 Device（多条事件属于同一设备）; GestureEvent N:1 GestureMapping（按 gestureType 匹配触发的映射动作）; GestureEvent 1:N GestureStat（事件被聚合成统计条目）
- GestureMapping [id: string, gestureType: enum, fingers?: number, actionName: string, actionCommand?: string, appScope?: string, enabled: boolean]
  Relations: GestureMapping 1:N GestureEvent（一条映射可被多条事件触发）
- GestureStat [gestureType: enum, count: number, percentage?: number, avgDurationMs?: number, periodStart?: date]
  Relations: GestureStat N:1 GestureEvent（由手势事件按类型聚合得出）; GestureStat N:1 Device（可按 deviceId 维度再聚合）

### Implementation Spec

- Source: impl_spec.json
- Pages: 1 / Components: 10 / Acceptance: 14 / Binding coverage: 100%
- Breakpoints: desktop 1024+

**Per-page spec** (pageId → route · components · acceptance):
- page-6a673190 → /gesture-monitor (10 components, 14 acceptance)

**Unresolved**:
- page-6a673190: tech_plan.apis 为空，10 处 dataBinding 无法回填接口（请先在技术规划补全 API 契约）

