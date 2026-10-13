# Gesture Monitor

Linux 触控板手势监控与映射工具，基于 Tauri 2 + React 构建。实时检测触控板手势并提供可视化反馈，支持将手势映射为系统操作（如工作区切换、缩放、Mission Control 等）。

## 功能特性

- **实时手势检测** — 基于 libinput 识别滑动、捏合、旋转、长按手势
- **可视化动画** — 虚拟触控板上实时展示手指位置与手势轨迹
- **手势映射** — 将手势绑定到系统命令，默认配置模拟 macOS 手势体验
- **事件日志** — 记录手势事件流，支持统计与清空
- **设备管理** — 自动检测已连接的触控板设备
- **系统托盘** — 后台驻留，一键启停监听、显示/隐藏窗口
- **配置持久化** — 映射规则保存至 `~/.config/gesture-monitor/mappings.json`

## 支持的手势

| 手势 | 手指 | 方向 | 默认动作 |
|------|------|------|----------|
| 滑动 | 3/4 指 | 上 | Mission Control |
| 滑动 | 3/4 指 | 下 | App Exposé |
| 滑动 | 3/4 指 | 左 | 切换上一工作区 |
| 滑动 | 3/4 指 | 右 | 切换下一工作区 |
| 捏合 | 2 指 | 缩小 | Ctrl+- (缩小) |
| 捏合 | 2 指 | 放大 | Ctrl++ (放大) |
| 旋转 | 2 指 | 顺时针 | 下一标签页 (默认关闭) |
| 旋转 | 2 指 | 逆时针 | 上一标签页 (默认关闭) |
| 长按 | 3 指 | — | 右键菜单 |
| 长按 | 4 指 | — | 显示桌面 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 样式 | Tailwind CSS |
| 构建工具 | Vite |
| 桌面框架 | Tauri 2.x |
| 手势识别 | libinput (`input` crate) |
| 设备发现 | udev (`udev` crate) |
| 动作执行 | xdotool |
| 图标 | Lucide React |

## 项目结构

```
gesture-monitor/
├── src/                          # 前端源码
│   ├── App.tsx                   # 主应用
│   ├── main.tsx                  # 入口
│   ├── styles/app.css            # 全局样式
│   └── components/
│       ├── TitleBar.tsx          # 标题栏
│       ├── TouchpadVisualization.tsx  # 触控板可视化
│       ├── GestureLog.tsx        # 事件日志
│       ├── GestureStats.tsx      # 统计面板
│       ├── GestureCard.tsx       # 手势事件卡片
│       ├── DeviceList.tsx        # 设备列表
│       └── GestureMappings.tsx   # 映射配置
├── src-tauri/                    # Rust 后端
│   ├── src/
│   │   ├── main.rs              # 入口 + 系统托盘
│   │   ├── gesture.rs           # libinput 手势监听
│   │   ├── commands.rs          # Tauri 命令
│   │   └── actions.rs           # 手势映射与动作执行
│   ├── Cargo.toml
│   └── tauri.conf.json
├── Makefile                      # 构建与服务管理
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## 环境要求

- **操作系统:** Linux（需要 libinput 支持）
- **Rust:** 1.70+
- **Node.js:** 18+
- **系统依赖:**
  - `libinput` 开发库
  - `libudev` 开发库
  - `webkit2gtk-4.1`（Tauri 依赖）
  - `xdotool`（手势动作执行）

### Debian/Ubuntu 安装系统依赖

```bash
sudo apt install libinput-dev libudev-dev libwebkit2gtk-4.1-dev xdotool
```

### 用户权限

需要将当前用户加入 `input` 组才能访问触控板设备：

```bash
sudo usermod -aG input $USER
```

**重新登录后生效。**

## 快速开始

### 安装依赖

```bash
make install
```

### 开发模式

```bash
make dev
```

启动后会自动开始监听触控板手势，前端支持热重载，Rust 代码变更会自动重新编译。

### 构建发布版本

```bash
make build
```

构建产物位于 `src-tauri/target/release/gesture-monitor`。

### 运行已构建版本

```bash
make start    # 后台运行
make stop     # 停止
make restart  # 重启
make status   # 查看状态
```

## 配置

手势映射配置文件位于 `~/.config/gesture-monitor/mappings.json`，可在应用内的「手势映射配置」面板中直接编辑，也可手动编辑 JSON 文件。

每条映射规则包含：

```json
{
  "id": "m001",
  "key": {
    "gesture_type": "swipe",
    "finger_count": 3,
    "direction": "up"
  },
  "action_name": "Mission Control",
  "action_cmd": "xdotool",
  "action_args": ["key", "ctrl+alt+Up"],
  "macos_equivalent": "Mission Control — 显示所有窗口和工作区",
  "enabled": true
}
```

## 服务管理

```bash
make help       # 查看所有可用命令
make logs       # 查看日志
make clean      # 清理构建产物
```

## 许可证

MIT
