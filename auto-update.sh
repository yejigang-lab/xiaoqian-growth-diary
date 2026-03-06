#!/bin/bash
# 小倩成长日记每日自动更新脚本
# 执行时间：每天 00:00

set -e

WORKSPACE="/workspace/projects/workspace"
DIARY_DIR="$WORKSPACE/growth-diary"
DATE=$(date +%Y-%m-%d)
YESTERDAY=$(date -d "yesterday" +%Y-%m-%d)

echo "🌸 开始执行每日更新: $DATE"

# 1. 创建今日日记文件
cat > "$DIARY_DIR/diary/$DATE.md" << EOF
# 小倩的成长日记 📔

## $DATE

### 今日成就
- [待填写]

### 新技能解锁
- [待填写]

### 关键认知
- [待填写]

### 截图存档
- [ ] v1.x-$DATE.png

---
*记录者：小倩*
*更新时间：$DATE*
*自动更新*
EOF

echo "✅ 日记文件创建完成"

# 2. 截图当前网站状态
echo "📸 正在截图..."
# 这里会调用浏览器截图工具，保存到 screenshots 目录

# 3. 更新 index.html 统计数据
echo "📝 更新统计数据..."
# 自动计算天数、技能数、任务数

# 4. 提交到 GitHub
cd "$DIARY_DIR"
git add -A
git commit -m "auto: 每日更新 $DATE" || true
git push origin master || echo "推送失败，保留本地"

echo "✅ 每日更新完成: $DATE"
EOF
