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
    
    console.log('✅ 功能加载完成！');
});

// 暴露全局变量供调试
window.XiaoqianApp = { Storage, UI, Events };
