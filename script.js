class PomodoroTimer {
    constructor() {
        this.isRunning = false;
        this.isStudyMode = true;
        this.totalSeconds = 0;
        this.currentSessionStart = 0;
        this.currentSessionSeconds = 0;
        this.timer = null;
        this.studySessions = 0;
        this.totalStudyTime = 0;
        this.totalBreakTime = 0;
        
        // New features
        this.dailyGoal = 0;
        this.sessionGoal = 25; // Default 25 minutes per session
        this.isDarkMode = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadStats();
        this.loadSettings();
        this.updateDisplay();
        this.updateProgressBar();
        this.updateGoalProgress();
    }

    initializeElements() {
        this.timeDisplayElement = document.getElementById('timeDisplay');
        this.modeIndicatorElement = document.getElementById('modeIndicator');
        this.startBtn = document.getElementById('startBtn');
        this.breakBtn = document.getElementById('breakBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.currentSessionElement = document.getElementById('currentSession');
        this.todayTotalElement = document.getElementById('todayTotal');
        this.studySessionsElement = document.getElementById('studySessions');
        this.totalStudyTimeElement = document.getElementById('totalStudyTime');
        this.totalBreakTimeElement = document.getElementById('totalBreakTime');
        this.notification = document.getElementById('notification');
        this.notificationText = document.getElementById('notificationText');
        this.timerDisplay = document.querySelector('.timer-display');
        
        // Progress bar elements
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        
        // Goal elements
        this.dailyGoalInput = document.getElementById('dailyGoal');
        this.setGoalBtn = document.getElementById('setGoalBtn');
        this.goalText = document.getElementById('goalText');
        this.goalProgress = document.getElementById('goalProgress');
        this.goalFill = document.getElementById('goalFill');
        
        // Theme and export elements
        this.themeToggle = document.getElementById('themeToggle');
        this.exportBtn = document.getElementById('exportBtn');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startTimer());
        this.breakBtn.addEventListener('click', () => this.switchToBreak());
        this.resetBtn.addEventListener('click', () => this.resetTimer());

        // Goal events
        this.setGoalBtn.addEventListener('click', () => this.setDailyGoal());
        this.dailyGoalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.setDailyGoal();
        });

        // Theme and export events
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Export dropdown events
        document.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const format = e.currentTarget.dataset.format;
                this.exportStats(format);
            });
        });

        // Request notification permission
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    setDailyGoal() {
        const goal = parseInt(this.dailyGoalInput.value);
        if (goal && goal > 0 && goal <= 1440) {
            this.dailyGoal = goal;
            this.dailyGoalInput.value = '';
            this.saveSettings();
            this.updateGoalProgress();
            this.showNotification(`Daily goal set to ${goal} minutes!`, 'success');
        } else {
            this.showNotification('Please enter a valid goal (1-1440 minutes)', 'error');
        }
    }

    updateGoalProgress() {
        if (this.dailyGoal > 0) {
            const progress = Math.min((this.totalStudyTime / this.dailyGoal) * 100, 100);
            this.goalText.textContent = `Daily Goal: ${this.dailyGoal} minutes`;
            this.goalProgress.textContent = `Progress: ${this.totalStudyTime} of ${this.dailyGoal} min (${Math.round(progress)}%)`;
            this.goalFill.style.width = `${progress}%`;
            
            // Check if goal is reached
            if (this.totalStudyTime >= this.dailyGoal && progress === 100) {
                this.showNotification('🎉 Daily goal achieved! Great job!', 'success');
                this.playGoalAchievedSound();
            }
        } else {
            this.goalText.textContent = 'No goal set';
            this.goalProgress.textContent = 'Set a daily goal to track progress';
            this.goalFill.style.width = '0%';
        }
    }

    updateProgressBar() {
        if (this.isRunning) {
            const progress = Math.min((this.currentSessionSeconds / (this.sessionGoal * 60)) * 100, 100);
            this.progressFill.style.width = `${progress}%`;
            this.progressText.textContent = `${Math.round(progress)}%`;
        } else {
            this.progressFill.style.width = '0%';
            this.progressText.textContent = '0%';
        }
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        this.themeToggle.innerHTML = this.isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        this.saveSettings();
        this.showNotification(`${this.isDarkMode ? 'Dark' : 'Light'} mode enabled`, 'info');
    }

    exportStats(format = 'json') {
        const stats = {
            date: new Date().toDateString(),
            studySessions: this.studySessions,
            totalStudyTime: this.totalStudyTime,
            totalBreakTime: this.totalBreakTime,
            dailyGoal: this.dailyGoal,
            goalProgress: this.dailyGoal > 0 ? Math.round((this.totalStudyTime / this.dailyGoal) * 100) : 0
        };

        if (format === 'image') {
            this.exportAsImage(stats);
        } else {
            this.exportAsJSON(stats);
        }
    }

    exportAsJSON(stats) {
        const dataStr = JSON.stringify(stats, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `pomodoro-stats-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('Stats exported as JSON!', 'success');
    }

    exportAsImage(stats) {
        const canvas = document.getElementById('progressCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        canvas.width = 800;
        canvas.height = 600;
        
        // Get current theme colors
        const isDark = this.isDarkMode;
        const bgColor = isDark ? '#1c1c1e' : '#f8f4ff';
        const cardBg = isDark ? '#2c2c2e' : '#ffffff';
        const textColor = isDark ? '#ffffff' : '#1d1d1f';
        const secondaryText = isDark ? '#86868b' : '#86868b';
        const primaryColor = '#9333ea';
        const accentColor = '#a855f7';
        
        // Background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, isDark ? '#1c1c1e' : '#f8f4ff');
        gradient.addColorStop(1, isDark ? '#2c2c2e' : '#e9d5ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Main card background
        ctx.fillStyle = cardBg + 'F0'; // Add transparency
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
        ctx.roundRect(50, 50, canvas.width - 100, canvas.height - 100, 20);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        
        // Title
        ctx.fillStyle = textColor;
        ctx.font = 'bold 36px SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Pomodoro Progress Report', canvas.width / 2, 120);
        
        // Date
        ctx.fillStyle = secondaryText;
        ctx.font = '18px SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(stats.date, canvas.width / 2, 150);
        
        // Stats grid
        const statsData = [
            { label: 'Study Sessions', value: stats.studySessions, icon: '📚' },
            { label: 'Study Time', value: `${stats.totalStudyTime} min`, icon: '⏱️' },
            { label: 'Break Time', value: `${stats.totalBreakTime} min`, icon: '☕' }
        ];
        
        statsData.forEach((stat, index) => {
            const x = 150 + (index * 200);
            const y = 250;
            
            // Stat box
            ctx.fillStyle = cardBg;
            ctx.strokeStyle = primaryColor + '20';
            ctx.lineWidth = 2;
            ctx.roundRect(x - 60, y - 40, 120, 80, 12);
            ctx.fill();
            ctx.stroke();
            
            // Icon
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(stat.icon, x, y - 10);
            
            // Value
            ctx.fillStyle = primaryColor;
            ctx.font = 'bold 24px SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText(stat.value.toString(), x, y + 15);
            
            // Label
            ctx.fillStyle = secondaryText;
            ctx.font = '14px SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText(stat.label, x, y + 35);
        });
        
        // Goal progress section
        if (stats.dailyGoal > 0) {
            const goalY = 400;
            
            // Goal title
            ctx.fillStyle = textColor;
            ctx.font = 'bold 24px SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Daily Goal Progress', 100, goalY);
            
            // Goal text
            ctx.fillStyle = secondaryText;
            ctx.font = '18px SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText(`${stats.totalStudyTime} / ${stats.dailyGoal} minutes`, 100, goalY + 30);
            
            // Progress bar background
            ctx.fillStyle = primaryColor + '20';
            ctx.roundRect(100, goalY + 50, 600, 20, 10);
            ctx.fill();
            
            // Progress bar fill
            const progress = Math.min((stats.totalStudyTime / stats.dailyGoal) * 100, 100);
            const progressWidth = (600 * progress) / 100;
            
            const progressGradient = ctx.createLinearGradient(100, 0, 100 + progressWidth, 0);
            progressGradient.addColorStop(0, primaryColor);
            progressGradient.addColorStop(1, accentColor);
            ctx.fillStyle = progressGradient;
            ctx.roundRect(100, goalY + 50, progressWidth, 20, 10);
            ctx.fill();
            
            // Progress percentage
            ctx.fillStyle = primaryColor;
            ctx.font = 'bold 18px SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round(progress)}%`, 100 + 300, goalY + 65);
            
            // Goal achievement message
            if (progress >= 100) {
                ctx.fillStyle = '#10b981';
                ctx.font = 'bold 20px SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('🎉 Goal Achieved! 🎉', canvas.width / 2, goalY + 100);
            }
        }
        
        // Footer
        ctx.fillStyle = secondaryText;
        ctx.font = '14px SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Generated by Pomodoro Timer', canvas.width / 2, canvas.height - 30);
        
        // Convert to image and download
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pomodoro-progress-${new Date().toISOString().split('T')[0]}.jpg`;
            link.click();
            URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.9);
        
        this.showNotification('Progress exported as image!', 'success');
    }

    startTimer() {
        if (this.isRunning) return;
        
        // If we're in break mode, switch back to study mode
        if (!this.isStudyMode) {
            this.isStudyMode = true;
            this.currentSessionSeconds = 0;
            this.currentSessionStart = Date.now();
        }
        
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.breakBtn.disabled = false;
        this.timerDisplay.classList.add('running');
        
        this.modeIndicatorElement.textContent = 'Studying';
        this.showNotification('Study session started', 'success');
        this.playStartSound();
        
        this.timer = setInterval(() => {
            this.totalSeconds++;
            this.currentSessionSeconds++;
            this.updateDisplay();
            this.updateProgressBar();
            
            // Check for session completion
            if (this.currentSessionSeconds >= this.sessionGoal * 60) {
                this.showNotification('Session goal reached! Consider taking a break.', 'info');
                this.playSessionCompleteSound();
            }
        }, 1000);
    }

    switchToBreak() {
        if (!this.isRunning) return;
        
        // Stop the timer
        this.isRunning = false;
        clearInterval(this.timer);
        
        // End current session
        this.endCurrentSession();
        
        // Switch to break mode
        this.isStudyMode = false;
        this.currentSessionStart = 0;
        this.currentSessionSeconds = 0;
        
        // Update UI
        this.startBtn.disabled = false;
        this.breakBtn.disabled = true;
        this.timerDisplay.classList.remove('running');
        this.modeIndicatorElement.textContent = 'On Break';
        
        this.updateProgressBar();
        this.showNotification('Switched to break mode', 'info');
        this.playBreakSound();
    }

    endCurrentSession() {
        if (this.isStudyMode) {
            this.studySessions++;
            this.totalStudyTime += Math.floor(this.currentSessionSeconds / 60);
        } else {
            this.totalBreakTime += Math.floor(this.currentSessionSeconds / 60);
        }
        
        this.updateStats();
        this.updateGoalProgress();
        this.saveStats();
    }

    resetTimer() {
        if (this.isRunning) {
            this.endCurrentSession();
            clearInterval(this.timer);
        }
        
        this.isRunning = false;
        this.isStudyMode = true;
        this.totalSeconds = 0;
        this.currentSessionSeconds = 0;
        this.currentSessionStart = 0;
        
        this.startBtn.disabled = false;
        this.breakBtn.disabled = true;
        this.timerDisplay.classList.remove('running');
        
        this.modeIndicatorElement.textContent = 'Ready to Start';
        this.updateDisplay();
        this.updateProgressBar();
        
        this.showNotification('Timer reset', 'info');
    }

    updateDisplay() {
        // Update main timer display
        const hours = Math.floor(this.totalSeconds / 3600);
        const minutes = Math.floor((this.totalSeconds % 3600) / 60);
        const seconds = this.totalSeconds % 60;
        
        this.timeDisplayElement.textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update current session time
        const sessionMinutes = Math.floor(this.currentSessionSeconds / 60);
        this.currentSessionElement.textContent = `${sessionMinutes} min`;
        
        // Update today's total
        const totalMinutes = Math.floor(this.totalSeconds / 60);
        this.todayTotalElement.textContent = `${totalMinutes} min`;
    }

    updateStats() {
        this.studySessionsElement.textContent = this.studySessions;
        this.totalStudyTimeElement.textContent = this.totalStudyTime;
        this.totalBreakTimeElement.textContent = this.totalBreakTime;
    }

    showNotification(message, type = 'info') {
        this.notificationText.textContent = message;
        this.notification.className = `notification show ${type}`;
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }

    showBrowserNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = this.isStudyMode ? 'Study Session' : 'Break Time';
            const body = this.isStudyMode ? 
                'Keep up the great work!' : 
                'Take a well-deserved break!';
            
            new Notification(title, {
                body: body,
                icon: '/favicon.ico',
                badge: '/favicon.ico'
            });
        }
    }

    // Sound notifications
    playStartSound() {
        this.playTone(800, 0.2);
    }

    playBreakSound() {
        this.playTone(600, 0.3);
    }

    playSessionCompleteSound() {
        this.playTone(1000, 0.4);
        setTimeout(() => this.playTone(800, 0.3), 200);
    }

    playGoalAchievedSound() {
        this.playTone(1200, 0.3);
        setTimeout(() => this.playTone(1000, 0.3), 150);
        setTimeout(() => this.playTone(800, 0.3), 300);
    }

    playTone(frequency, duration) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (error) {
            console.log('Audio not supported');
        }
    }

    saveStats() {
        const stats = {
            studySessions: this.studySessions,
            totalStudyTime: this.totalStudyTime,
            totalBreakTime: this.totalBreakTime,
            date: new Date().toDateString()
        };
        
        localStorage.setItem('pomodoroTimerStats', JSON.stringify(stats));
    }

    saveSettings() {
        const settings = {
            isDarkMode: this.isDarkMode,
            dailyGoal: this.dailyGoal,
            sessionGoal: this.sessionGoal
        };
        
        localStorage.setItem('pomodoroTimerSettings', JSON.stringify(settings));
    }

    loadStats() {
        const savedStats = localStorage.getItem('pomodoroTimerStats');
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            const today = new Date().toDateString();
            
            // Only load stats if they're from today
            if (stats.date === today) {
                this.studySessions = stats.studySessions;
                this.totalStudyTime = stats.totalStudyTime;
                this.totalBreakTime = stats.totalBreakTime;
            } else {
                // Reset stats for new day
                this.studySessions = 0;
                this.totalStudyTime = 0;
                this.totalBreakTime = 0;
            }
        }
        
        this.updateStats();
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('pomodoroTimerSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.isDarkMode = settings.isDarkMode || false;
            this.dailyGoal = settings.dailyGoal || 0;
            this.sessionGoal = settings.sessionGoal || 25;
            
            // Apply theme
            if (this.isDarkMode) {
                document.documentElement.setAttribute('data-theme', 'dark');
                this.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            }
        }
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            switch(e.code) {
                case 'Space':
                    e.preventDefault();
                    if (this.isRunning) {
                        this.switchToBreak();
                    } else {
                        this.startTimer();
                    }
                    break;
                case 'KeyR':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.resetTimer();
                    }
                    break;
                case 'KeyB':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        if (this.isRunning) {
                            this.switchToBreak();
                        }
                    }
                    break;
                case 'KeyT':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.toggleTheme();
                    }
                    break;
                case 'KeyE':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.exportStats();
                    }
                    break;
            }
        });
    }
}

// Canvas roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const pomodoroTimer = new PomodoroTimer();
    pomodoroTimer.setupKeyboardShortcuts();
    
    // Add helpful tips
    const tips = [
        '💡 Tip: Press Space to start/switch modes',
        '💡 Tip: Press Ctrl+R to reset the timer',
        '💡 Tip: Press Ctrl+B to switch to break mode',
        '💡 Tip: Press Ctrl+T to toggle theme',
        '💡 Tip: Press Ctrl+E to export stats',
        '💡 Tip: Set daily goals to stay motivated',
        '💡 Tip: Study as long as you feel focused',
        '💡 Tip: Take breaks when you need them',
        '💡 Tip: Export your progress as an image to share!',
        '🙏 "When the time is right, I, the Lord, will make it happen" - Isaiah 60:22'
    ];
    
    // Show a random tip every 45 seconds
    setInterval(() => {
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        pomodoroTimer.showNotification(randomTip, 'info');
    }, 45000);
}); 