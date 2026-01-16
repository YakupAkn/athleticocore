// ÇEVİRİ VERİTABANI
const translations = {
    'tr-TR': {
        // GENEL
        'app.name': 'AthleticoCore',
        'loading.model': 'AI Model Yükleniyor...',
        
        // AYARLAR
        'settings.title': 'Ayarlar',
        'settings.language': 'Dil',
        'settings.voiceFeedback': 'Sesli geri bildirim',
        'settings.volume': 'Ses Düzeyi',
        'settings.aiModel': 'AI Model',
        'settings.fast': 'Hızlı',
        'settings.accurate': 'Doğru',
        'settings.sensitivity': 'Hassasiyet',
        'settings.low': 'Düşük',
        'settings.high': 'Yüksek',
        'settings.theme': 'Tema',
        'settings.dark': 'Koyu',
        'settings.light': 'Açık',
        'settings.voiceGender': 'Ses Cinsiyeti',
        'settings.male': 'Erkek',
        'settings.female': 'Kadın',
        'settings.speechRate': 'Konuşma Hızı',
        'settings.testVoice': 'Test Sesi',
        'settings.reset': 'Varsayılana Dön',
        'settings.save': 'Kaydet',
        
        // BAŞLANGIÇ EKRANI
        'start.title': 'AI PushUp Coach',
        'start.description': 'Telefonu yere sabitle. Kameranın seni tam olarak gördüğünden emin ol. AI hareketlerini sayacak.',
        'start.goal': 'Hedef: 20 tekrar',
        'start.duration': 'Tahmini süre: 3 dk',
        'start.calories': 'Yaklaşık kalori: 50 kcal',
        'start.button': 'Antrenmana Başla',
        
        // HUD
        'hud.reps': 'Tekrar',
        'hud.time': 'Süre',
        'hud.score': 'Puan',
        'hud.form': 'Form',
        'hud.ready': 'Hazır ol...',
        'hud.finish': 'Bitir',
        
        // SONUÇ EKRANI
        'summary.title': 'Harika İş!',
        'summary.reps': 'TEKRAR',
        'summary.time': 'SÜRE',
        'summary.score': 'PUAN',
        'summary.form': 'FORM',
        'summary.performance': 'Performans Metrikleri',
        'summary.speed': 'Hız',
        'summary.calories': 'Kalori',
        'summary.bestRep': 'En İyi Tekrar',
        'summary.consistency': 'Tutarlılık',
        'summary.qualityChart': 'Tekrar Kalite Grafiği',
        'summary.recommendations': 'Öneriler',
        'summary.newWorkout': 'Yeni Antrenman',
        'summary.viewStats': 'İstatistikleri Gör',
        'summary.home': 'Ana Sayfaya Dön',
        
        // GRAFİK
        'chart.excellent': 'Mükemmel',
        'chart.good': 'İyi',
        'chart.needsWork': 'Gelişmeli',
        
        // ÖNERİLER
        'recommendations.goodForm': 'Formunuz iyi, devam edin!',
        'recommendations.keepElbows': 'Dirseklerinizi vücuda yakın tutun',
        'recommendations.fullRange': 'Tam hareket aralığı kullanın',
        'recommendations.consistentPace': 'Daha tutarlı bir tempo deneyin',
        'recommendations.restNeeded': 'Yeterince dinlenin',
        
        // NAVİGASYON
        'nav.home': 'Ana Sayfa',
        'nav.aiCoach': 'AI PushUp',
        'nav.stats': 'Analiz',
        'nav.profile': 'Profil',
        'nav.settings': 'Ayarlar',
        
        // HATA MESAJLARI
        'error.title': 'Sistem Hatası',
        'error.camera': 'Kamera açılamadı',
        'error.model': 'AI modeli yüklenemedi',
        'error.workout': 'Antrenman başlatılamadı',
        
        // SESLİ GERİ BİLDİRİMLER
        'voice.start': 'Başlıyoruz!',
        'voice.down': 'Aşağı in',
        'voice.up': 'Yukarı çık',
        'voice.great': 'Harika!',
        'voice.keepGoing': 'Devam et!',
        'voice.almost': 'Neredeyse bitti!',
        'voice.completed': 'Antrenman tamamlandı!',
        'voice.cameraAdjust': 'Kamerayı düzelt',
        'voice.formGood': 'Formun çok iyi!',
        'voice.slowDown': 'Biraz yavaşla',
        'voice.fullRange': 'Tam hareket yap'
    },
    
    'en-US': {
        // GENERAL
        'app.name': 'AthleticoCore',
        'loading.model': 'Loading AI Model...',
        
        // SETTINGS
        'settings.title': 'Settings',
        'settings.language': 'Language',
        'settings.voiceFeedback': 'Voice feedback',
        'settings.volume': 'Volume',
        'settings.aiModel': 'AI Model',
        'settings.fast': 'Fast',
        'settings.accurate': 'Accurate',
        'settings.sensitivity': 'Sensitivity',
        'settings.low': 'Low',
        'settings.high': 'High',
        'settings.theme': 'Theme',
        'settings.dark': 'Dark',
        'settings.light': 'Light',
        'settings.voiceGender': 'Voice Gender',
        'settings.male': 'Male',
        'settings.female': 'Female',
        'settings.speechRate': 'Speech Rate',
        'settings.testVoice': 'Test Voice',
        'settings.reset': 'Reset to Default',
        'settings.save': 'Save',
        
        // START SCREEN
        'start.title': 'AI PushUp Coach',
        'start.description': 'Secure your phone on the ground. Make sure the camera sees you completely. AI will count your movements.',
        'start.goal': 'Goal: 20 reps',
        'start.duration': 'Estimated time: 3 min',
        'start.calories': 'Approx calories: 50 kcal',
        'start.button': 'Start Workout',
        
        // HUD
        'hud.reps': 'Reps',
        'hud.time': 'Time',
        'hud.score': 'Score',
        'hud.form': 'Form',
        'hud.ready': 'Get ready...',
        'hud.finish': 'Finish',
        
        // RESULTS SCREEN
        'summary.title': 'Great Job!',
        'summary.reps': 'REPS',
        'summary.time': 'TIME',
        'summary.score': 'SCORE',
        'summary.form': 'FORM',
        'summary.performance': 'Performance Metrics',
        'summary.speed': 'Speed',
        'summary.calories': 'Calories',
        'summary.bestRep': 'Best Rep',
        'summary.consistency': 'Consistency',
        'summary.qualityChart': 'Rep Quality Chart',
        'summary.recommendations': 'Recommendations',
        'summary.newWorkout': 'New Workout',
        'summary.viewStats': 'View Statistics',
        'summary.home': 'Back to Home',
        
        // CHART
        'chart.excellent': 'Excellent',
        'chart.good': 'Good',
        'chart.needsWork': 'Needs Work',
        
        // RECOMMENDATIONS
        'recommendations.goodForm': 'Your form is good, keep going!',
        'recommendations.keepElbows': 'Keep elbows close to your body',
        'recommendations.fullRange': 'Use full range of motion',
        'recommendations.consistentPace': 'Try a more consistent pace',
        'recommendations.restNeeded': 'Get enough rest',
        
        // NAVIGATION
        'nav.home': 'Home',
        'nav.aiCoach': 'AI PushUp',
        'nav.stats': 'Stats',
        'nav.profile': 'Profile',
        'nav.settings': 'Settings',
        
        // ERROR MESSAGES
        'error.title': 'System Error',
        'error.camera': 'Cannot open camera',
        'error.model': 'Failed to load AI model',
        'error.workout': 'Cannot start workout',
        
        // VOICE FEEDBACK
        'voice.start': 'Let\'s go!',
        'voice.down': 'Go down',
        'voice.up': 'Come up',
        'voice.great': 'Great!',
        'voice.keepGoing': 'Keep going!',
        'voice.almost': 'Almost done!',
        'voice.completed': 'Workout completed!',
        'voice.cameraAdjust': 'Adjust camera',
        'voice.formGood': 'Form looks great!',
        'voice.slowDown': 'Slow down a bit',
        'voice.fullRange': 'Use full range'
    }
};

// MEVCUT DİL
let currentLanguage = 'tr-TR';

// ARAYÜZ ÇEVİRİSİNİ GÜNCELLE
function updateUILanguage() {
    const lang = currentLanguage;
    const t = translations[lang] || translations['tr-TR'];
    
    // Tüm çeviri öğelerini güncelle
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (t[key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = t[key];
            } else if (element.hasAttribute('title')) {
                element.title = t[key];
            } else if (element.hasAttribute('aria-label')) {
                element.setAttribute('aria-label', t[key]);
            } else {
                element.textContent = t[key];
            }
        }
    });
    
    // Select option'larını güncelle
    document.querySelectorAll('option[data-i18n]').forEach(option => {
        const key = option.getAttribute('data-i18n');
        if (t[key]) {
            option.textContent = t[key];
        }
    });
}

// DİL DEĞİŞTİR
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    updateUILanguage();
    updateSettingsUI();
    
    // Koç ayarlarını güncelle
    if (window.coachSettings) {
        coachSettings.language = lang;
        speakPreview();
    }
}

// AYARLAR UI GÜNCELLEME
function updateSettingsUI() {
    const lang = currentLanguage;
    const t = translations[lang];
    
    // Hızlı dil değiştiriciyi güncelle
    const quickLang = document.getElementById('quick-language');
    if (quickLang) {
        quickLang.value = lang;
    }
}

// ÇEVİRİYİ AL
function getTranslation(key, lang = null) {
    const targetLang = lang || currentLanguage;
    return translations[targetLang]?.[key] || translations['tr-TR'][key] || key;
}

// SESLİ ÇEVİRİYİ AL
function getVoiceTranslation(key) {
    return getTranslation(`voice.${key}`);
}