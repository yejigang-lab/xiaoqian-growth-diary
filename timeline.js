/**
 * 时光轴功能脚本
 * 功能：日历视图、时间线展示、日期跳转、数据统计
 */

// ==================== 数据管理 ====================
const TimelineData = {
    // 获取所有数据（从主站 Storage 或生成模拟数据）
    getAllData() {
        // 尝试从主站获取数据
        const mainData = localStorage.getItem('xiaoqian_data');
        let posts = [];
        let guestbook = [];
        
        if (mainData) {
            const data = JSON.parse(mainData);
            posts = data.posts || [];
            guestbook = data.guestbook || [];
        }
        
        // 添加日记文件数据（模拟）
        const diaryEntries = this.getDiaryEntries();
        
        // 合并所有数据
        const allItems = [
            ...posts.map(p => ({
                type: 'shuoshuo',
                id: p.id,
                date: new Date(p.time),
                content: p.content,
                tags: p.tags || [],
                likes: p.likes || 0,
                comments: p.comments ? p.comments.length : 0,
                images: p.images || []
            })),
            ...guestbook.map((g, idx) => ({
                type: 'guestbook',
                id: `guestbook_${idx}`,
                date: new Date(g.time),
                content: g.content,
                author: g.author,
                tags: ['留言']
            })),
            ...diaryEntries
        ];
        
        // 按时间排序（最新的在前）
        return allItems.sort((a, b) => b.date - a.date);
    },
    
    // 获取日记条目（从文件系统）
    getDiaryEntries() {
        // 这里可以通过 AJAX 获取日记文件
        // 暂时返回模拟数据
        const entries = [];
        const today = new Date();
        
        // 生成最近7天的日记记录
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            entries.push({
                type: 'diary',
                id: `diary_${date.toISOString().split('T')[0]}`,
                date: date,
                content: `这是 ${date.toLocaleDateString('zh-CN')} 的成长日记...`,
                tags: ['日记', '成长'],
                file: `diary/${date.toISOString().split('T')[0]}.md`
            });
        }
        
        return entries;
    },
    
    // 获取统计信息
    getStats() {
        const data = this.getAllData();
        const posts = data.filter(d => d.type === 'shuoshuo');
        const diaries = data.filter(d => d.type === 'diary');
        
        // 计算记录天数（不重复的日期）
        const uniqueDates = new Set(data.map(d => 
            d.date.toISOString().split('T')[0]
        ));
        
        // 计算连续记录天数
        const streak = this.calculateStreak(Array.from(uniqueDates).sort());
        
        // 最早记录日期
        const dates = data.map(d => d.date);
        const firstDate = dates.length > 0 ? new Date(Math.min(...dates)) : null;
        
        return {
            totalPosts: posts.length,
            totalDiaries: diaries.length,
            totalDays: uniqueDates.size,
            streakDays: streak,
            firstDate: firstDate
        };
    },
    
    // 计算连续记录天数
    calculateStreak(sortedDates) {
        if (sortedDates.length === 0) return 0;
        
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        // 如果今天或昨天没有记录，连续天数为0
        if (!sortedDates.includes(today) && !sortedDates.includes(yesterday)) {
            return 0;
        }
        
        let streak = 0;
        let checkDate = new Date();
        
        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (sortedDates.includes(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // 如果是今天，允许跳过检查昨天
                if (streak === 0 && dateStr === today) {
                    checkDate.setDate(checkDate.getDate() - 1);
                    continue;
                }
                break;
            }
        }
        
        return streak;
    },
    
    // 获取某月的数据
    getMonthData(year, month) {
        const data = this.getAllData();
        return data.filter(item => {
            const itemDate = item.date;
            return itemDate.getFullYear() === year && 
                   itemDate.getMonth() === month;
        });
    },
    
    // 获取某天是否有记录
    hasContentOnDate(year, month, day) {
        const data = this.getAllData();
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        return data.filter(item => 
            item.date.toISOString().startsWith(dateStr)
        ).length;
    }
};

// ==================== 日历组件 ====================
const Calendar = {
    currentDate: new Date(),
    selectedDate: null,
    
    init() {
        this.render();
        this.bindEvents();
    },
    
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // 更新月份标题
        document.getElementById('current-month').textContent = 
            `${year}年${month + 1}月`;
        
        // 生成日历网格
        const calendarEl = document.getElementById('calendar');
        calendarEl.innerHTML = '';
        
        // 星期标题
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        weekdays.forEach(day => {
            const weekdayEl = document.createElement('div');
            weekdayEl.className = 'calendar-weekday';
            weekdayEl.textContent = day;
            calendarEl.appendChild(weekdayEl);
        });
        
        // 获取月份第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();
        
        // 上个月的日期
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const dayEl = this.createDayElement(
                prevMonthLastDay - i, 
                true, 
                false
            );
            calendarEl.appendChild(dayEl);
        }
        
        // 当前月的日期
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = year === today.getFullYear() && 
                          month === today.getMonth() && 
                          day === today.getDate();
            
            const contentCount = TimelineData.hasContentOnDate(year, month, day);
            
            const dayEl = this.createDayElement(day, false, isToday, contentCount);
            calendarEl.appendChild(dayEl);
        }
        
        // 下个月的日期
        const remainingCells = 42 - (startDayOfWeek + daysInMonth);
        for (let day = 1; day <= remainingCells; day++) {
            const dayEl = this.createDayElement(day, true, false);
            calendarEl.appendChild(dayEl);
        }
    },
    
    createDayElement(day, isOtherMonth, isToday, contentCount = 0) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        
        if (isOtherMonth) dayEl.classList.add('other-month');
        if (isToday) dayEl.classList.add('today');
        if (contentCount > 0) dayEl.classList.add('has-content');
        
        dayEl.innerHTML = `
            <span class="calendar-day-number">${day}</span>
            ${contentCount > 0 ? `<span class="calendar-day-count">${contentCount}条</span>` : ''}
        `;
        
        // 点击事件
        if (!isOtherMonth) {
            dayEl.addEventListener('click', () => {
                this.selectDate(day);
            });
        }
        
        return dayEl;
    },
    
    selectDate(day) {
        this.selectedDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth(),
            day
        );
        
        // 滚动到对应的时间线位置
        Timeline.scrollToDate(this.selectedDate);
        
        // 高亮选中的日期
        document.querySelectorAll('.calendar-day').forEach(el => {
            el.style.boxShadow = '';
        });
        event.currentTarget.style.boxShadow = '0 0 0 3px var(--primary)';
    },
    
    bindEvents() {
        // 上一月
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });
        
        // 下一月
        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });
        
        // 今天
        document.getElementById('today-btn').addEventListener('click', () => {
            this.currentDate = new Date();
            this.render();
            Timeline.scrollToDate(new Date());
        });
    }
};

// ==================== 时光轴组件 ====================
const Timeline = {
    currentFilter: 'all',
    displayCount: 10,
    
    init() {
        this.render();
        this.bindEvents();
    },
    
    render() {
        const data = TimelineData.getAllData();
        const filteredData = this.filterData(data);
        const displayData = filteredData.slice(0, this.displayCount);
        
        const timelineEl = document.getElementById('timeline');
        timelineEl.innerHTML = '';
        
        if (displayData.length === 0) {
            timelineEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🌸</div>
                    <div class="empty-text">还没有记录呢，快去首页发布第一条说说吧！</div>
                </div>
            `;
            document.getElementById('load-more').style.display = 'none';
            return;
        }
        
        // 按日期分组
        const groupedData = this.groupByDate(displayData);
        
        // 渲染时间线
        Object.entries(groupedData).forEach(([dateStr, items], index) => {
            const date = new Date(dateStr);
            const isImportant = items.some(i => i.type === 'diary');
            
            items.forEach((item, itemIndex) => {
                const itemEl = this.createTimelineItem(item, date, itemIndex === 0, isImportant);
                timelineEl.appendChild(itemEl);
            });
        });
        
        // 显示/隐藏加载更多按钮
        document.getElementById('load-more').style.display = 
            filteredData.length > this.displayCount ? 'block' : 'none';
    },
    
    createTimelineItem(item, date, isFirstOfDay, isImportant) {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        if (isImportant) div.classList.add('important');
        div.dataset.date = date.toISOString();
        
        const typeLabels = {
            'shuoshuo': '📝 说说',
            'diary': '📔 日记',
            'guestbook': '💬 留言'
        };
        
        const timeStr = date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        div.innerHTML = `
            <div class="timeline-date">
                ${isFirstOfDay ? `<span class="timeline-date-badge">${date.toLocaleDateString('zh-CN')}</span>` : ''}
                <span>${timeStr} · ${typeLabels[item.type] || '📝'}</span>
            </div>
            <div class="timeline-content">
                <div class="timeline-text">${this.escapeHtml(item.content)}</div>
                ${item.tags ? `
                <div class="timeline-tags">
                    ${item.tags.map(tag => `<span class="timeline-tag">${this.escapeHtml(tag)}</span>`).join('')}
                </div>
                ` : ''}
                <div class="timeline-meta">
                    ${item.likes !== undefined ? `<span>👍 ${item.likes}</span>` : ''}
                    ${item.comments !== undefined ? `<span>💬 ${item.comments}</span>` : ''}
                    ${item.author ? `<span>👤 ${this.escapeHtml(item.author)}</span>` : ''}
                </div>
            </div>
        `;
        
        return div;
    },
    
    groupByDate(data) {
        const grouped = {};
        data.forEach(item => {
            const dateStr = item.date.toISOString().split('T')[0];
            if (!grouped[dateStr]) grouped[dateStr] = [];
            grouped[dateStr].push(item);
        });
        return grouped;
    },
    
    filterData(data) {
        if (this.currentFilter === 'all') return data;
        return data.filter(item => item.type === this.currentFilter);
    },
    
    scrollToDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        const items = document.querySelectorAll('.timeline-item');
        
        for (let item of items) {
            if (item.dataset.date && item.dataset.date.startsWith(dateStr)) {
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                item.style.background = 'rgba(232, 155, 170, 0.1)';
                setTimeout(() => {
                    item.style.background = '';
                }, 2000);
                break;
            }
        }
    },
    
    bindEvents() {
        // 筛选按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.displayCount = 10;
                this.render();
            });
        });
        
        // 加载更多
        document.getElementById('load-more').addEventListener('click', () => {
            this.displayCount += 10;
            this.render();
        });
        
        // 快速跳转
        document.querySelectorAll('.jump-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const jump = e.target.dataset.jump;
                this.handleJump(jump);
            });
        });
    },
    
    handleJump(jump) {
        const now = new Date();
        
        switch(jump) {
            case 'today':
                this.scrollToDate(now);
                break;
            case 'week':
                const weekAgo = new Date(now - 7 * 86400000);
                this.scrollToDate(weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                this.scrollToDate(monthAgo);
                break;
            case 'first':
                const data = TimelineData.getAllData();
                if (data.length > 0) {
                    const oldest = data[data.length - 1].date;
                    this.scrollToDate(oldest);
                }
                break;
            case 'latest':
                window.scrollTo({ top: 0, behavior: 'smooth' });
                break;
        }
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ==================== 统计组件 ====================
const Stats = {
    update() {
        const stats = TimelineData.getStats();
        
        document.getElementById('total-posts').textContent = stats.totalPosts + stats.totalDiaries;
        document.getElementById('total-days').textContent = stats.totalDays;
        document.getElementById('streak-days').textContent = stats.streakDays;
        document.getElementById('first-date').textContent = stats.firstDate 
            ? stats.firstDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
            : '-';
    }
};

// ==================== 回到顶部 ====================
const BackToTop = {
    init() {
        const btn = document.getElementById('back-to-top');
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        });
        
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🕐 时光轴加载中...');
    
    // 更新统计
    Stats.update();
    
    // 初始化日历
    Calendar.init();
    
    // 初始化时光轴
    Timeline.init();
    
    // 初始化回到顶部
    BackToTop.init();
    
    console.log('✅ 时光轴加载完成！');
});

// 暴露全局变量
window.TimelineApp = { TimelineData, Calendar, Timeline, Stats };
