#!/bin/bash
# 持续监控 GitHub Pages 部署状态

echo "🔍 GitHub Pages 部署监控"
echo "========================"
echo ""
echo "开始时间: $(date)"
echo ""

SITE_URL="https://yejigang-lab.github.io/xiaoqian-growth-diary/"
PROJECT_DIR="/workspace/projects/workspace/growth-diary"

# 获取 GitHub 最新提交时间
cd "$PROJECT_DIR"
GITHUB_TIME=$(git log -1 --format=%ct)
GITHUB_DATE=$(git log -1 --format=%cd)
echo "GitHub 最新提交: $GITHUB_DATE"
echo ""

echo "正在监控网站部署状态（每30秒检查一次，最多10次）..."
echo ""

for i in {1..10}; do
    echo "[$i/10] $(date '+%H:%M:%S') 检查中..."
    
    # 获取网站 last-modified
    LAST_MODIFIED=$(curl -s -I "$SITE_URL" 2>&1 | grep -i last-modified | awk -F': ' '{print $2}')
    
    if [ -n "$LAST_MODIFIED" ]; then
        # 转换为时间戳
        PAGE_TIME=$(date -d "$LAST_MODIFIED" +%s 2>/dev/null || echo 0)
        
        if [ "$PAGE_TIME" -ge "$GITHUB_TIME" ]; then
            echo ""
            echo "✅ 部署完成！网站已更新"
            echo "   网站时间: $LAST_MODIFIED"
            echo "   GitHub时间: $GITHUB_DATE"
            exit 0
        else
            echo "   网站: $LAST_MODIFIED (未更新)"
        fi
    fi
    
    if [ $i -lt 10 ]; then
        echo "   等待 30 秒..."
        sleep 30
    fi
done

echo ""
echo "⚠️  监控结束，网站仍未更新"
echo ""
echo "可能原因:"
echo "1. GitHub Pages 部署延迟超过 5 分钟"
echo "2. Pages 设置问题（检查 Settings > Pages）"
echo "3. CDN 缓存未刷新"
echo ""
echo "建议:"
echo "- 访问 https://github.com/yejigang-lab/xiaoqian-growth-diary/settings/pages"
echo "- 确认 Source 设置为 'Deploy from a branch'"
echo "- 确认 Branch 设置为 'main' / 'root'"
