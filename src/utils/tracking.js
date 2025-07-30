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
      screen: getScreenSize(),
      viewport: getViewportSize(),
      language: getLanguage(),
      platform: getPlatform(),
      isMobile: isMobile()
    };
  }

  track(eventName, eventData = {}) {
    // 本地存储（保持现有功能）
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

    // Google Analytics 4 追踪
    this.trackWithGA4(eventName, eventData);

    console.log('📊 Tracked:', eventName, eventData);
  }

  trackWithGA4(eventName, eventData) {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      // 转换事件名称为GA4标准格式
      const ga4EventName = this.convertToGA4EventName(eventName);
      
      // 清理和转换数据
      const cleanedData = this.cleanDataForGA4(eventData);
      
      // 发送到Google Analytics
      window.gtag('event', ga4EventName, {
        ...cleanedData,
        // 添加标准参数
        engagement_time_msec: Date.now() - this.sessionStartTime,
        session_id: this.sessionId,
        page_location: window.location.href,
        page_title: document.title
      });

      // 发送自定义事件（保持原始名称用于自定义报告）
      window.gtag('event', 'custom_tarot_event', {
        event_category: 'tarot_interaction',
        event_label: eventName,
        custom_parameter_data: JSON.stringify(cleanedData),
        value: this.getEventValue(eventName, eventData)
      });
    }
  }

  convertToGA4EventName(eventName) {
    // 将自定义事件名映射到GA4推荐事件
    const eventMapping = {
      'session_start': 'session_start',
      'plan_clicked': 'select_item',
      'plan_selected': 'add_to_cart',
      'question_type_selected': 'select_content',
      'card_selected': 'select_content', 
      'reading_generated': 'generate_lead',
      'rating_given': 'post_score',
      'share_clicked': 'share',
      'share_completed': 'share',
      'payment_button_clicked': 'begin_checkout',
      'email_provided': 'sign_up',
      'upgrade_clicked': 'purchase'
    };

    return eventMapping[eventName] || 'custom_event';
  }

  cleanDataForGA4(data) {
    // GA4对参数名和值有限制，需要清理数据
    const cleaned = {};
    
    Object.keys(data).forEach(key => {
      // 参数名限制：最多40个字符，只能包含字母数字和下划线
      let cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 40);
      
      // 值的限制：字符串最多100字符
      let value = data[key];
      if (typeof value === 'string' && value.length > 100) {
        value = value.substring(0, 97) + '...';
      }
      
      // 只保留基本数据类型
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        cleaned[cleanKey] = value;
      }
    });

    return cleaned;
  }

  getEventValue(eventName, eventData) {
    // 为重要事件设置数值，用于GA4的价值追踪
    const valueMapping = {
      'reading_generated': 1,
      'rating_given': eventData.rating || 1,
      'email_provided': 5,
      'payment_button_clicked': 10,
      'share_completed': 2
    };

    return valueMapping[eventName] || 0;
  }

  getCurrentPage() {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  }

  // 新增：页面浏览追踪
  trackPageView(pageName, pageData = {}) {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('config', 'G-你的测量ID', {
        page_path: `/${pageName}`,
        page_title: `ArcaneCards - ${pageName}`,
        custom_map: {
          custom_dimension_1: pageData.planSelected || 'none',
          custom_dimension_2: pageData.questionSelected || 'none'
        }
      });
    }
    
    // 本地追踪
    this.track('page_view', { page: pageName, ...pageData });
  }

  // 新增：转化事件追踪
  trackConversion(conversionType, value = 0) {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'conversion', {
        send_to: 'G-你的测量ID',
        value: value,
        currency: 'USD',
        conversion_type: conversionType
      });
    }
  }
}

// 导出单例
export const tracker = new MVPTracker();