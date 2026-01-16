class AnalyticsManager {
    constructor() {
        this.trackingId = 'G-PKGT70JY2E'; // Kendi ID'nizi ekleyin
        this.userId = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        // Google Analytics Script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.trackingId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());
        gtag('config', this.trackingId, {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname
        });

        // Custom Events
        this.trackPageView();
        this.initialized = true;
    }

    setUserId(userId) {
        if (!userId) return;
        this.userId = userId;
        gtag('config', this.trackingId, {
            user_id: userId
        });
    }

    trackPageView() {
        gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
            page_path: window.location.pathname
        });
    }

    trackEvent(category, action, label, value) {
        gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
            user_id: this.userId
        });
    }

    // Custom Events for AthleticoCore
    trackWorkoutStart() {
        this.trackEvent('workout', 'start', 'pushup', 1);
    }

    trackWorkoutComplete(pushupCount, duration) {
        this.trackEvent('workout', 'complete', 'pushup', pushupCount);
        gtag('event', 'workout_completed', {
            pushup_count: pushupCount,
            duration_seconds: duration,
            user_id: this.userId
        });
    }

    trackUserRegistration(method) {
        this.trackEvent('user', 'registration', method, 1);
    }

    trackPremiumUpgrade() {
        this.trackEvent('revenue', 'upgrade', 'premium', 1);
    }

    trackError(errorType, errorMessage) {
        this.trackEvent('error', errorType, errorMessage, 1);
    }
}