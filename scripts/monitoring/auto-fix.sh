#!/bin/bash
# 小倩成长日记 - 全面自动修复脚本

set -e

PROJECT_DIR="/workspace/projects/workspace/growth-diary"
LOG_FILE="$PROJECT_DIR/logs/auto-fix.log"

echo "========================================" >> "$LOG_FILE"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 全面自动修复开始" >> "$LOG_FILE"

cd "$PROJECT_DIR"

# 1. 运行网站监控（自动修复模式）
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 运行网站监控..." >> "$LOG_FILE"
python3 scripts/monitoring/monitor_site.py --fix --notify >> "$LOG_FILE" 2>&1 || true

# 2. 确保分支正确
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检查 Git 分支..." >> "$LOG_FILE"
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 切换分支: $current_branch -> main" >> "$LOG_FILE"
    git checkout main >> "$LOG_FILE" 2>&1 || true
fi

# 3. 检查远程仓库配置
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检查远程仓库..." >> "$LOG_FILE"
git remote -v >> "$LOG_FILE" 2>&1 || true

# 4. 拉取最新代码
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 拉取最新代码..." >> "$LOG_FILE"
git pull origin main >> "$LOG_FILE" 2>&1 || true

# 5. 检查并推送未推送的提交
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检查未推送提交..." >> "$LOG_FILE"
unpushed=$(git log origin/main..HEAD --oneline 2>/dev/null || true)
if [ -n "$unpushed" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 发现未推送提交，正在推送..." >> "$LOG_FILE"
    git push origin main >> "$LOG_FILE" 2>&1 || true
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 没有未推送提交" >> "$LOG_FILE"
fi

# 6. 检查网站可访问性
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 检查网站可访问性..." >> "$LOG_FILE"
if curl -sf "https://yejigang-lab.github.io/xiaoqian-growth-diary/" > /dev/null 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ 网站可访问" >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ 网站不可访问" >> "$LOG_FILE"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 全面自动修复完成" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
