// ANA UYGULAMA KONFİGÜRASYONU
const AppConfig = {
    version: '2.0.0',
    build: '2024.01',
    environment: 'production',
    features: {
        aiCoach: true,
        voiceFeedback: true,
        multiLanguage: true,
        cloudSync: true,
        offlineMode: true,
        progressTracking: true,
        socialSharing: true
    },
    limits: {
        maxWorkouts: 1000,
        maxHistoryDays: 365,
        maxRepsPerWorkout: 1000
    }
};

// UYGULAMA STATE YÖNETİMİ
const AppState = {
    initialized: false,
    online: navigator.onLine,
    cameraAvailable: false,
    modelLoaded: false,
    permissionsGranted: false,
    currentPage: 'coach',
    workoutInProgress: false,
    lastError: null,
    performance: {
        fps: 0,
        memory: null,
        loadTime: 0
    }
};

// PERFORMANS İZLEME
let fpsCounter = 0;
let lastFpsTime = 0;

function updatePerformance() {
    const now = performance.now();
    fpsCounter++;
    
    if (now - lastFpsTime >= 1000) {
        AppState.performance.fps = fpsCounter;
        fpsCounter = 0;
        lastFpsTime = now;
        
        // Memory kullanımı (sadece Chrome)
        if (performance.memory) {
            AppState.performance.memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                total: Math.round(performance.memory.totalJSHeapSize / 1048576),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
            };
        }
    }
    
    requestAnimationFrame(updatePerformance);
}

// UYGULAMA BAŞLATMA
async function initApp() {
    if (AppState.initialized) return;
    
    const startTime = performance.now();
    
    try {
        console.log('🧠 AthleticoCore başlatılıyor...');
        
        // PERFORMANS İZLEME BAŞLAT
        requestAnimationFrame(updatePerformance);
        
        // PERMISSION KONTROLÜ
        await checkPermissions();
        
        // KAMERA KONTROLÜ
        AppState.cameraAvailable = await checkCameraAvailability();
        
        // OFFLINE DESTEK
        setupOfflineSupport();
        
        // SERVICE WORKER (PWA için)
        if ('serviceWorker' in navigator) {
            registerServiceWorker();
        }
        
        // PWA INSTALL PROMPT
        setupPWAInstall();
        
        // AYARLARI YÜKLE
        if (window.loadSettings) {
            await loadSettings();
        }
        
        // ÇEVİRİLERİ YÜKLE
        if (window.updateUILanguage) {
            updateUILanguage();
        }
        
        // EVENT LISTENERS
        setupEventListeners();
        
        // BAŞLANGIÇ ANİMASYONU
        showWelcomeAnimation();
        
        AppState.initialized = true;
        AppState.performance.loadTime = Math.round(performance.now() - startTime);
        
        console.log(`✅ AthleticoCore başlatıldı (${AppState.performance.loadTime}ms)`);
        console.log('📊 Performans:', AppState.performance);
        
        // BAŞLANGIÇ BİLDİRİMİ
        setTimeout(() => {
            showNotification('AthleticoCore hazır! Antrenmana başlayın.', 'success');
        }, 1000);
        
    } catch (error) {
        console.error('❌ Uygulama başlatma hatası:', error);
        AppState.lastError = error;
        showError(`Uygulama başlatılamadı: ${error.message}`);
    }
}

// PERMISSION KONTROLÜ
async function checkPermissions() {
    const permissions = [
        { name: 'camera', required: true },
        { name: 'microphone', required: false },
        { name: 'notifications', required: false }
    ];
    
    for (const perm of permissions) {
        try {
            const result = await navigator.permissions.query({ name: perm.name });
            console.log(`${perm.name} izni:`, result.state);
            
            if (perm.required && result.state === 'denied') {
                throw new Error(`${perm.name} izni reddedildi`);
            }
            
        } catch (error) {
            if (perm.required) {
                throw error;
            }
        }
    }
    
    AppState.permissionsGranted = true;
}

// KAMERA KONTROLÜ
async function checkCameraAvailability() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return false;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        return videoDevices.length > 0;
    } catch (error) {
        console.warn('Kamera kontrol hatası:', error);
        return false;
    }
}

// OFFLINE DESTEK
function setupOfflineSupport() {
    // CACHE STRATEGY
    if ('caches' in window) {
        caches.open('athletico-v1').then(cache => {
            // Önemli asset'leri cache'le
            const assets = [
                '/',
                '/index.html',
                '/coach.html',
                '/css/styles.css',
                '/js/app.js',
                '/js/coach.js',
                '/js/utils.js'
            ];
            
            cache.addAll(assets).catch(console.error);
        });
    }
    
    // ONLINE/OFFLINE DİNLEYİCİLERİ
    window.addEventListener('online', () => {
        AppState.online = true;
        showNotification('İnternet bağlantısı geri geldi!', 'success');
        
        // Bekleyen sync'leri çalıştır
        processPendingSyncs();
    });
    
    window.addEventListener('offline', () => {
        AppState.online = false;
        showNotification('İnternet bağlantısı kesildi. Offline moda geçiliyor.', 'warning');
    });
}

// SERVICE WORKER
function registerServiceWorker() {
    navigator.serviceWorker.register('/sw.js').then(registration => {
        console.log('Service Worker kayıtlı:', registration);
        
        // UPDATE KONTROLÜ
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    showNotification('Yeni güncelleme mevcut! Sayfayı yenileyin.', 'info');
                }
            });
        });
        
    }).catch(error => {
        console.warn('Service Worker kaydı başarısız:', error);
    });
}

// PWA INSTALL PROMPT
let deferredPrompt;

function setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Install butonunu göster
        showInstallPrompt();
    });
    
    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        console.log('PWA başarıyla yüklendi!');
        showNotification('AthleticoCore uygulaması yüklendi!', 'success');
    });
}

function showInstallPrompt() {
    const installBtn = document.createElement('button');
    installBtn.className = 'install-prompt';
    installBtn.innerHTML = `
        <i data-lucide="download"></i>
        <span>Uygulamayı Yükle</span>
    `;
    
    installBtn.onclick = async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('Kullanıcı PWA yüklemeyi kabul etti');
        }
        
        deferredPrompt = null;
        installBtn.remove();
    };
    
    document.body.appendChild(installBtn);
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// EVENT LISTENERS
function setupEventListeners() {
    // BACK BUTTON (Android)
    if (window.history && window.history.pushState) {
        window.addEventListener('popstate', (e) => {
            if (AppState.workoutInProgress) {
                if (confirm('Antrenman devam ediyor. Çıkmak istediğinizden emin misiniz?')) {
                    if (window.stopWorkout) {
                        stopWorkout();
                    }
                    window.history.back();
                } else {
                    window.history.pushState(null, null, window.location.pathname);
                }
            }
        });
    }
    
    // VISIBILITY CHANGE
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && AppState.workoutInProgress) {
            // Sayfa arka plana alındı, antrenmanı duraklat
            pauseWorkout();
        }
    });
    
    // PAGE VISIBILITY
    let pageVisible = true;
    
    document.addEventListener('visibilitychange', () => {
        pageVisible = !document.hidden;
        
        if (!pageVisible && AppState.workoutInProgress) {
            showNotification('Antrenman duraklatıldı (sayfa görünmüyor)', 'warning');
        }
    });
    
    // RESIZE OPTIMIZATION
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 250);
    });
    
    // TOUCH GESTURES
    if ('ontouchstart' in window) {
        setupTouchGestures();
    }
    
    // KEYBOARD SHORTCUTS
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// RESIZE HANDLER
function handleResize() {
    // Canvas boyutlarını güncelle
    const canvas = document.getElementById('output');
    const video = document.getElementById('video');
    
    if (canvas && video && video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }
    
    // Grafikleri yeniden boyutlandır
    if (window.qualityChart) {
        window.qualityChart.resize();
    }
}

// TOUCH GESTURES
function setupTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // YATAY KAYDIRMA (Ayarlar paneli)
        if (Math.abs(diffX) > 50 && Math.abs(diffY) < 30) {
            if (diffX > 0) {
                // Sola kaydırma - ayarları aç
                toggleSettings();
            } else {
                // Sağa kaydırma - ayarları kapat
                closeSettings();
            }
        }
        
        // DİKEY KAYDIRMA (Antrenman kontrolü)
        if (Math.abs(diffY) > 100 && Math.abs(diffX) < 30) {
            if (diffY > 0 && AppState.workoutInProgress) {
                // Yukarı kaydırma - antrenmanı duraklat
                pauseWorkout();
            } else if (diffY < 0 && !AppState.workoutInProgress) {
                // Aşağı kaydırma - antrenmanı başlat
                startWorkout();
            }
        }
    });
}

// KEYBOARD SHORTCUTS
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + S - Ayarlar
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        toggleSettings();
    }
    
    // Ctrl/Cmd + R - Yeniden başlat
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        if (AppState.workoutInProgress) {
            e.preventDefault();
            if (confirm('Antrenmanı yeniden başlatmak istiyor musunuz?')) {
                location.reload();
            }
        }
    }
    
    // Space - Başlat/Durdur
    if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (AppState.workoutInProgress) {
            if (window.stopWorkout) stopWorkout();
        } else {
            if (window.startWorkout) startWorkout();
        }
    }
    
    // ESC - Çıkış
    if (e.key === 'Escape') {
        if (AppState.workoutInProgress) {
            if (window.stopWorkout) stopWorkout();
        } else {
            const settingsPanel = document.getElementById('settings-panel');
            if (settingsPanel && settingsPanel.classList.contains('open')) {
                closeSettings();
            }
        }
    }
    
    // F11 - Tam ekran
    if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    }
}

// ANTRENMAN KONTROLLERİ
function pauseWorkout() {
    if (!AppState.workoutInProgress) return;
    
    AppState.workoutInProgress = false;
    
    // Animasyonu durdur
    if (window.animationId) {
        cancelAnimationFrame(window.animationId);
        window.animationId = null;
    }
    
    // Zamanlayıcıyı durdur
    if (window.timerInterval) {
        clearInterval(window.timerInterval);
        window.timerInterval = null;
    }
    
    showNotification('Antrenman duraklatıldı', 'warning');
    speak('workout_paused', 'Antrenman duraklatıldı', true);
}

function resumeWorkout() {
    if (AppState.workoutInProgress) return;
    
    AppState.workoutInProgress = true;
    
    // Zamanlayıcıyı başlat
    if (window.startTimer) {
        startTimer();
    }
    
    // Render döngüsünü başlat
    if (window.renderLoop) {
        renderLoop();
    }
    
    showNotification('Antrenman devam ediyor', 'success');
    speak('workout_resumed', 'Devam ediyoruz', true);
}

// FULLSCREEN TOGGLE
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(console.error);
    } else {
        document.exitFullscreen();
    }
}

// WELCOME ANIMATION
function showWelcomeAnimation() {
    const welcome = document.createElement('div');
    welcome.className = 'welcome-animation';
    welcome.innerHTML = `
        <div class="welcome-content">
            <div class="welcome-logo">AC</div>
            <h2>AthleticoCore</h2>
            <p>AI Antrenman Koçu</p>
        </div>
    `;
    
    document.body.appendChild(welcome);
    
    setTimeout(() => {
        welcome.style.opacity = '0';
        setTimeout(() => welcome.remove(), 500);
    }, 1500);
}

// PENDING SYNCS
function processPendingSyncs() {
    const pending = loadFromLocalStorage('pending_syncs', []);
    
    if (pending.length === 0 || !AppState.online) return;
    
    showNotification(`${pending.length} bekleyen kayıt senkronize ediliyor...`, 'info');
    
    pending.forEach(async (data, index) => {
        try {
            // Supabase'e kaydet
            if (window.saveWorkoutToSupabase) {
                await saveWorkoutToSupabase(data);
                
                // Başarılı olanı listeden çıkar
                pending.splice(index, 1);
                saveToLocalStorage('pending_syncs', pending);
            }
        } catch (error) {
            console.error('Sync hatası:', error);
        }
    });
    
    if (pending.length === 0) {
        showNotification('Tüm kayıtlar senkronize edildi!', 'success');
    }
}

// ERROR BOUNDARY
window.onerror = function(msg, url, line, col, error) {
    console.error('Global hata:', { msg, url, line, col, error });
    
    // Hata bilgisini kaydet
    const errorLog = loadFromLocalStorage('error_log', []);
    errorLog.push({
        timestamp: new Date().toISOString(),
        message: msg,
        url,
        line,
        column: col,
        stack: error?.stack,
        userAgent: navigator.userAgent
    });
    
    saveToLocalStorage('error_log', errorLog.slice(-50)); // Son 50 hatayı sakla
    
    // Kullanıcıya göster
    const errorBox = document.getElementById('error-box');
    const errorText = document.getElementById('error-text');
    
    if (errorBox && errorText) {
        errorText.textContent = `Hata: ${msg} (Satır: ${line})`;
        errorBox.classList.remove('hidden');
    }
    
    // Hata raporlama (opsiyonel)
    if (AppConfig.environment === 'production') {
        reportErrorToServer({ msg, url, line, col, error });
    }
    
    return false;
};

// HATA RAPORLAMA
async function reportErrorToServer(errorData) {
    try {
        // Burada hata raporlama servisine gönderebilirsiniz
        // Örnek: Sentry, LogRocket, vs.
        console.log('Hata raporu:', errorData);
    } catch (error) {
        console.error('Hata raporlama başarısız:', error);
    }
}

// UYGULAMA SAĞLIĞI KONTROLÜ
function checkAppHealth() {
    const health = {
        timestamp: new Date().toISOString(),
        online: AppState.online,
        camera: AppState.cameraAvailable,
        model: AppState.modelLoaded,
        permissions: AppState.permissionsGranted,
        memory: AppState.performance.memory,
        fps: AppState.performance.fps,
        errors: loadFromLocalStorage('error_log', []).length
    };
    
    console.log('🔍 Uygulama Sağlık Durumu:', health);
    
    // Kritik sorunları kontrol et
    if (!health.camera && window.location.pathname.includes('coach.html')) {
        showNotification('Kamera bulunamadı. Lütfen izinleri kontrol edin.', 'error');
    }
    
    if (health.memory && health.memory.used > health.memory.limit * 0.8) {
        console.warn('⚠️ Yüksek bellek kullanımı!');
        // Bellek temizleme önerisi
        if (confirm('Yüksek bellek kullanımı tespit edildi. Sayfa yenilensin mi?')) {
            location.reload();
        }
    }
    
    return health;
}

// PERIODIC CHECKS
setInterval(() => {
    if (AppState.initialized) {
        checkAppHealth();
    }
}, 60000); // Her 1 dakikada bir

// UYGULAMA KAPANMA
window.addEventListener('beforeunload', (e) => {
    if (AppState.workoutInProgress) {
        e.preventDefault();
        e.returnValue = 'Antrenman devam ediyor. Çıkmak istediğinizden emin misiniz?';
        return e.returnValue;
    }
    
    // Temizlik
    if (window.currentStream) {
        window.currentStream.getTracks().forEach(track => track.stop());
    }
    
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    
    console.log('👋 AthleticoCore kapatılıyor...');
});

// GLOBAL EXPORT
window.AppConfig = AppConfig;
window.AppState = AppState;
window.initApp = initApp;
window.pauseWorkout = pauseWorkout;
window.resumeWorkout = resumeWorkout;
window.toggleFullscreen = toggleFullscreen;
window.checkAppHealth = checkAppHealth;

// SAYFA YÜKLENDİĞİNDE
document.addEventListener('DOMContentLoaded', () => {
    // İkonları oluştur
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
    
    // Temayı yükle
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Uygulamayı başlat
    setTimeout(initApp, 100);
});