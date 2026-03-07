#!/usr/bin/env python3
"""
小倩成长日记 - 网站健康监控脚本
功能：
1. 检查网站可访问性
2. 检查最后更新时间
3. 检查 GitHub 推送状态
4. 自动修复常见问题
5. 发送告警通知

用法：
    python3 monitor_site.py [--fix] [--notify]
"""

import json
import os
import sys
import time
import argparse
import subprocess
from datetime import datetime, timezone
from pathlib import Path
import urllib.request
import urllib.error

# 配置
SITE_URL = "https://yejigang-lab.github.io/xiaoqian-growth-diary/"
PROJECT_DIR = "/workspace/projects/workspace/growth-diary"
LOG_DIR = os.path.join(PROJECT_DIR, "logs")
MONITOR_LOG = os.path.join(LOG_DIR, "monitoring.log")
STATE_FILE = os.path.join(PROJECT_DIR, ".monitor_state.json")
MAX_UPDATE_DELAY_HOURS = 26  # 最大允许更新延迟（小时）

def log_message(level, message):
    """记录监控日志"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_line = f"[{timestamp}] [{level}] {message}"
    print(log_line)
    with open(MONITOR_LOG, "a") as f:
        f.write(log_line + "\n")

def check_website_accessibility():
    """检查网站可访问性"""
    try:
        req = urllib.request.Request(SITE_URL, method='HEAD')
        req.add_header('User-Agent', 'Mozilla/5.0 (HealthCheck)')
        
        with urllib.request.urlopen(req, timeout=30) as response:
            status = response.status
            last_modified = response.headers.get('Last-Modified')
            
            return {
                "accessible": status == 200,
                "status_code": status,
                "last_modified": last_modified
            }
    except urllib.error.HTTPError as e:
        return {
            "accessible": False,
            "status_code": e.code,
            "error": str(e)
        }
    except Exception as e:
        return {
            "accessible": False,
            "status_code": 0,
            "error": str(e)
        }

def get_last_commit_time():
    """获取最后一次提交时间"""
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%ct"],
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            timestamp = int(result.stdout.strip())
            return datetime.fromtimestamp(timestamp, tz=timezone.utc)
    except Exception as e:
        log_message("ERROR", f"获取提交时间失败: {e}")
    return None

def get_github_push_status():
    """检查 GitHub 推送状态"""
    try:
        # 检查本地提交是否已推送
        result = subprocess.run(
            ["git", "log", "origin/main..HEAD", "--oneline"],
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            unpushed = result.stdout.strip()
            if unpushed:
                return {
                    "synced": False,
                    "unpushed_commits": len(unpushed.split('\n')) if unpushed else 0
                }
            else:
                return {"synced": True, "unpushed_commits": 0}
    except Exception as e:
        log_message("ERROR", f"检查推送状态失败: {e}")
    return {"synced": False, "error": str(e)}

def check_diary_update():
    """检查日记是否正常更新"""
    today = datetime.now().strftime("%Y-%m-%d")
    diary_file = os.path.join(PROJECT_DIR, "diary", f"{today}.md")
    
    if os.path.exists(diary_file):
        return {"updated": True, "file": diary_file}
    else:
        return {"updated": False, "expected_file": diary_file}

def fix_git_branch():
    """修复 Git 分支配置"""
    try:
        # 检查当前分支
        result = subprocess.run(
            ["git", "branch", "--show-current"],
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            timeout=10
        )
        current_branch = result.stdout.strip()
        
        if current_branch != "main":
            log_message("WARN", f"当前分支是 '{current_branch}'，切换到 'main'")
            subprocess.run(
                ["git", "checkout", "main"],
                cwd=PROJECT_DIR,
                capture_output=True,
                timeout=10
            )
        
        # 检查远程分支配置
        result = subprocess.run(
            ["git", "branch", "-vv"],
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        return True
    except Exception as e:
        log_message("ERROR", f"修复分支失败: {e}")
        return False

def push_to_github():
    """推送到 GitHub"""
    try:
        result = subprocess.run(
            ["git", "push", "origin", "main"],
            cwd=PROJECT_DIR,
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode == 0:
            log_message("INFO", "✅ 成功推送到 GitHub")
            return True
        else:
            log_message("ERROR", f"推送失败: {result.stderr}")
            return False
    except Exception as e:
        log_message("ERROR", f"推送异常: {e}")
        return False

def run_auto_update():
    """运行自动更新脚本"""
    try:
        script_path = os.path.join(PROJECT_DIR, "auto-update.sh")
        if os.path.exists(script_path):
            result = subprocess.run(
                ["bash", script_path],
                cwd=PROJECT_DIR,
                capture_output=True,
                text=True,
                timeout=60
            )
            log_message("INFO", f"自动更新脚本输出:\n{result.stdout}")
            if result.returncode != 0:
                log_message("ERROR", f"自动更新失败: {result.stderr}")
                return False
            return True
        else:
            log_message("ERROR", "自动更新脚本不存在")
            return False
    except Exception as e:
        log_message("ERROR", f"运行自动更新异常: {e}")
        return False

def load_state():
    """加载监控状态"""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r") as f:
                return json.load(f)
        except:
            pass
    return {
        "last_check": 0,
        "issues_found": 0,
        "fixes_applied": 0,
        "last_successful_update": 0
    }

def save_state(state):
    """保存监控状态"""
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

def send_notification(title, message):
    """发送通知"""
    log_message("NOTIFY", f"[{title}] {message}")
    
    # 可以在这里添加飞书/钉钉通知
    # webhook = os.environ.get("FEISHU_WEBHOOK_URL")
    # if webhook:
    #     send_feishu_notification(webhook, title, message)

def main():
    parser = argparse.ArgumentParser(description="小倩成长日记网站监控")
    parser.add_argument("--fix", action="store_true", help="自动修复问题")
    parser.add_argument("--notify", action="store_true", help="发送通知")
    parser.add_argument("--run-update", action="store_true", help="运行自动更新")
    args = parser.parse_args()
    
    log_message("INFO", "=" * 60)
    log_message("INFO", "开始网站健康检查")
    
    state = load_state()
    issues_found = []
    fixes_applied = []
    
    # 1. 检查网站可访问性
    log_message("INFO", "检查网站可访问性...")
    web_status = check_website_accessibility()
    if web_status["accessible"]:
        log_message("INFO", f"✅ 网站可访问 (HTTP {web_status['status_code']})")
        log_message("INFO", f"   最后修改: {web_status.get('last_modified', '未知')}")
    else:
        log_message("ERROR", f"❌ 网站不可访问 (HTTP {web_status['status_code']})")
        log_message("ERROR", f"   错误: {web_status.get('error', '未知')}")
        issues_found.append("website_inaccessible")
    
    # 2. 检查最后提交时间
    log_message("INFO", "检查最后提交时间...")
    last_commit = get_last_commit_time()
    if last_commit:
        now = datetime.now(tz=timezone.utc)
        hours_since_commit = (now - last_commit).total_seconds() / 3600
        log_message("INFO", f"   最后提交: {last_commit.strftime('%Y-%m-%d %H:%M:%S')}")
        log_message("INFO", f"   距今: {hours_since_commit:.1f} 小时")
        
        if hours_since_commit > MAX_UPDATE_DELAY_HOURS:
            log_message("WARN", f"⚠️  超过 {MAX_UPDATE_DELAY_HOURS} 小时未更新")
            issues_found.append("update_overdue")
        else:
            log_message("INFO", "✅ 更新正常")
            state["last_successful_update"] = int(last_commit.timestamp())
    else:
        log_message("ERROR", "❌ 无法获取提交时间")
        issues_found.append("cannot_get_commit_time")
    
    # 3. 检查 GitHub 同步状态
    log_message("INFO", "检查 GitHub 同步状态...")
    push_status = get_github_push_status()
    if push_status.get("synced"):
        log_message("INFO", "✅ 本地与 GitHub 同步")
    else:
        unpushed = push_status.get("unpushed_commits", 0)
        log_message("WARN", f"⚠️  有 {unpushed} 个提交未推送到 GitHub")
        issues_found.append("not_synced")
        
        if args.fix:
            log_message("INFO", "正在推送到 GitHub...")
            if fix_git_branch() and push_to_github():
                fixes_applied.append("pushed_to_github")
                log_message("INFO", "✅ 推送完成")
            else:
                log_message("ERROR", "❌ 推送失败")
    
    # 4. 检查今日日记
    log_message("INFO", "检查今日日记...")
    diary_status = check_diary_update()
    if diary_status["updated"]:
        log_message("INFO", f"✅ 今日日记已创建: {diary_status['file']}")
    else:
        log_message("WARN", f"⚠️  今日日记未创建: {diary_status['expected_file']}")
        issues_found.append("diary_not_created")
        
        if args.run_update:
            log_message("INFO", "正在运行自动更新脚本...")
            if run_auto_update():
                fixes_applied.append("ran_auto_update")
                log_message("INFO", "✅ 自动更新完成")
            else:
                log_message("ERROR", "❌ 自动更新失败")
    
    # 5. 总结
    log_message("INFO", "-" * 60)
    if issues_found:
        log_message("WARN", f"⚠️  发现 {len(issues_found)} 个问题: {', '.join(issues_found)}")
        if fixes_applied:
            log_message("INFO", f"✅ 已自动修复 {len(fixes_applied)} 个问题")
        
        if args.notify:
            send_notification(
                "小倩成长日记 - 网站监控告警",
                f"发现问题: {', '.join(issues_found)}\n已修复: {', '.join(fixes_applied) if fixes_applied else '无'}"
            )
    else:
        log_message("INFO", "✅ 所有检查通过，网站健康")
    
    # 6. 保存状态
    state["last_check"] = int(time.time())
    state["issues_found"] = len(issues_found)
    state["fixes_applied"] = len(fixes_applied)
    save_state(state)
    
    log_message("INFO", "=" * 60)
    
    return 0 if not issues_found else (0 if fixes_applied else 1)

if __name__ == "__main__":
    sys.exit(main())
