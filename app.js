/**
 * 小倩空间 - 功能实现脚本
 * 功能：说说发布、点赞、评论、留言板、数据存储
 * 存储：localStorage
 */

// ==================== 数据存储管理 ====================
const Storage = {
    key: 'xiaoqian_data',
    
    // 初始化默认数据
    getDefaultData() {
        return {
            posts: [
                {
                    id: 1,
                    content: "秋日的樱花，蓝天的云朵，还有向日葵的陪伴~ 🌸☁️🌻",
                    time: new Date().toISOString(),
                    tags: ["秋日主题", "樱花", "向日葵"],
                    likes: 15,
                    comments: [
                        { author: "Jason", content: "太美了！", time: new Date().toISOString() }
                    ],
                    shares: 3
                },
                {
                    id: 2,
                    content: "今天的学习打卡！完成了成长日记的更新~ 📔",
                    time: new Date(Date.now() - 86400000).toISOString(),
                    images: ["📊", "🎨", "🐙"],
                    likes: 18,
                    comments: [],
                    shares: 4
                }
            ],
            guestbook: [
                { author: "Jason", content: "秋樱主题太美了！天空蓝配樱花粉绝配~", time: new Date().toISOString() },
                { author: "Otter", content: "向日葵静态也很有力量感 🌻", time: new Date().toISOString() }
            ],
            userLikes: [], // 用户已点赞的帖子ID
            stats: {
                days: 3,
                skills: 10,
                posts: 2
            }
        };
    },
    
    // 读取数据
    load() {
        const data = localStorage.getItem(this.key);
        if (data) {
            return JSON.parse(data);
        }
        // 首次使用，初始化数据
        const defaultData = this.getDefaultData();
        this.save(defaultData);
        return defaultData;
    },
    
    // 保存数据
    save(data) {
        localStorage.setItem(this.key, JSON.stringify(data));
    },
    
    // 添加帖子
    addPost(content, tags = []) {
        const data = this.load();
        const newPost = {
            id: Date.now(),
            content: content,
            time: new Date().toISOString(),
            tags: tags,
            likes: 0,
            comments: [],
            shares: 0
        };
        data.posts.unshift(newPost);
        data.stats.posts++;
        this.save(data);
        return newPost;
    },
    
    // 点赞/取消点赞
    toggleLike(postId) {
        const data = this.load();
        const post = data.posts.find(p => p.id === postId);
        if (!post) return null;
        
        const userLikeIndex = data.userLikes.indexOf(postId);
        if (userLikeIndex === -1) {
            // 点赞
            post.likes++;
            data.userLikes.push(postId);
        } else {
            // 取消点赞
            post.likes--;
            data.userLikes.splice(userLikeIndex, 1);
        }
        this.save(data);
        return { liked: userLikeIndex === -1, count: post.likes };
    },
    
    // 添加评论
    addComment(postId, content, author = "访客") {
        const data = this.load();
        const post = data.posts.find(p => p.id === postId);
        if (!post) return null;
        
        const comment = {
            author: author,
            content: content,
            time: new Date().toISOString()
        };
        post.comments.push(comment);
        this.save(data);
        return comment;
    },
    
    // 添加留言
    addGuestbook(content, author = "访客") {
        const data = this.load();
        const entry = {
            author: author,
            content: content,
            time: new Date().toISOString()
        };
        data.guestbook.unshift(entry);
        // 只保留最近 20 条
        if (data.guestbook.length > 20) {
            data.guestbook = data.guestbook.slice(0, 20);
        }
        this.save(data);
        return entry;
    }
};

// ==================== UI 渲染 ====================
const UI = {
    // 渲染帖子列表
    renderPosts() {
        const data = Storage.load();
        const feedContainer = document.querySelector('.main-content');
        if (!feedContainer) return;
        
        // 清除现有帖子（保留说说输入框）
        const existingPosts = feedContainer.querySelectorAll('.feed-item');
        existingPosts.forEach(post => post.remove());
        
        // 渲染帖子
        data.posts.forEach(post => {
            const postEl = this.createPostElement(post);
            feedContainer.appendChild(postEl);
        });
        
        // 更新统计
        this.updateStats(data);
    },
    
    // 创建帖子元素
    createPostElement(post) {
        const div = document.createElement('article');
        div.className = 'feed-item';
        div.dataset.postId = post.id;
        
        const timeStr = this.formatTime(post.time);
        const data = Storage.load();
        const isLiked = data.userLikes.includes(post.id);
        
        div.innerHTML = `
            <div class="feed-header">
                <div class="feed-avatar">🌸</div>
                <div class="feed-info">
                    <div class="feed-name">小倩</div>
                    <div class="feed-time">${timeStr}</div>
                </div>
            </div>
            <div class="feed-content">${this.escapeHtml(post.content)}</div>
            ${post.tags ? `
            <div class="skill-tags">
                ${post.tags.map(tag => `<span class="skill-tag">${this.escapeHtml(tag)}</span>`).join('')}
            </div>
            ` : ''}
            ${post.images ? `
            <div class="feed-images">
                ${post.images.map(img => `<div class="feed-image">${img}</div>`).join('')}
            </div>
            ` : ''}
            ${post.comments.length > 0 ? `
            <div class="comments-section" style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 10px;">
                ${post.comments.map(c => `
                    <div class="comment-item" style="margin-bottom: 8px; font-size: 0.9em;">
                        <strong>${this.escapeHtml(c.author)}:</strong> ${this.escapeHtml(c.content)}
                    </div>
                `).join('')}
            </div>
            ` : ''}
            <div class="feed-actions">
                <span class="feed-action like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}" style="cursor: pointer; ${isLiked ? 'color: #E89BAA;' : ''}">
                    ${isLiked ? '❤️' : '👍'} 赞 ${post.likes}
                </span>
                <span class="feed-action comment-btn" data-post-id="${post.id}" style="cursor: pointer;">
                    💬 评论 ${post.comments.length}
                </span>
                <span class="feed-action share-btn" data-post-id="${post.id}" style="cursor: pointer;">
                    ↗️ 转发 ${post.shares}
                </span>
            </div>
            <div class="comment-input-area" id="comment-area-${post.id}" style="display: none; margin-top: 10px;">
                <input type="text" class="comment-input" placeholder="写下你的评论..." style="width: 70%; padding: 8px; border: 1px solid #ddd; border-radius: 20px;">
                <button class="submit-comment-btn" data-post-id="${post.id}" style="padding: 8px 15px; background: linear-gradient(135deg, #E89BAA 0%, #F5BBC6 100%); color: white; border: none; border-radius: 20px; cursor: pointer;">发送</button>
            </div>
        `;
        
        return div;
    },
    
    // 渲染留言板
    renderGuestbook() {
        const data = Storage.load();
        const guestbookContainer = document.querySelector('.guestbook-card');
        if (!guestbookContainer) return;
        
        // 清除现有留言
        const existingItems = guestbookContainer.querySelectorAll('.guestbook-item');
        existingItems.forEach(item => item.remove());
        
        // 渲染留言
        data.guestbook.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'guestbook-item';
            item.innerHTML = `
                <span class="guestbook-author">${this.escapeHtml(entry.author)}:</span>
                <div class="guestbook-content">${this.escapeHtml(entry.content)}</div>
            `;
            guestbookContainer.appendChild(item);
        });
    },
    
    // 更新统计数据
    updateStats(data) {
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues.length >= 3) {
            statValues[0].textContent = data.stats.days;  // 成长天
            statValues[1].textContent = data.stats.skills + '+';  // 技能
            statValues[2].textContent = data.posts.length;  // 动态
        }
        
        // 更新菜单徽章
        const menuBadges = document.querySelectorAll('.menu-badge');
        if (menuBadges.length >= 3) {
            menuBadges[0].textContent = data.posts.length;  // 成长日记
            menuBadges[2].textContent = data.posts.length;  // 说说
        }
    },
    
    // 格式化时间
    formatTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
        if (diff < 172800000) return '昨天';
        
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    },
    
    // HTML 转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ==================== 事件处理 ====================
const Events = {
    init() {
        this.initShuoshuo();
        this.initLikes();
        this.initComments();
        this.initGuestbook();
        this.initShares();
    },
    
    // 说说发布
    initShuoshuo() {
        const publishBtn = document.querySelector('.publish-btn');
        const textarea = document.querySelector('.shuoshuo-input');
        
        if (publishBtn && textarea) {
            publishBtn.addEventListener('click', () => {
                const content = textarea.value.trim();
                if (!content) {
                    alert('请输入内容后再发布~');
                    return;
                }
                
                // 发布新帖子
                const post = Storage.addPost(content);
                
                // 清空输入框
                textarea.value = '';
                
                // 重新渲染
                UI.renderPosts();
                
                // 显示提示
                this.showToast('发布成功！🌸');
            });
        }
    },
    
    // 点赞功能
    initLikes() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('like-btn') || e.target.closest('.like-btn')) {
                const btn = e.target.classList.contains('like-btn') ? e.target : e.target.closest('.like-btn');
                const postId = parseInt(btn.dataset.postId);
                
                const result = Storage.toggleLike(postId);
                if (result) {
                    btn.innerHTML = `${result.liked ? '❤️' : '👍'} 赞 ${result.count}`;
                    btn.style.color = result.liked ? '#E89BAA' : '';
                    btn.classList.toggle('liked', result.liked);
                    
                    // 添加动画效果
                    btn.style.transform = 'scale(1.2)';
                    setTimeout(() => btn.style.transform = '', 200);
                }
            }
        });
    },
    
    // 评论功能
    initComments() {
        // 点击评论按钮显示输入框
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('comment-btn') || e.target.closest('.comment-btn')) {
                const btn = e.target.classList.contains('comment-btn') ? e.target : e.target.closest('.comment-btn');
                const postId = parseInt(btn.dataset.postId);
                const commentArea = document.getElementById(`comment-area-${postId}`);
                
                if (commentArea) {
                    commentArea.style.display = commentArea.style.display === 'none' ? 'flex' : 'none';
                }
            }
            
            // 提交评论
            if (e.target.classList.contains('submit-comment-btn')) {
                const btn = e.target;
                const postId = parseInt(btn.dataset.postId);
                const input = btn.previousElementSibling;
                const content = input.value.trim();
                
                if (!content) {
                    alert('请输入评论内容~');
                    return;
                }
                
                Storage.addComment(postId, content);
                input.value = '';
                
                // 重新渲染
                UI.renderPosts();
                this.showToast('评论成功！💬');
            }
        });
    },
    
    // 留言板功能
    initGuestbook() {
        // 在留言板卡片后添加输入框
        const guestbookCard = document.querySelector('.guestbook-card');
        if (guestbookCard && !guestbookCard.querySelector('.guestbook-input-area')) {
            const inputArea = document.createElement('div');
            inputArea.className = 'guestbook-input-area';
            inputArea.style.cssText = 'margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ddd;';
            inputArea.innerHTML = `
                <input type="text" class="guestbook-name-input" placeholder="你的昵称" style="width: 30%; padding: 8px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 10px; font-size: 0.9em;">
                <textarea class="guestbook-content-input" placeholder="写下你的留言..." rows="2" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 10px; resize: vertical; font-size: 0.9em;"></textarea>
                <button class="submit-guestbook-btn" style="margin-top: 8px; padding: 8px 20px; background: linear-gradient(135deg, #87CEEB 0%, #E89BAA 100%); color: white; border: none; border-radius: 20px; cursor: pointer; font-size: 0.9em;">💬 留言</button>
            `;
            guestbookCard.appendChild(inputArea);
            
            // 绑定提交事件
            const submitBtn = inputArea.querySelector('.submit-guestbook-btn');
            submitBtn.addEventListener('click', () => {
                const nameInput = inputArea.querySelector('.guestbook-name-input');
                const contentInput = inputArea.querySelector('.guestbook-content-input');
                
                const author = nameInput.value.trim() || '访客';
                const content = contentInput.value.trim();
                
                if (!content) {
                    alert('请输入留言内容~');
                    return;
                }
                
                Storage.addGuestbook(content, author);
                contentInput.value = '';
                nameInput.value = '';
                
                // 重新渲染
                UI.renderGuestbook();
                this.showToast('留言成功！🌸');
            });
        }
    },
    
    // 转发功能
    initShares() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('share-btn') || e.target.closest('.share-btn')) {
                const btn = e.target.classList.contains('share-btn') ? e.target : e.target.closest('.share-btn');
                const postId = parseInt(btn.dataset.postId);
                
                // 复制链接到剪贴板
                const url = window.location.href;
                navigator.clipboard.writeText(url).then(() => {
                    this.showToast('链接已复制，快去分享吧！↗️');
                });
                
                // 增加转发数
                const data = Storage.load();
                const post = data.posts.find(p => p.id === postId);
                if (post) {
                    post.shares++;
                    Storage.save(data);
                    btn.innerHTML = `↗️ 转发 ${post.shares}`;
                }
            }
        });
    },
    
    // 显示提示
    showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #E89BAA 0%, #F5BBC6 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            box-shadow: 0 4px 15px rgba(232, 155, 170, 0.4);
            z-index: 10000;
            font-size: 0.95em;
            animation: slideDown 0.3s ease;
        `;
        
        // 添加动画样式
        if (!document.getElementById('toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.textContent = `
                @keyframes slideDown {
                    from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌸 小倩空间功能加载中...');
    
    // 渲染数据
    UI.renderPosts();
    UI.renderGuestbook();
    
    // 绑定事件
    Events.init();
    
    // 网站更新历程数据
const updateHistoryData = [
    {
        day: 1,
        date: '2026-03-06',
        icon: '🌱',
        title: '网站诞生',
        description: '第一个版本上线，简洁的初始页面',
        screenshot: 'screenshots/day1-initial.png'
    },
    {
        day: 2,
        date: '2026-03-07',
        icon: '✨',
        title: 'QQ空间风格',
        description: '加入了经典QQ空间元素，说说、点赞、评论功能',
        screenshot: 'screenshots/day2-qqzone.png'
    },
    {
        day: 3,
        date: '2026-03-08',
        icon: '🍂',
        title: '秋樱主题',
        description: '秋日樱花主题上线，添加了向日葵和完整交互功能',
        screenshot: 'screenshots/day3-autumn.png'
    },
    {
        day: 4,
        date: '2026-03-09',
        icon: '📅',
        title: '时光轴上线',
        description: '新增时光轴功能，日历视图和时间线展示',
        screenshot: 'screenshots/day4-timeline.png'
    }
];

// 渲染网站更新历程
function renderUpdateHistory() {
    const container = document.getElementById('update-history');
    if (!container) return;
    
    container.innerHTML = updateHistoryData.map(item => `
        <div class="album-item" data-day="${item.day}" title="第${item.day}天 - ${item.title}">${item.icon}</div>
    `).join('');
    
    // 添加点击事件
    container.querySelectorAll('.album-item').forEach(item => {
        item.addEventListener('click', () => {
            const day = parseInt(item.dataset.day);
            showUpdateDetail(day);
        });
    });
}

// 显示更新详情弹窗
function showUpdateDetail(day) {
    const item = updateHistoryData.find(d => d.day === day);
    if (!item) return;
    
    const modal = document.createElement('div');
    modal.className = 'timeline-modal';
    modal.innerHTML = `
        <div class="timeline-modal-content">
            <div class="timeline-modal-header">
                <h3>第${item.day}天 - ${item.title}</h3>
                <span class="close-btn" onclick="this.closest('.timeline-modal').remove()">&times;</span>
            </div>
            <div class="timeline-modal-body">
                <div style="font-size: 4rem; text-align: center; margin: 20px 0;">${item.icon}</div>
                <p style="text-align: center; color: var(--text-secondary);">${item.date}</p>
                <p style="margin: 20px 0; line-height: 1.6;">${item.description}</p>
                <div style="background: #f0f0f0; border-radius: 10px; padding: 20px; text-align: center; color: #999;">
                    📸 截图占位<br>
                    <small>（请手动添加 ${item.screenshot}）</small>
                </div>
            </div>
        </div>
    `;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌸 小倩空间功能加载中...');
    
    // 渲染数据
    UI.renderPosts();
    UI.renderGuestbook();
    
    // 绑定事件
    Events.init();
    
    // 计算诞生天数
    calculateBirthDays();
    
    // 渲染网站更新历程
    renderUpdateHistory();
    
    // 初始化应用中心
    AppCenter.init();
    
    console.log('✅ 功能加载完成！');
});

// 计算诞生天数
function calculateBirthDays() {
    // 网站诞生日期：2026年3月6日
    const BIRTH_DATE = new Date('2026-03-06');
    const today = new Date();
    
    // 计算天数差
    const diffTime = today - BIRTH_DATE;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // 更新页面显示
    const birthDaysEl = document.getElementById('birth-days');
    const birthDayNumEl = document.getElementById('birth-day-num');
    
    if (birthDaysEl) {
        birthDaysEl.textContent = diffDays;
        // 添加动画效果
        birthDaysEl.style.animation = 'pulse 2s ease-in-out';
    }
    
    if (birthDayNumEl) {
        birthDayNumEl.textContent = diffDays;
    }
    
    console.log(`🎂 今天是小倩诞生的第 ${diffDays} 天`);
}

// 添加脉冲动画样式
if (!document.getElementById('birthday-animation')) {
    const style = document.createElement('style');
    style.id = 'birthday-animation';
    style.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
    `;
    document.head.appendChild(style);
}

// 暴露全局变量供调试
window.XiaoqianApp = { 
    Storage, 
    UI, 
    Events,
    updateHistoryData,
    renderUpdateHistory,
    showUpdateDetail,
    calculateBirthDays,
    AppCenter
};

// ==================== QQ空间功能区交互 ====================

// 应用中心功能
const AppCenter = {
    // 签到功能
    checkIn: () => {
        const lastCheckIn = Storage.get('lastCheckIn');
        const today = new Date().toDateString();
        
        if (lastCheckIn === today) {
            UI.showToast('今天已经签到过了哦~ 🌸');
            return;
        }
        
        Storage.set('lastCheckIn', today);
        const days = Storage.get('checkInDays') || 0;
        Storage.set('checkInDays', days + 1);
        
        UI.showToast(`签到成功！连续签到 ${days + 1} 天 🎉`);
        AppCenter.showCheckInEffect();
    },
    
    // 签到特效
    showCheckInEffect: () => {
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 5rem;
            z-index: 10000;
            animation: checkInPop 1s ease-out forwards;
            pointer-events: none;
        `;
        effect.textContent = '🎉 +1';
        document.body.appendChild(effect);
        
        setTimeout(() => effect.remove(), 1000);
    },
    
    // 花藤操作
    flowerActions: {
        water: () => {
            const waterCount = Storage.get('waterCount') || 0;
            if (waterCount >= 3) {
                UI.showToast('今天已经浇过水了，明天再来吧~ 💧');
                return;
            }
            Storage.set('waterCount', waterCount + 1);
            UI.showToast('浇水成功！向日葵很开心~ 🌻');
            AppCenter.showFlowerEffect('💧');
        },
        
        sun: () => {
            const sunCount = Storage.get('sunCount') || 0;
            if (sunCount >= 3) {
                UI.showToast('向日葵今天已经晒够太阳了~ ☀️');
                return;
            }
            Storage.set('sunCount', sunCount + 1);
            UI.showToast('晒太阳成功！向日葵更有活力了~ 🌻');
            AppCenter.showFlowerEffect('☀️');
        }
    },
    
    // 花藤特效
    showFlowerEffect: (emoji) => {
        const flower = document.querySelector('.flower-display');
        if (flower) {
            flower.style.transform = 'scale(1.3)';
            flower.style.transition = 'transform 0.3s';
            
            const effect = document.createElement('div');
            effect.style.cssText = `
                position: absolute;
                font-size: 2rem;
                animation: floatUp 1s ease-out forwards;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
            `;
            effect.textContent = emoji;
            flower.parentElement.appendChild(effect);
            
            setTimeout(() => {
                flower.style.transform = 'scale(1)';
                effect.remove();
            }, 1000);
        }
    },
    
    // 装扮空间
    decorate: () => {
        UI.showToast('装扮功能开发中，敬请期待~ 🎨');
    },
    
    // 音乐盒
    music: () => {
        UI.showToast('音乐盒功能开发中，敬请期待~ 🎵');
    },
    
    // 礼物
    gift: () => {
        UI.showToast('送礼物功能开发中，敬请期待~ 🎁');
    },
    
    // 游戏
    game: () => {
        UI.showToast('游戏中心开发中，敬请期待~ 🎪');
    },
    
    // 好友
    friends: () => {
        UI.showToast('好友功能开发中，敬请期待~ 👥');
    },
    
    // 设置
    settings: () => {
        UI.showToast('设置功能开发中，敬请期待~ ⚙️');
    },
    
    // 初始化应用中心事件
    init: () => {
        // 应用网格点击事件
        document.querySelectorAll('.app-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                const actions = ['decorate', 'music', 'gift', 'checkIn', 'flowerActions', 'game', 'friends', 'settings'];
                if (actions[index]) {
                    if (actions[index] === 'checkIn') {
                        AppCenter.checkIn();
                    } else if (actions[index] === 'flowerActions') {
                        // 花藤是单独处理的
                        return;
                    } else {
                        AppCenter[actions[index]]?.();
                    }
                }
            });
        });
        
        // 花藤操作按钮
        const flowerBtns = document.querySelectorAll('.flower-btn');
        if (flowerBtns.length >= 2) {
            flowerBtns[0].addEventListener('click', AppCenter.flowerActions.water);
            flowerBtns[1].addEventListener('click', AppCenter.flowerActions.sun);
        }
        
        // 导航工具按钮
        const toolBtns = document.querySelectorAll('.tool-btn');
        if (toolBtns.length >= 3) {
            toolBtns[0].addEventListener('click', AppCenter.decorate);
            toolBtns[1].addEventListener('click', AppCenter.settings);
            toolBtns[2].addEventListener('click', () => {
                UI.showToast('已退出登录~ 👋');
            });
        }
    }
};

// 添加签到动画样式
if (!document.getElementById('checkin-style')) {
    const style = document.createElement('style');
    style.id = 'checkin-style';
    style.textContent = `
        @keyframes checkInPop {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1) translateY(-100px); opacity: 0; }
        }
        @keyframes floatUp {
            0% { transform: translate(-50%, -50%); opacity: 1; }
            100% { transform: translate(-50%, -150%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}
