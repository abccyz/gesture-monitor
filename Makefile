.PHONY: dev build start stop restart status install clean

APP_NAME := gesture-monitor
BINARY := src-tauri/target/release/$(APP_NAME)
PID_FILE := /tmp/$(APP_NAME).pid

# 开发模式
dev:
	@echo "🚀 启动开发模式..."
	cd $(CURDIR) && sg input -c "npx tauri dev"

# 构建发布版本
build:
	@echo "🔨 构建发布版本..."
	cd $(CURDIR) && npx tauri build

# 启动服务（后台运行）
start:
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "⚠️  $(APP_NAME) 已在运行 (PID: $$(cat $(PID_FILE)))"; \
	else \
		echo "🚀 启动 $(APP_NAME)..."; \
		cd $(CURDIR) && sg input -c "$(BINARY)" & \
		echo $$! > $(PID_FILE); \
		echo "✅ 已启动 (PID: $$(cat $(PID_FILE)))"; \
	fi

# 停止服务
stop:
	@if [ -f $(PID_FILE) ]; then \
		PID=$$(cat $(PID_FILE)); \
		if kill -0 $$PID 2>/dev/null; then \
			echo "🛑 停止 $(APP_NAME) (PID: $$PID)..."; \
			kill $$PID; \
			rm -f $(PID_FILE); \
			echo "✅ 已停止"; \
		else \
			echo "⚠️  进程不存在，清理 PID 文件"; \
			rm -f $(PID_FILE); \
		fi; \
	else \
		echo "⚠️  $(APP_NAME) 未运行"; \
	fi

# 重启服务
restart: stop start

# 查看状态
status:
	@if [ -f $(PID_FILE) ] && kill -0 $$(cat $(PID_FILE)) 2>/dev/null; then \
		echo "✅ $(APP_NAME) 运行中 (PID: $$(cat $(PID_FILE)))"; \
	else \
		echo "❌ $(APP_NAME) 未运行"; \
	fi

# 安装依赖
install:
	@echo "📦 安装前端依赖..."
	cd $(CURDIR) && npm install
	@echo "📦 检查 Rust 依赖..."
	cd $(CURDIR)/src-tauri && cargo check
	@echo "✅ 依赖安装完成"

# 清理构建产物
clean:
	@echo "🧹 清理构建产物..."
	rm -rf $(CURDIR)/dist
	rm -rf $(CURDIR)/node_modules
	cd $(CURDIR)/src-tauri && cargo clean
	@echo "✅ 清理完成"

# 查看日志
logs:
	@if [ -f $(PID_FILE) ]; then \
		echo "📋 $(APP_NAME) 最近日志:"; \
		journalctl --user -u $(APP_NAME) -n 20 --no-pager 2>/dev/null || \
		echo "(无 systemd 用户服务日志)"; \
	else \
		echo "⚠️  $(APP_NAME) 未运行"; \
	fi

# 帮助
help:
	@echo "Gesture Monitor - 服务管理"
	@echo ""
	@echo "用法: make [命令]"
	@echo ""
	@echo "命令:"
	@echo "  make dev       - 启动开发模式（热重载）"
	@echo "  make build     - 构建发布版本"
	@echo "  make start     - 启动服务（后台运行）"
	@echo "  make stop      - 停止服务"
	@echo "  make restart   - 重启服务"
	@echo "  make status    - 查看运行状态"
	@echo "  make install   - 安装依赖"
	@echo "  make clean     - 清理构建产物"
	@echo "  make logs      - 查看日志"
	@echo "  make help      - 显示此帮助"
