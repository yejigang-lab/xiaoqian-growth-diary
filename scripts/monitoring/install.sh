#!/bin/bash
# 小倩成长日记 - 监控机制一键安装脚本

set -e

echo "🌸 小倩成长日记 - 监控机制安装脚本"
echo "===================================="

PROJECT_DIR="/workspace/projects/workspace/growth-diary"
SCRIPT_DIR="$PROJECT_DIR/scripts/monitoring"
LOG_DIR="$PROJECT_DIR/logs"

cd "$PROJECT_DIR"

# 1. 创建日志目录
echo "📁 创建日志目录..."
mkdir -p "$LOG_DIR"

# 2. 设置脚本权限
echo "🔐 设置脚本权限..."
chmod +x "$SCRIPT_DIR/monitor_site.py"
chmod +x "$SCRIPT_DIR/auto-fix.sh"
chmod +x auto-update.sh

# 3. 测试监控脚本
echo "🧪 测试监控脚本..."
python3 "$SCRIPT_DIR/monitor_site.py"

# 4. 安装定时任务
echo "⏰ 安装定时任务..."
CRON_FILE="$SCRIPT_DIR/crontab.config"

# 检查是否已安装
if crontab -l 2>/dev/null | grep -q "monitor_site.py"; then
    echo "⚠️  定时任务已存在，跳过安装"
else
    # 添加到当前用户的 crontab
    (crontab -l 2>/dev/null || echo "") | cat - "$CRON_FILE" | crontab -
    echo "✅ 定时任务已安装"
fi

# 5. 显示 crontab
echo ""
echo "📋 当前定时任务："
echo "----------------"
crontab -l | grep -E "growth-diary|monitor_site|auto-update" || echo "(无相关任务)"

# 6. 验证安装
echo ""
echo "✅ 安装完成！"
echo ""
echo "📁 文件位置："
echo "  监控脚本: $SCRIPT_DIR/monitor_site.py"
echo "  自动修复: $SCRIPT_DIR/auto-fix.sh"
echo "  定时配置: $SCRIPT_DIR/crontab.config"
echo "  日志目录: $LOG_DIR"
echo ""
echo "🔧 手动运行命令："
echo "  # 检查网站状态"
echo "  python3 $SCRIPT_DIR/monitor_site.py"
echo ""
echo "  # 检查并自动修复"
echo "  python3 $SCRIPT_DIR/monitor_site.py --fix --notify"
echo ""
echo "  # 运行全面修复"
echo "  bash $SCRIPT_DIR/auto-fix.sh"
echo ""
echo "  # 手动运行更新"
echo "  bash auto-update.sh"
echo ""
echo "📊 查看日志："
echo "  tail -f $LOG_DIR/monitoring.log"
echo "  tail -f $LOG_DIR/auto-update.log"
echo ""
