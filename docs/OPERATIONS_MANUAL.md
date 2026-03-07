# 小倩成长日记 - 运维手册

## 🌸 项目概述

- **网站**: https://yejigang-lab.github.io/xiaoqian-growth-diary/
- **仓库**: https://github.com/yejigang-lab/xiaoqian-growth-diary
- **本地路径**: `/workspace/projects/workspace/growth-diary`
- **类型**: GitHub Pages 静态网站

---

## 📋 监控机制

### 自动检测项

| 检查项 | 频率 | 阈值 | 自动修复 |
|--------|------|------|----------|
| 网站可访问性 | 30分钟 | HTTP 200 | ❌ |
| 最后更新时间 | 30分钟 | < 26小时 | ✅ 推送 |
| GitHub 同步状态 | 30分钟 | 无未推送提交 | ✅ 推送 |
| 日记更新 | 每天 00:00 | 今日文件存在 | ✅ 创建 |

### 定时任务

```cron
# 每 30 分钟健康检查
*/30 * * * * monitor_site.py --fix

# 每 2 小时全面修复
0 */2 * * * auto-fix.sh

# 每天 00:00 自动更新
0 0 * * * auto-update.sh
```

---

## 🚀 快速操作

### 一键安装监控

```bash
cd /workspace/projects/workspace/growth-diary
bash scripts/monitoring/install.sh
```

### 手动检查状态

```bash
# 仅检查
python3 scripts/monitoring/monitor_site.py

# 检查并修复
python3 scripts/monitoring/monitor_site.py --fix --notify

# 全面修复
bash scripts/monitoring/auto-fix.sh
```

### 手动运行更新

```bash
# 运行自动更新
bash auto-update.sh

# 或手动创建今日日记
touch diary/$(date +%Y-%m-%d).md
```

### 查看日志

```bash
# 实时监控日志
tail -f logs/monitoring.log
tail -f logs/auto-update.log

# 查看历史日志
cat logs/monitoring.log | grep "ERROR\|WARN"
```

---

## 🔧 常见问题

### 问题 1: 网站显示旧内容

**诊断**:
```bash
# 检查最后修改时间
curl -I https://yejigang-lab.github.io/xiaoqian-growth-diary/ | grep last-modified

# 检查 GitHub 提交
git log --oneline -5

# 检查未推送提交
git log origin/main..HEAD --oneline
```

**修复**:
```bash
# 推送本地提交
git push origin main

# 或运行自动修复
bash scripts/monitoring/auto-fix.sh
```

### 问题 2: 自动更新失败

**诊断**:
```bash
# 查看更新日志
cat logs/auto-update.log

# 检查脚本语法
bash -n auto-update.sh

# 测试运行
bash auto-update.sh
```

**常见原因**:
- 分支错误（应为 `main` 而非 `master`）
- Git 认证问题
- 网络问题

**修复**:
```bash
# 修复分支
git checkout main

# 手动推送
git push origin main
```

### 问题 3: GitHub Pages 部署失败

**诊断**:
```bash
# 检查 GitHub 仓库设置
# 1. 访问 https://github.com/yejigang-lab/xiaoqian-growth-diary/settings/pages
# 2. 确认 Source 设置为 "Deploy from a branch"
# 3. 确认 Branch 设置为 "main" / "root"
```

**修复**:
- 确保 `.nojekyll` 文件存在（禁用 Jekyll 处理）
- 检查仓库是否为 Public
- 等待 GitHub Pages 部署（通常 1-5 分钟）

---

## 📊 监控日志

### 日志位置

| 日志文件 | 内容 |
|----------|------|
| `logs/monitoring.log` | 健康检查日志 |
| `logs/auto-fix.log` | 自动修复日志 |
| `logs/auto-update.log` | 每日更新日志 |
| `logs/cron-*.log` | 定时任务日志 |
| `logs/hourly-status-*.log` | 每小时状态快照 |

### 日志保留

- 自动保留 7 天
- 每天 00:00 清理旧日志

---

## ⚙️ 配置调整

### 调整更新频率

编辑定时任务：
```bash
crontab -e
```

修改频率：
```cron
# 每 30 分钟 → 改为每 15 分钟
*/15 * * * * python3 scripts/monitoring/monitor_site.py --fix

# 每天 00:00 → 改为每天早上 8 点
0 8 * * * bash auto-update.sh
```

### 调整更新延迟阈值

编辑监控脚本：
```python
# monitor_site.py
MAX_UPDATE_DELAY_HOURS = 26  # 改为 48 小时
```

### 添加飞书通知

编辑 `scripts/monitoring/monitor_site.py`：
```python
def send_notification(title, message):
    webhook = os.environ.get("FEISHU_WEBHOOK_URL")
    if webhook:
        import requests
        requests.post(webhook, json={
            "msg_type": "text",
            "content": {"text": f"{title}\n{message}"}
        })
```

---

## 🛡️ 安全建议

1. **Git 认证**
   - 使用 HTTPS + Token 或 SSH 密钥
   - 定期检查 Git 凭证

2. **定时任务**
   - 避免过于频繁的检查
   - 设置合理的超时时间

3. **日志保护**
   - 日志中可能包含敏感信息
   - 定期清理并保护日志文件

---

## 📈 性能指标

| 指标 | 目标值 |
|------|--------|
| 网站可用性 | 99.9% |
| 更新延迟 | < 26 小时 |
| GitHub 同步延迟 | < 1 小时 |
| 检查响应时间 | < 30 秒 |

---

## 🔄 更新记录

| 日期 | 内容 |
|------|------|
| 2026-03-07 | 建立监控机制，修复分支错误 |

---

## 📞 故障排查流程

1. **检查监控日志**
   ```bash
   tail -50 logs/monitoring.log
   ```

2. **检查 Git 状态**
   ```bash
   git status
   git log --oneline -5
   git log origin/main..HEAD --oneline
   ```

3. **测试网站访问**
   ```bash
   curl -I https://yejigang-lab.github.io/xiaoqian-growth-diary/
   ```

4. **运行手动修复**
   ```bash
   bash scripts/monitoring/auto-fix.sh
   ```

5. **强制推送（谨慎使用）**
   ```bash
   git push origin main --force
   ```

---

**文档版本**: 1.0  
**最后更新**: 2026-03-07
