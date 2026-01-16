// GLOBAL AYARLAR
const appSettings = {
    // SES AYARLARI
    voiceEnabled: true,
    voiceVolume: 1.0,
    voiceRate: 1.0,
    voicePitch: 1.0,
    voiceGender: 'male',
    
    // GÖRÜNÜM AYARLARI
    theme: 'dark',
    language: 'tr-TR',
    
    // AI AYARLARI
    aiModel: 'fast',
    sensitivity: 5,
    confidenceThreshold: 0.35,
    
    // ANTREMAN AYARLARI
    workoutGoal: 20,
    autoPause: true,
    showTutorial: true,
    
    // VERİ AYARLARI
    cloudSync: true,
    saveHistory: true,
    analytics: true
};

// AYARLARI YÜKLE (LocalStorage'dan)
function loadSettings() {
    try {
        const saved = localStorage.getItem('athleticoSettings');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(appSettings, parsed);
        }
        
        // UI'ı güncelle
        updateSettingsUI();
        applySettings();
        
        console.log('Ayarlar yüklendi:', appSettings);
    } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error);
        resetSettings();
    }
}

// AYARLARI KAYDET (LocalStorage'a)
function saveSettings() {
    try {
        // UI'dan ayarları oku
        appSettings.voiceEnabled = document.getElementById('voice-toggle').checked;
        appSettings.voiceVolume = parseInt(document.getElementById('voice-volume').value) / 100;
        appSettings.voiceRate = parseFloat(document.getElementById('speech-rate').value);
        appSettings.voiceGender = document.getElementById('gender-select').value;
        appSettings.theme = document.getElementById('theme-select').value;
        appSettings.language = document.getElementById('language-select').value;
        appSettings.aiModel = document.getElementById('model-select').value;
        appSettings.sensitivity = parseInt(document.getElementById('sensitivity-slider').value);
        
        // Hassasiyete göre güven eşiğini ayarla
        appSettings.confidenceThreshold = 0.45 - (appSettings.sensitivity * 0.03);
        
        // LocalStorage'a kaydet
        localStorage.setItem('athleticoSettings', JSON.stringify(appSettings));
        
        // Uygula
        applySettings();
        
        // Bildirim göster
        showNotification('Ayarlar kaydedildi!', 'success');
        
        console.log('Ayarlar kaydedildi:', appSettings);
    } catch (error) {
        console.error('Ayarlar kaydedilirken hata:', error);
        showNotification('Ayarlar kaydedilemedi!', 'error');
    }
}

// AYARLARI UI'A YÜKLE
function updateSettingsUI() {
    // Checkbox'lar
    document.getElementById('voice-toggle').checked = appSettings.voiceEnabled;
    
    // Slider'lar
    document.getElementById('voice-volume').value = appSettings.voiceVolume * 100;
    document.getElementById('volume-value').textContent = `${Math.round(appSettings.voiceVolume * 100)}%`;
    
    document.getElementById('speech-rate').value = appSettings.voiceRate;
    document.getElementById('rate-value').textContent = `${appSettings.voiceRate.toFixed(1)}x`;
    
    document.getElementById('sensitivity-slider').value = appSettings.sensitivity;
    
    // Select'ler
    document.getElementById('gender-select').value = appSettings.voiceGender;
    document.getElementById('theme-select').value = appSettings.theme;
    document.getElementById('language-select').value = appSettings.language;
    document.getElementById('model-select').value = appSettings.aiModel;
    
    // Hızlı dil değiştirici
    const quickLang = document.getElementById('quick-language');
    if (quickLang) {
        quickLang.value = appSettings.language;
    }
}

// AYARLARI UYGULA
function applySettings() {
    // Temayı uygula
    document.body.setAttribute('data-theme', appSettings.theme);
    localStorage.setItem('theme', appSettings.theme);
    
    // Dili uygula
    changeLanguage(appSettings.language);
    
    // Koç ayarlarını güncelle
    if (window.coachSettings) {
        Object.assign(coachSettings, {
            enabled: appSettings.voiceEnabled,
            language: appSettings.language,
            gender: appSettings.voiceGender,
            volume: appSettings.voiceVolume,
            rate: appSettings.voiceRate,
            pitch: appSettings.voicePitch
        });
    }
    
    // AI model seçimini uygula
    if (window.updateModelConfig) {
        updateModelConfig();
    }
}

// AYARLARI VARSAYILANA DÖNDÜR
function resetSettings() {
    if (confirm('Tüm ayarlar varsayılana döndürülsün mü?')) {
        // Varsayılan değerler
        const defaults = {
            voiceEnabled: true,
            voiceVolume: 1.0,
            voiceRate: 1.0,
            voicePitch: 1.0,
            voiceGender: 'male',
            theme: 'dark',
            language: 'tr-TR',
            aiModel: 'fast',
            sensitivity: 5,
            confidenceThreshold: 0.35,
            workoutGoal: 20,
            autoPause: true,
            showTutorial: true,
            cloudSync: true,
            saveHistory: true,
            analytics: true
        };
        
        Object.assign(appSettings, defaults);
        localStorage.removeItem('athleticoSettings');
        
        updateSettingsUI();
        applySettings();
        
        showNotification('Ayarlar varsayılana döndürüldü!', 'success');
    }
}

// AYARLAR PANELİ İŞLEVLERİ
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('open');
    
    if (panel.classList.contains('open')) {
        updateSettingsUI();
    }
}

function closeSettings() {
    document.getElementById('settings-panel').classList.remove('open');
}

// TEMA DEĞİŞTİR
function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    appSettings.theme = newTheme;
    
    // İkonu güncelle
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.setAttribute('data-lucide', newTheme === 'dark' ? 'sun' : 'moon');
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }
    
    // Grafikleri yeniden oluştur
    if (window.renderChart) {
        renderChart();
    }
}

// TEST SESİ
function testVoice() {
    if (!appSettings.voiceEnabled) {
        showNotification('Sesli geri bildirim kapalı!', 'warning');
        return;
    }
    
    const testText = appSettings.language === 'tr-TR' 
        ? 'Bu bir test sesidir. Ayarlar çalışıyor.' 
        : 'This is a test voice. Settings are working.';
    
    speak('test', testText, true);
}

// BİLDİRİM GÖSTER
function showNotification(message, type = 'info') {
    // Basit bir bildirim sistemi
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // 3 saniye sonra kaldır
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// SAYFA YÜKLENDİĞİNDE AYARLARI YÜKLE
document.addEventListener('DOMContentLoaded', loadSettings);