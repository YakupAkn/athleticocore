let detector = null;
let animationId = null;
let isWorkoutActive = false;
let currentStream = null;
let pushupCount = 0;
let pushupState = 'up';
let lastRepTime = 0;
let startTime = 0;
let timerInterval = null;
let repQualities = [];
let currentFormScore = 100;
let consistencyScore = 100;
let lastValidAngle = null;
let lastSeenTime = 0;
let smoothedAngle = null;
let speedHistory = [];
let formHistory = [];
const coachSettings = {
    enabled: true,
    language: 'tr-TR',
    gender: 'male',
    volume: 1,
    rate: 1,
    pitch: 1
};

const SPEECH_COOLDOWN = 4000;
const VOICE_COOLDOWN = 1500;
const BLIND_ALLOW_SECONDS = 10;
const CONF_THRESHOLD = 0.35;
const ANGLE_ALPHA = 0.25;
const DOWN_ANGLE = 100;
const UP_ANGLE = 160;
const MIN_REP_INTERVAL = 500;

const KEYPOINTS = {
    LEFT_SHOULDER: 'left_shoulder',
    RIGHT_SHOULDER: 'right_shoulder',
    LEFT_ELBOW: 'left_elbow',
    RIGHT_ELBOW: 'right_elbow',
    LEFT_WRIST: 'left_wrist',
    RIGHT_WRIST: 'right_wrist',
    LEFT_HIP: 'left_hip',
    RIGHT_HIP: 'right_hip',
    LEFT_ANKLE: 'left_ankle',
    RIGHT_ANKLE: 'right_ankle'
};

let availableVoices = [];
let lastSpoken = {};
let lastVoiceAt = 0;

function loadVoices() {
    availableVoices = speechSynthesis.getVoices();
}

speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();
function getCoachVoice() {
    if (!availableVoices.length) return null;
    const lang = coachSettings.language;
    const gender = coachSettings.gender;
    let voice = availableVoices.find(v =>
        v.lang === lang &&
        (gender === 'female'
            ? v.name.toLowerCase().includes('female')
            : !v.name.toLowerCase().includes('female'))
    );
    if (!voice) {
        voice = availableVoices.find(v => v.lang === lang);
    }

    return voice || null;
}

function speak(key, text, force = false) {
    if (!coachSettings.enabled || !text) return;
    const now = Date.now();
    if (lastSpoken[key] && now - lastSpoken[key] < SPEECH_COOLDOWN && !force) return;
    lastSpoken[key] = now;
    if (now - lastVoiceAt < VOICE_COOLDOWN && !force) return;
    lastVoiceAt = now;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = coachSettings.language;
    utter.voice = getCoachVoice();
    utter.volume = coachSettings.volume;
    utter.rate = coachSettings.rate;
    utter.pitch = coachSettings.pitch;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
}

const COACH_PREVIEW_TEXT = {
    'tr-TR': 'Potansiyelini keşfetmeye hazır mısın?',
    'en-US': 'Are you ready to unlock your potential?'
};
function speakPreview() {
    if (!coachSettings.enabled) return;
    
    const text = COACH_PREVIEW_TEXT[coachSettings.language];
    if (!text) return;
    
    speak('preview', text, true);
}
async function openCameraAndroidSafe(video, canvas) {
    if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Kamera desteklenmiyor");
    }
    if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
        currentStream = null;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        });
        currentStream = stream;
        video.srcObject = stream;
        await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;
            video.onerror = reject;
        });
        await video.play();
        await new Promise(resolve => setTimeout(resolve, 300));
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        return stream;
    } catch (error) {
        console.error('Kamera açma hatası:', error);
        throw new Error(`Kamera açılamadı: ${error.message}`);
    }
}
async function loadModel() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';
    if (detector) {
        if (loader) loader.style.display = 'none';
        return detector;
    }
    
    try {
        await tf.setBackend('webgl');
        await tf.ready();
        const modelType = window.appSettings?.aiModel === 'accurate' 
            ? poseDetection.movenet.modelType.SINGLEPOSE_THUNDER
            : poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING;
        const detectorConfig = {
            modelType,
            enableSmoothing: true,
            minPoseScore: 0.25
        };
        detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            detectorConfig
        );
        console.log('AI model yüklendi:', modelType);
    } catch (error) {
        console.error('Model yükleme hatası:', error);
        throw new Error('AI model yüklenemedi');
    } finally {
        if (loader) loader.style.display = 'none';
    }
    return detector;
}
function drawSkeleton(keypoints, minConf = 0.3) {
    const canvas = document.getElementById('output');
    const ctx = canvas?.getContext('2d');
    if (!ctx || !keypoints) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    
    const ALLOWED_POINTS = [
        KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.RIGHT_SHOULDER,
        KEYPOINTS.LEFT_ELBOW, KEYPOINTS.RIGHT_ELBOW,
        KEYPOINTS.LEFT_WRIST, KEYPOINTS.RIGHT_WRIST,
        KEYPOINTS.LEFT_HIP, KEYPOINTS.RIGHT_HIP,
        KEYPOINTS.LEFT_ANKLE, KEYPOINTS.RIGHT_ANKLE
    ];
    
    // Bağlantıları çiz
    ctx.strokeStyle = '#00bfff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const connections = poseDetection.util.getAdjacentPairs(
        poseDetection.SupportedModels.MoveNet
    );
    
    connections.forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];
        
        if (!kp1 || !kp2) return;
        
        if (kp1.score > minConf && kp2.score > minConf &&
            ALLOWED_POINTS.includes(kp1.name) && 
            ALLOWED_POINTS.includes(kp2.name)) {
            
            ctx.beginPath();
            ctx.moveTo(kp1.x, kp1.y);
            ctx.lineTo(kp2.x, kp2.y);
            ctx.stroke();
        }
    });
    
    // Noktaları çiz
    ctx.fillStyle = '#ffffff';
    keypoints.forEach(kp => {
        if (kp.score > minConf && ALLOWED_POINTS.includes(kp.name)) {
            const radius = 5 + (kp.score * 3);
            
            ctx.beginPath();
            ctx.arc(kp.x, kp.y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow efekti
            ctx.shadowColor = '#00bfff';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });
    
    ctx.restore();
}

// KEYPOINT BULMA
function kpByName(keypoints, name) {
    if (!keypoints || !name) return null;
    return keypoints.find(k => k.name === name) || null;
}

// AÇI HESAPLAMA
function calculateAngle(a, b, c) {
    if (!a || !b || !c) return null;
    
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - 
                    Math.atan2(a.y - b.y, a.x - b.x);
    
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    
    return angle;
}

// BODY CONFIDENCE
function bodyConfidence(keypoints) {
    if (!keypoints) return 0;
    
    const importantNames = [
        KEYPOINTS.LEFT_SHOULDER, KEYPOINTS.RIGHT_SHOULDER,
        KEYPOINTS.LEFT_ELBOW, KEYPOINTS.RIGHT_ELBOW,
        KEYPOINTS.LEFT_HIP, KEYPOINTS.RIGHT_HIP
    ];
    
    let sum = 0;
    let count = 0;
    
    importantNames.forEach(name => {
        const kp = kpByName(keypoints, name);
        if (kp && typeof kp.score === 'number') {
            sum += kp.score;
            count++;
        }
    });
    
    return count === 0 ? 0 : sum / count;
}

// FORM ANALİZİ
function analyzeForm(keypoints, angle) {
    if (!keypoints || angle === null) return 100;
    
    let formScore = 100;
    
    // 1. Simetri kontrolü
    const lShoulder = kpByName(keypoints, KEYPOINTS.LEFT_SHOULDER);
    const rShoulder = kpByName(keypoints, KEYPOINTS.RIGHT_SHOULDER);
    const lHip = kpByName(keypoints, KEYPOINTS.LEFT_HIP);
    const rHip = kpByName(keypoints, KEYPOINTS.RIGHT_HIP);
    
    if (lShoulder && rShoulder && lHip && rHip) {
        const shoulderDiff = Math.abs(lShoulder.y - rShoulder.y);
        const hipDiff = Math.abs(lHip.y - rHip.y);
        
        if (shoulderDiff > 20) formScore -= 15;
        if (hipDiff > 15) formScore -= 10;
    }
    
    // 2. Açı kalitesi
    if (angle < 80 || angle > 170) {
        formScore -= 20;
    } else if (angle < 90 || angle > 160) {
        formScore -= 10;
    }
    
    // 3. Hareket akıcılığı
    if (formHistory.length > 1) {
        const lastScore = formHistory[formHistory.length - 1];
        const change = Math.abs(formScore - lastScore);
        
        if (change > 25) {
            formScore -= 10; // Ani değişimler
        }
    }
    
    return Math.max(0, Math.min(100, formScore));
}

// TUTARLILIK HESAPLAMA
function calculateConsistency(scores) {
    if (scores.length < 2) return 100;
    
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const deviations = scores.map(score => Math.abs(score - avg));
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    
    // Düşük sapma = yüksek tutarlılık
    return Math.max(0, 100 - (avgDeviation * 2));
}

// HIZ HESAPLAMA
function calculateSpeed(pushups, durationSeconds) {
    if (durationSeconds === 0) return 0;
    return (pushups / durationSeconds) * 60; // tekrar/dakika
}

// POSE İŞLEME (GÜNCELLENMİŞ)
function processPose(pose) {
    const keypoints = pose.keypoints || pose;
    const minConf = window.appSettings?.confidenceThreshold || 0.28;
    
    // Skeleton çiz
    drawSkeleton(keypoints, minConf);
    
    // Confidence kontrolü
    const conf = bodyConfidence(keypoints);
    const now = Date.now();
    
    // Gerekli keypoint'ler
    const lShoulder = kpByName(keypoints, KEYPOINTS.LEFT_SHOULDER);
    const rShoulder = kpByName(keypoints, KEYPOINTS.RIGHT_SHOULDER);
    const lElbow = kpByName(keypoints, KEYPOINTS.LEFT_ELBOW);
    const rElbow = kpByName(keypoints, KEYPOINTS.RIGHT_ELBOW);
    const lWrist = kpByName(keypoints, KEYPOINTS.LEFT_WRIST);
    const rWrist = kpByName(keypoints, KEYPOINTS.RIGHT_WRIST);
    
    // Görünürlük kontrolü
    const leftVisible = lShoulder && lElbow && lWrist && 
                       lShoulder.score > minConf && 
                       lElbow.score > minConf && 
                       lWrist.score > minConf;
    
    const rightVisible = rShoulder && rElbow && rWrist && 
                        rShoulder.score > minConf && 
                        rElbow.score > minConf && 
                        rWrist.score > minConf;
    
    const shouldersVisible = lShoulder && rShoulder && 
                           lShoulder.score > minConf && 
                           rShoulder.score > minConf;
    
    let computedAngle = null;
    
    // AÇI HESAPLAMA STRATEJİLERİ
    // 1. İki taraf da görünüyorsa ortalama
    if (leftVisible && rightVisible) {
        const leftAngle = calculateAngle(lShoulder, lElbow, lWrist);
        const rightAngle = calculateAngle(rShoulder, rElbow, rWrist);
        
        if (leftAngle != null && rightAngle != null) {
            computedAngle = (leftAngle + rightAngle) / 2;
        }
    }
    // 2. Sadece bir taraf görünüyorsa
    else if (leftVisible || rightVisible) {
        const side = leftVisible ? 
            { s: lShoulder, e: lElbow, w: lWrist } : 
            { s: rShoulder, e: rElbow, w: rWrist };
        
        const sideAngle = calculateAngle(side.s, side.e, side.w);
        if (sideAngle != null) {
            computedAngle = sideAngle;
        }
    }
    // 3. Omuz- kalça yönelimi fallback
    else if (shouldersVisible) {
        const lHip = kpByName(keypoints, KEYPOINTS.LEFT_HIP);
        const rHip = kpByName(keypoints, KEYPOINTS.RIGHT_HIP);
        
        if (lHip && rHip && lHip.score > minConf && rHip.score > minConf) {
            const midShoulder = { 
                x: (lShoulder.x + rShoulder.x) / 2, 
                y: (lShoulder.y + rShoulder.y) / 2 
            };
            const midHip = { 
                x: (lHip.x + rHip.x) / 2, 
                y: (lHip.y + rHip.y) / 2 
            };
            
            const torsoVec = { x: midHip.x - midShoulder.x, y: midHip.y - midShoulder.y };
            const torsoAngleDeg = Math.abs(Math.atan2(torsoVec.y, torsoVec.x) * 180 / Math.PI);
            
            // Torso açısını push-up açısına çevir
            computedAngle = Math.max(60, Math.min(180, 180 - torsoAngleDeg * 0.8));
        }
    }
    
    // AÇI GÜNCELLEME ve FALLBACK
    if (computedAngle != null && typeof computedAngle === 'number') {
        lastValidAngle = computedAngle;
        lastSeenTime = now;
    } else {
        const blindDuration = (now - lastSeenTime) / 1000;
        
        if (lastValidAngle == null || blindDuration >= BLIND_ALLOW_SECONDS || conf < CONF_THRESHOLD) {
            // Uzun süre görünmüyorsa veya düşük confidence
            if (conf < CONF_THRESHOLD) {
                updateFeedback(getVoiceTranslation('cameraAdjust'), 'warning');
                speak('camera_adjust', getVoiceTranslation('cameraAdjust'), false);
            } else {
                updateFeedback(getVoiceTranslation('cameraAdjust'), 'error');
                speak('lost_tracking', getVoiceTranslation('cameraAdjust'), false);
            }
            return;
        } else {
            const blindSec = Math.floor(blindDuration);
            if (blindSec < 3) {
            } else if (blindSec < 7) {
                updateFeedback(getVoiceTranslation('cameraAdjust'), 'warning');
                speak('frame_adjust', getVoiceTranslation('cameraAdjust'), false);
            } else {
                updateFeedback(getVoiceTranslation('cameraAdjust'), 'warning');
                speak('losing_tracking', getVoiceTranslation('cameraAdjust'), false);
            }
            computedAngle = lastValidAngle;
        }
    }
    if (smoothedAngle == null) {
        smoothedAngle = computedAngle;
    } else {
        smoothedAngle = ANGLE_ALPHA * computedAngle + (1 - ANGLE_ALPHA) * smoothedAngle;
    }
    currentFormScore = analyzeForm(keypoints, smoothedAngle);
    formHistory.push(currentFormScore);
    if (formHistory.length > 5) {
        consistencyScore = calculateConsistency(formHistory.slice(-5));
    }
    handleRepState(smoothedAngle);
    updateFormUI();
}

function handleRepState(angle) {
    const now = Date.now();
    if (typeof angle !== 'number' || isNaN(angle)) return;
    if (pushupState === 'up') {
        if (angle < DOWN_ANGLE) {
            pushupState = 'down';
            updateFeedback(getVoiceTranslation('down'), 'warning');
            speak('go_down', getVoiceTranslation('down'), false);
            repQualities.push({
                time: now,
                downAngle: angle,
                formScore: currentFormScore
            });
        }
    } else if (pushupState === 'down') {
        if (angle > UP_ANGLE) {
            if (now - lastRepTime > MIN_REP_INTERVAL) {
                pushupCount++;
                lastRepTime = now;
                
                // Yukarı çıkış kalitesi
                if (repQualities.length > 0) {
                    const lastRep = repQualities[repQualities.length - 1];
                    lastRep.upAngle = angle;
                    lastRep.completed = true;
                    lastRep.duration = now - lastRep.time;
                    lastRep.quality = Math.min(100, (currentFormScore + consistencyScore) / 2);
                }
                
                // Hız güncelleme
                const duration = (now - startTime) / 1000;
                const currentSpeed = calculateSpeed(pushupCount, duration);
                speedHistory.push(currentSpeed);
                
                // UI Güncelleme
                updateUI();
                updateScore();
                
                // Sesli geri bildirim
                const feedbacks = [
                    getVoiceTranslation('great'),
                    getVoiceTranslation('keepGoing'),
                    'Mükemmel!',
                    'Harika gidiyorsun!',
                    'Çok iyi!'
                ];
                
                const randomFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
                updateFeedback(`${getTranslation('hud.reps')}! ${pushupCount}`, 'success');
                
                if (pushupCount % 5 === 0) {
                    speak('milestone', `${pushupCount} tekrar! ${randomFeedback}`, false);
                } else if (currentFormScore > 85) {
                    speak('good_form', getVoiceTranslation('formGood'), false);
                } else {
                    speak('rep_count', `${pushupCount}`, false);
                }
            }
            pushupState = 'up';
        }
    }
}

// UI GÜNCELLEMELERİ
function updateUI() {
    const countEl = document.getElementById('rep-count');
    if (countEl) countEl.textContent = pushupCount;
}

function updateFormUI() {
    const formEl = document.getElementById('form-score');
    if (formEl) {
        formEl.textContent = `${Math.round(currentFormScore)}%`;
        
        // Renk kodlama
        if (currentFormScore >= 80) {
            formEl.style.color = 'var(--success-color)';
        } else if (currentFormScore >= 60) {
            formEl.style.color = 'var(--warning-color)';
        } else {
            formEl.style.color = 'var(--danger-color)';
        }
    }
}

function updateScore() {
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
        const duration = (Date.now() - startTime) / 1000;
        const speed = calculateSpeed(pushupCount, duration);
        const score = calculateScore(pushupCount, currentFormScore, consistencyScore);
        scoreEl.textContent = score;
    }
}

function updateFeedback(msg, type = 'info') {
    const el = document.getElementById('feedback-msg');
    if (!el) return;
    
    el.textContent = msg;
    el.className = `feedback-pill ${type}`;
}

// ZAMANLAYICI
function startTimer() {
    startTime = Date.now();
    const timerEl = document.getElementById('timer');
    
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const s = (elapsed % 60).toString().padStart(2, '0');
        
        if (timerEl) timerEl.textContent = `${m}:${s}`;
        
        // Her 30 saniyede bir motivasyon
        if (elapsed % 30 === 0 && elapsed > 0) {
            const motivations = [
                'Harika gidiyorsun!',
                'Devam et!',
                'Gücünü göster!',
                'Sonuna kadar!',
                'Mükemmelsin!'
            ];
            const motivation = motivations[Math.floor(Math.random() * motivations.length)];
            speak('motivation', motivation, false);
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// RENDER DÖNGÜSÜ
async function renderLoop() {
    if (!isWorkoutActive) return;
    
    const video = document.getElementById('video');
    if (!video || video.readyState !== 4) {
        animationId = requestAnimationFrame(renderLoop);
        return;
    }
    
    try {
        if (detector) {
            const poses = await detector.estimatePoses(video, { 
                flipHorizontal: true,
                maxPoses: 1
            });
            
            if (poses && poses.length > 0) {
                processPose(poses[0]);
            }
        }
    } catch (err) {
        console.warn('Pose estimation error:', err);
    }
    
    animationId = requestAnimationFrame(renderLoop);
}



function calculateWorkoutScore(pushups, durationMin, intensity) {
  const baseScore = pushups * 10;
  const timeBonus = durationMin > 5 ? 50 : durationMin * 10;
  const intensityBonus = intensity * 5;
  return baseScore + timeBonus + intensityBonus;
}

// YEREL İSTATİSTİK KAYDETME
function saveToLocalStats(reps) {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const stats = loadFromLocalStorage('workout_stats', {});
        
        if (!stats[today]) {
            stats[today] = {
                totalReps: 0,
                workoutCount: 0,
                bestReps: 0
            };
        }
        
        stats[today].totalReps += reps;
        stats[today].workoutCount += 1;
        stats[today].bestReps = Math.max(stats[today].bestReps, reps);
        
        saveToLocalStorage('workout_stats', stats);
        console.log('İstatistikler kaydedildi:', stats[today]);
    } catch (error) {
        console.error('İstatistik kaydetme hatası:', error);
    }
}

// SONUÇLARI HESAPLA
function calculateResults() {
    const duration = (Date.now() - startTime) / 1000;
    
    // Ana istatistikler
    document.getElementById('final-reps').textContent = pushupCount;
    document.getElementById('final-time').textContent = formatTime(duration);
    
    // Form ortalaması
    const avgForm = formHistory.length > 0 ? 
        Math.round(formHistory.reduce((a, b) => a + b, 0) / formHistory.length) : 100;
    document.getElementById('final-form').textContent = `${avgForm}%`;
    
    // Puan
    const finalScore = calculateScore(pushupCount, avgForm, consistencyScore);
    document.getElementById('final-score').textContent = finalScore;
    
    // Performans metrikleri
    const speed = calculateSpeed(pushupCount, duration);
    document.getElementById('speed-value').textContent = `${speed.toFixed(1)} tekrar/dk`;
    
    const calories = calculateCalories(pushupCount, duration);
    document.getElementById('calories-value').textContent = `${calories} kcal`;
    
    // En iyi tekrar
    const bestRep = repQualities.length > 0 ? 
        Math.max(...repQualities.map(r => r.quality || 0)) : 0;
    document.getElementById('best-rep-value').textContent = `${Math.round(bestRep)}%`;
    
    // Tutarlılık
    document.getElementById('consistency-value').textContent = `${Math.round(consistencyScore)}%`;
    
    // Öneriler oluştur
    generateRecommendations(avgForm, consistencyScore, speed);
    
    // Grafik oluştur
    createQualityChart();
}

// ÖNERİLER OLUŞTUR
function generateRecommendations(formScore, consistency, speed) {
    const recommendationsList = document.getElementById('recommendations-list');
    if (!recommendationsList) return;
    
    recommendationsList.innerHTML = '';
    const recommendations = [];
    
    if (formScore >= 85) {
        recommendations.push(getTranslation('recommendations.goodForm'));
    } else if (formScore < 70) {
        recommendations.push(getTranslation('recommendations.keepElbows'));
        recommendations.push(getTranslation('recommendations.fullRange'));
    }
    
    if (consistency < 75) {
        recommendations.push(getTranslation('recommendations.consistentPace'));
    }
    
    if (speed > 40) {
        recommendations.push(getTranslation('recommendations.slowDown'));
    }
    
    if (pushupCount > 30) {
        recommendations.push(getTranslation('recommendations.restNeeded'));
    }
    
    // Varsayılan öneri
    if (recommendations.length === 0) {
        recommendations.push(getTranslation('recommendations.goodForm'));
    }
    
    // Listeyi oluştur
    recommendations.forEach(rec => {
        const item = document.createElement('div');
        item.className = 'recommendation-item';
        item.innerHTML = `
            <i data-lucide="check-circle"></i>
            <span>${rec}</span>
        `;
        recommendationsList.appendChild(item);
    });
    
    // İkonları güncelle
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// KALİTE GRAFİĞİ OLUŞTUR
function createQualityChart() {
    const ctx = document.getElementById('quality-chart')?.getContext('2d');
    if (!ctx || repQualities.length === 0) return;
    
    const labels = repQualities.map((_, i) => `Tekrar ${i + 1}`);
    const data = repQualities.map(r => r.quality || 0);
    
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.slice(-10), // Son 10 tekrar
            datasets: [{
                label: 'Kalite (%)',
                data: data.slice(-10),
                backgroundColor: data.map(quality => {
                    if (quality >= 85) return '#10b981';
                    if (quality >= 70) return '#f59e0b';
                    return '#ef4444';
                }),
                borderColor: 'var(--border-color)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `Kalite: ${context.raw}%`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'var(--border-color)'
                    },
                    ticks: {
                        color: 'var(--text-dim)',
                        callback: (value) => `${value}%`
                    }
                },
                x: {
                    grid: {
                        color: 'var(--border-color)'
                    },
                    ticks: {
                        color: 'var(--text-dim)'
                    }
                }
            }
        }
    });
    
    window.qualityChart = chart;
}

// GLOBAL DEĞİŞKENLERE EKLEYİN
let isSaving = false; // Kayıt kontrolü için

// SUPABASE FONKSİYONLARI
async function getCurrentUser() {
    try {
        const { data, error } = await window.sb.auth.getUser();
        if (error) throw error;
        return data?.user || null;
    } catch (error) {
        console.error('Kullanıcı bilgisi alınamadı:', error);
        return null;
    }
}

async function handleWorkoutSave({
  workoutType,
  durationMin,
  intensity,
  push,
  completed,
  startedAt
}) {
    if (isSaving) {
        console.warn("Zaten kaydediliyor, işlem iptal edildi.");
        return;
    }

    isSaving = true;

    try {
        const user = await getCurrentUser();
        if (!user) {
            console.log("Kullanıcı giriş yapmamış, kayıt atlandı");
            return;
        }

        const { error } = await window.sb
            .from("workout_sessions")
            .insert({
                user_id: user.id,
                workout_type: workoutType,
                duration_min: durationMin,
                intensity,
                push,
                completed,
                started_at: new Date(startedAt).toISOString(),
                ended_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                score: calculateWorkoutScore(push, durationMin, intensity),
                form_score: currentFormScore,
                consistency_score: consistencyScore
            });

        if (error) throw error;
        
        console.log("Antrenman Supabase'e kaydedildi");

        // Günlük özeti güncelle
        await updateDailySummary(durationMin);

    } catch (e) {
        console.error("Kayıt başarısız", e);
    } finally {
        isSaving = false;
    }
}

async function updateDailySummary(durationMin) {
    try {
        const user = await getCurrentUser();
        if (!user) return;
        
        const today = new Date().toISOString().slice(0, 10);
        
        const { data, error } = await window.sb
            .from('daily_summary')
            .upsert({
                user_id: user.id,
                date: today,
                total_duration: durationMin,
                workout_count: 1,
                completed: true,
                last_workout: new Date().toISOString()
            }, {
                onConflict: 'user_id,date'
            });
        
        if (error) throw error;
        console.log('Daily summary güncellendi');
        
    } catch (error) {
        console.error('Daily summary hatası:', error);
    }
}

// ANTRENMAN BAŞLATMA
async function startWorkout() {
    try {
        // UI geçişi
        const startScreen = document.getElementById('start-screen');
        const hud = document.getElementById('hud');
        const loader = document.getElementById('loader');
        
        if (startScreen) startScreen.classList.add('hidden');
        if (loader) loader.style.display = 'block';
        
        // Kamerayı aç
        const video = document.getElementById('video');
        const canvas = document.getElementById('output');
        
        if (!video || !canvas) {
            throw new Error('Video veya canvas elementi bulunamadı');
        }
        
        await openCameraAndroidSafe(video, canvas);
        
        // Modeli yükle
        await loadModel();
        
        // Antrenman durumunu sıfırla
        isWorkoutActive = true;
        pushupCount = 0;
        pushupState = 'up';
        lastRepTime = 0;
        startTime = Date.now();
        lastValidAngle = null;
        lastSeenTime = Date.now();
        smoothedAngle = null;
        repQualities = [];
        currentFormScore = 100;
        consistencyScore = 100;
        speedHistory = [];
        formHistory = [];
        
        // UI güncelle
        updateUI();
        updateFeedback(getTranslation('hud.ready') || 'Hazır ol...', 'info');
        
        // HUD'u göster
        if (loader) loader.style.display = 'none';
        if (hud) hud.style.display = 'flex';
        
        // Sesli geri bildirim
        speak('workout_start', getVoiceTranslation('ready') || 'Hazır ol... Antrenman başlıyor', true);
        
        // Zamanlayıcıyı başlat
        startTimer();
        
        // Render döngüsünü başlat
        renderLoop();
        
    } catch (error) {
        console.error('Antrenman başlatma hatası:', error);
        
        // UI'ı geri yükle
        const startScreen = document.getElementById('start-screen');
        const hud = document.getElementById('hud');
        const loader = document.getElementById('loader');
        
        if (startScreen) startScreen.classList.remove('hidden');
        if (hud) hud.style.display = 'none';
        if (loader) loader.style.display = 'none';
        
        // Hata mesajı göster
        showError(`Kamera veya model başlatılamadı: ${error.message}`);
        speak('error', getVoiceTranslation('error') || 'Bir hata oluştu', true);
    }
}

// UYGULAMA BAŞLATMA
function initApp() {
    // Buton event'ları
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    
    if (startBtn) {
        startBtn.addEventListener('click', (e) => {
            e.preventDefault();
            startWorkout();
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            stopWorkout();
        });
    }
    
    // Klavye kısayolları
    window.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            if (!isWorkoutActive) {
                startWorkout();
            } else {
                stopWorkout();
            }
        }
        
        // ESC ile durdur
        if (e.key === 'Escape' && isWorkoutActive) {
            stopWorkout();
        }
        
        // S ile ayarlar
        if (e.key === 's' || e.key === 'S') {
            toggleSettings();
        }
    });
    
    // Sayfa kapatma uyarısı
    window.addEventListener('beforeunload', (e) => {
        if (isWorkoutActive) {
            e.preventDefault();
            e.returnValue = 'Antrenman devam ediyor. Çıkmak istediğinizden emin misiniz?';
        }
    });
    
    // Online/offline dinleyicisi
    setupOnlineListener();
    
    // İkonları oluştur
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
    
    console.log('AI Koç uygulaması başlatıldı');
}

// Sonuç ekranı için kısa analiz hazırla
function prepareSimpleAnalysis() {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    const durationMin = duration / 60;
    
    // Hız hesapla
    const speed = durationMin > 0 ? pushupCount / durationMin : 0;
    const speedTextEl = document.getElementById('speed-text');
    if (speedTextEl) speedTextEl.textContent = `${speed.toFixed(1)} tekrar/dk`;
    
    // Form değerlendirmesi
    let formText = getTranslation('chart.excellent');
    let formColor = 'var(--success-color)';
    
    if (currentFormScore >= 85) {
        formText = getTranslation('chart.excellent');
    } else if (currentFormScore >= 70) {
        formText = getTranslation('chart.good');
        formColor = 'var(--warning-color)';
    } else {
        formText = getTranslation('chart.needsWork');
        formColor = 'var(--danger-color)';
    }
    
    const formTextEl = document.getElementById('form-text');
    if (formTextEl) {
        formTextEl.textContent = formText;
        formTextEl.style.color = formColor;
    }
    
    // İpucu belirle
    let tipText = 'Harika iş çıkardın!';
    
    if (pushupCount < 10) {
        tipText = 'Daha fazla tekrar için gayret et!';
    } else if (currentFormScore < 70) {
        tipText = 'Formuna daha fazla odaklan!';
    } else if (consistencyScore < 70) {
        tipText = 'Daha tutarlı bir tempo dene!';
    } else if (pushupCount > 30) {
        tipText = 'Müthiş performans!';
    }
    
    document.getElementById('tip-text').textContent = tipText;
}

// Güncellenmiş stopWorkout fonksiyonu (analiz ekle)
function stopWorkout() {
    isWorkoutActive = false;
    if (animationId) cancelAnimationFrame(animationId);
    stopTimer();

    // Kamerayı durdur
    const video = document.getElementById('video');
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(t => t.stop());
    }

    // UI geçişi
    const hud = document.getElementById('hud');
    const summaryScreen = document.getElementById('summary-screen');
    if (hud) hud.style.display = 'none';
    if (summaryScreen) summaryScreen.classList.remove('hidden');

    // Sonuçları göster
    const finalReps = document.getElementById('final-reps');
    if (finalReps) finalReps.innerText = pushupCount;

    const finalTime = document.getElementById('final-time');
    if (finalTime) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const s = (elapsed % 60).toString().padStart(2, '0');
        finalTime.innerText = `${m}:${s}`;
    }

    const finalScore = document.getElementById('final-score');
    if (finalScore) {
        const durationMin = Math.ceil((Date.now() - startTime) / 1000 / 60);
        const score = calculateWorkoutScore(pushupCount, durationMin, 7);
        finalScore.innerText = score;
    }

    // Analiz hazırla
    prepareSimpleAnalysis();

    // Yerel depolamaya kaydet
    if (typeof saveToLocalStats === 'function') {
        saveToLocalStats(pushupCount);
    }
    speak('workout_complete', 'Antrenman tamamlandı', true);

    // Süreyi hesapla
    const durationMin = Math.ceil((Date.now() - startTime) / 1000 / 60);
    handleWorkoutSave({
        workoutType: "pushup",
        durationMin,
        intensity: 7,
        push: pushupCount,
        completed: true,
        startedAt: startTime
    });
}

window.startWorkout = startWorkout;
window.stopWorkout = stopWorkout;
window.toggleSettings = toggleSettings;
window.coachSettings = coachSettings;