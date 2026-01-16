// SADE SONUÇ ANALİZİ - Sadece temel fonksiyonlar

// Yardımcı fonksiyonlar
function loadFromLocalStorage(key, defaultValue) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('loadFromLocalStorage hatası:', error);
        return defaultValue;
    }
}

function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('saveToLocalStorage hatası:', error);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// BASİT ANALİZ FONKSİYONU
function analyzeSimpleWorkout(workoutData) {
    const reps = workoutData.reps || 0;
    const duration = workoutData.duration_seconds || 0;
    const formScore = workoutData.form_score || 0;
    
    // Hız hesapla (tekrar/dakika)
    const speed = duration > 0 ? Math.round((reps / duration) * 60) : 0;
    
    // Form değerlendirmesi
    let formText = "Mükemmel";
    let tipText = "Harika iş! Formunu koruyarak devam et.";
    
    if (formScore >= 90) {
        formText = "Mükemmel";
        tipText = "Harika iş! Formunu koruyarak devam et.";
    } else if (formScore >= 80) {
        formText = "İyi";
        tipText = "Formun iyi, biraz daha dikkat ederek mükemmelleştirebilirsin.";
    } else if (formScore >= 70) {
        formText = "Orta";
        tipText = "Formunu geliştirmeye odaklan. Yavaş ve kontrollü hareket et.";
    } else {
        formText = "Geliştirilmeli";
        tipText = "Temel form üzerinde çalış. Ayna karşısında pratik yap.";
    }
    
    // Puan hesapla
    const baseScore = reps * 2;
    const formBonus = formScore * 0.5;
    const totalScore = Math.round(baseScore + formBonus);
    
    return {
        reps: reps,
        duration: formatTime(duration),
        speed: speed,
        formScore: formScore,
        formText: formText,
        tip: tipText,
        totalScore: totalScore
    };
}

// ANTRENMAN KAYDI EKLE
function saveWorkoutResult(workoutData) {
    try {
        const history = loadFromLocalStorage('workout_history', []);
        
        const result = {
            id: Date.now(),
            date: new Date().toISOString(),
            reps: workoutData.reps || 0,
            duration_seconds: workoutData.duration_seconds || 0,
            form_score: workoutData.form_score || 0,
            speed: workoutData.speed || 0,
            calories: workoutData.calories || 0,
            score: workoutData.score || 0
        };
        
        // En fazla 50 kayıt tut
        history.unshift(result);
        if (history.length > 50) {
            history.pop();
        }
        
        saveToLocalStorage('workout_history', history);
        saveToLocalStorage('last_workout', result);
        
        return result;
    } catch (error) {
        console.error('Antrenman kaydı hatası:', error);
        return null;
    }
}

// HAFTALIK İSTATİSTİKLER
function getWeeklyStats() {
    const history = loadFromLocalStorage('workout_history', []);
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weeklyWorkouts = history.filter(w => {
        const workoutDate = new Date(w.date);
        return workoutDate >= oneWeekAgo;
    });
    
    const totalReps = weeklyWorkouts.reduce((sum, w) => sum + (w.reps || 0), 0);
    const totalWorkouts = weeklyWorkouts.length;
    const avgForm = weeklyWorkouts.length > 0 
        ? Math.round(weeklyWorkouts.reduce((sum, w) => sum + (w.form_score || 0), 0) / weeklyWorkouts.length)
        : 0;
    
    return {
        totalReps,
        totalWorkouts,
        avgForm,
        workouts: weeklyWorkouts
    };
}

// SONUÇ EKRANINI GÜNCELLE
function updateSummaryScreen(workoutData) {
    const analysis = analyzeSimpleWorkout(workoutData);
    
    // İstatistikleri güncelle
    document.getElementById('final-reps').textContent = analysis.reps;
    document.getElementById('final-time').textContent = analysis.duration;
    document.getElementById('final-score').textContent = analysis.totalScore;
    
    // Analizleri güncelle
    document.getElementById('speed-text').textContent = `${analysis.speed} tekrar/dk`;
    document.getElementById('form-text').textContent = `${analysis.formScore}% (${analysis.formText})`;
    document.getElementById('tip-text').textContent = analysis.tip;
    
    // Antrenmanı kaydet
    saveWorkoutResult(workoutData);
}

// TOPLAM İSTATİSTİKLER
function getTotalStats() {
    const history = loadFromLocalStorage('workout_history', []);
    
    if (history.length === 0) {
        return {
            totalWorkouts: 0,
            totalReps: 0,
            totalDuration: 0,
            avgForm: 0,
            bestReps: 0,
            bestForm: 0
        };
    }
    
    const totalReps = history.reduce((sum, w) => sum + (w.reps || 0), 0);
    const totalDuration = history.reduce((sum, w) => sum + (w.duration_seconds || 0), 0);
    const avgForm = Math.round(history.reduce((sum, w) => sum + (w.form_score || 0), 0) / history.length);
    const bestReps = Math.max(...history.map(w => w.reps || 0));
    const bestForm = Math.max(...history.map(w => w.form_score || 0));
    
    return {
        totalWorkouts: history.length,
        totalReps,
        totalDuration: Math.round(totalDuration / 60), // dakika
        avgForm,
        bestReps,
        bestForm
    };
}

// İSTATİSTİKLER SAYFASI İÇİN
function initStatsPage() {
    if (!window.location.pathname.includes('stats.html')) {
        return;
    }
    
    const stats = getTotalStats();
    const weekly = getWeeklyStats();
    
    // Toplam istatistikleri göster
    const totalStatsEl = document.getElementById('total-stats');
    if (totalStatsEl) {
        totalStatsEl.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <i data-lucide="calendar"></i>
                    <div class="stat-number">${stats.totalWorkouts}</div>
                    <div class="stat-label">Toplam Antrenman</div>
                </div>
                <div class="stat-card">
                    <i data-lucide="repeat"></i>
                    <div class="stat-number">${stats.totalReps}</div>
                    <div class="stat-label">Toplam Tekrar</div>
                </div>
                <div class="stat-card">
                    <i data-lucide="clock"></i>
                    <div class="stat-number">${stats.totalDuration}</div>
                    <div class="stat-label">Dakika</div>
                </div>
                <div class="stat-card">
                    <i data-lucide="trending-up"></i>
                    <div class="stat-number">${stats.avgForm}%</div>
                    <div class="stat-label">Ortalama Form</div>
                </div>
            </div>
        `;
    }
    
    // Haftalık istatistikleri göster
    const weeklyStatsEl = document.getElementById('weekly-stats');
    if (weeklyStatsEl) {
        weeklyStatsEl.innerHTML = `
            <div class="weekly-card">
                <h3>Bu Hafta</h3>
                <div class="weekly-content">
                    <div class="weekly-item">
                        <span class="label">Antrenman:</span>
                        <span class="value">${weekly.totalWorkouts}</span>
                    </div>
                    <div class="weekly-item">
                        <span class="label">Tekrar:</span>
                        <span class="value">${weekly.totalReps}</span>
                    </div>
                    <div class="weekly-item">
                        <span class="label">Form:</span>
                        <span class="value">${weekly.avgForm}%</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // En iyi performanslar
    const bestStatsEl = document.getElementById('best-stats');
    if (bestStatsEl) {
        bestStatsEl.innerHTML = `
            <div class="best-card">
                <h3>En İyiler</h3>
                <div class="best-content">
                    <div class="best-item">
                        <i data-lucide="trophy"></i>
                        <div>
                            <div class="best-value">${stats.bestReps} tekrar</div>
                            <div class="best-label">En Çok Tekrar</div>
                        </div>
                    </div>
                    <div class="best-item">
                        <i data-lucide="star"></i>
                        <div>
                            <div class="best-value">${stats.bestForm}%</div>
                            <div class="best-label">En İyi Form</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // İkonları oluştur
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// SAYFA YÜKLENDİĞİNDE
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('stats.html')) {
        initStatsPage();
    }
});

// GENEL FONKSİYONLARI DIŞA AÇ
window.updateSummaryScreen = updateSummaryScreen;
window.getTotalStats = getTotalStats;
window.getWeeklyStats = getWeeklyStats;