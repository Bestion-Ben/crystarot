// 数据追踪核心工具 - 修复ESLint错误
class MVPTracker {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
    this.initSession();
  }

  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  initSession() {
    const sessionData = {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      source: this.getSourceInfo(),
      device: this.getDeviceInfo(),
      events: []
    };
    
    localStorage.setItem(`session_${this.sessionId}`, JSON.stringify(sessionData));
    this.track('session_start', {});
  }

  getSourceInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      referrer: document.referrer || 'direct',
      campaign: urlParams.get('utm_campaign'),
      source: urlParams.get('utm_source') || urlParams.get('source'),
      medium: urlParams.get('utm_medium'),
      url: window.location.href
    };
  }

  getDeviceInfo() {
    // 修复第45行的screen错误 - 使用window.screen代替直接使用screen
    const getScreenSize = () => {
      if (typeof window !== 'undefined' && window.screen) {
        return `${window.screen.width}x${window.screen.height}`;
      }
      return 'unknown';
    };

    const getViewportSize = () => {
      if (typeof window !== 'undefined') {
        return `${window.innerWidth}x${window.innerHeight}`;
      }
      return 'unknown';
    };

    const getUserAgent = () => {
      if (typeof navigator !== 'undefined') {
        return navigator.userAgent;
      }
      return 'unknown';
    };

    const getLanguage = () => {
      if (typeof navigator !== 'undefined') {
        return navigator.language;
      }
      return 'unknown';
    };

    const getPlatform = () => {
      if (typeof navigator !== 'undefined') {
        return navigator.platform;
      }
      return 'unknown';
    };

    const isMobile = () => {
      if (typeof navigator !== 'undefined') {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      }
      return false;
    };

    return {
      userAgent: getUserAgent(),
      screen: getScreenSize(), // 修复后的screen使用
      viewport: getViewportSize(),
      language: getLanguage(),
      platform: getPlatform(),
      isMobile: isMobile()
    };
  }

  track(eventName, eventData = {}) {
    const sessionData = JSON.parse(localStorage.getItem(`session_${this.sessionId}`));
    
    const event = {
      event: eventName,
      timestamp: Date.now(),
      timeFromStart: Date.now() - this.sessionStartTime,
      data: eventData,
      page: this.getCurrentPage()
    };

    sessionData.events.push(event);
    localStorage.setItem(`session_${this.sessionId}`, JSON.stringify(sessionData));

    // 修复第69行的gtag错误 - 安全地调用gtag
    this.trackWithGtag(eventName, eventData);

    console.log('📊 Tracked:', eventName, eventData);
  }

  // 新增方法：安全地调用gtag
  trackWithGtag(eventName, eventData) {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', eventName, eventData);
    } else {
      // 如果gtag不可用，只在开发环境输出日志
      if (process.env.NODE_ENV === 'development') {
        console.log('gtag not available, event would be:', eventName, eventData);
      }
    }
  }

  getCurrentPage() {
    // 基于URL或应用状态判断当前页面
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  }
}

// 导出单例
export const tracker = new MVPTracker();