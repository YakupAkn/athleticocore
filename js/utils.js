// HATA YÖNETİMİ
function showError(message) {
    const errorBox = document.getElementById('error-box');
    const errorText = document.getElementById('error-text');
    
    if (errorBox && errorText) {
        errorText.textContent = message;
        errorBox.classList.remove('hidden');
        
        // 10 saniye sonra otomatik kapat
        setTimeout(closeError, 10000);
    } else {
        console.error('Hata:', message);
        alert(message);
    }
}

function closeError() {
    const errorBox = document.getElementById('error-box');
    if (errorBox) {
        errorBox.classList.add('hidden');
    }
}

// FORMATLAMA FONKSİYONLARI
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
    return num.toLocaleString('tr-TR');
}

function calculateCalories(pushups, duration, weight = 70) {
    // Basit kalori hesabı (yaklaşık)
    const caloriesPerMinute = 8; // Push-up için ortalama
    const caloriesPerPushup = 0.32; // Her push-up için yaklaşık
    return Math.round((duration / 60) * caloriesPerMinute + pushups * caloriesPerPushup);
}

function calculateScore(pushups, formScore, consistency) {
    // Formül: (tekrar * 10) + (form * 5) + (tutarlılık * 3)
    return Math.round((pushups * 10) + (formScore * 5) + (consistency * 3));
}

// LOCALSTORAGE YÖNETİMİ
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(`athletico_${key}`, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('LocalStorage kayıt hatası:', error);
        return false;
    }
}

function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(`athletico_${key}`);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('LocalStorage okuma hatası:', error);
        return defaultValue;
    }
}

function clearLocalStorage() {
    try {
        // Sadece uygulama verilerini temizle
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('athletico_')) {
                localStorage.removeItem(key);
            }
        });
        return true;
    } catch (error) {
        console.error('LocalStorage temizleme hatası:', error);
        return false;
    }
}

// KAMERA YARDIMCILARI
async function checkCameraPermissions() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        return videoDevices.length > 0;
    } catch (error) {
        console.error('Kamera izinleri kontrol hatası:', error);
        return false;
    }
}

async function getCameraStream(constraints = null) {
    const defaultConstraints = {
        video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
        },
        audio: false
    };
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia(
            constraints || defaultConstraints
        );
        return stream;
    } catch (error) {
        console.error('Kamera akışı alınamadı:', error);
        throw new Error('Kamera erişimi reddedildi veya kullanılamıyor.');
    }
}

// DOM YARDIMCILARI
function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return document.querySelectorAll(selector);
}

function createElement(tag, classes = '', content = '') {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    if (content) el.innerHTML = content;
    return el;
}

function toggleElement(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.toggle('hidden');
    }
}

function showElement(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('hidden');
    }
}

function hideElement(id) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.add('hidden');
    }
}

// DEBOUNCE FONKSİYONU
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// THROTTLE FONKSİYONU
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// RANDOM ID OLUŞTUR
function generateId(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length);
}

// TARİH FORMATLAMA
function formatDate(date, format = 'tr-TR') {
    const d = new Date(date);
    return d.toLocaleDateString(format, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// DİZİ İŞLEMLERİ
function calculateAverage(arr) {
    if (!arr || arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
}

function calculateMedian(arr) {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? 
        sorted[mid] : 
        (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStandardDeviation(arr) {
    if (!arr || arr.length === 0) return 0;
    const avg = calculateAverage(arr);
    const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
}

// PERFORMANS ÖLÇÜMÜ
function measurePerformance(name, func) {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    console.log(`${name} süresi: ${(end - start).toFixed(2)}ms`);
    return result;
}

// URL PARAMETRELERİ
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
        result[key] = value;
    }
    return result;
}

function updateUrlParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
}

// CİHAZ TESPİTİ
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isAndroid() {
    return /Android/.test(navigator.userAgent);
}

function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// PWA DESTEĞİ
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
}

// ONLINE/OFFLINE KONTROLÜ
function checkOnlineStatus() {
    return navigator.onLine;
}

function setupOnlineListener() {
    window.addEventListener('online', () => {
        showNotification('İnternet bağlantısı geri geldi!', 'success');
    });
    
    window.addEventListener('offline', () => {
        showNotification('İnternet bağlantısı kesildi!', 'warning');
    });
}

// VİBRASYON DESTEĞİ
function vibrate(pattern = 200) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

// SAYFA YÜKLEME DURUMU
function showLoading() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'block';
    }
}

function hideLoading() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// EXPORT (Eğer modül sistemi kullanılıyorsa)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showError,
        closeError,
        formatTime,
        formatNumber,
        calculateCalories,
        calculateScore,
        saveToLocalStorage,
        loadFromLocalStorage,
        clearLocalStorage,
        checkCameraPermissions,
        getCameraStream,
        $,
        $$,
        createElement,
        toggleElement,
        showElement,
        hideElement,
        debounce,
        throttle,
        generateId,
        formatDate,
        calculateAverage,
        calculateMedian,
        calculateStandardDeviation,
        measurePerformance,
        getUrlParams,
        updateUrlParam,
        isMobile,
        isIOS,
        isAndroid,
        isTouchDevice,
        isPWA,
        checkOnlineStatus,
        setupOnlineListener,
        vibrate,
        showLoading,
        hideLoading
    };
}