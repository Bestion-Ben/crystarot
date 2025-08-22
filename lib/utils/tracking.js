class MVPTracker {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
    this.initSession();
  }

  getOrCreateSessionId() {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined') {
      // 服务端渲染时返回临时ID
      return `ssr_session_${Date.now()}`;
    }
    
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  initSession() {
    // 只在浏览器环境中初始化
    if (typeof window === 'undefined') return;
    
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
    if (typeof window === 'undefined') {
      return {
        referrer: 'ssr',
        campaign: null,
        source: 'ssr',
        medium: null,
        url: 'ssr'
      };
    }
    
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

  // 🔥 增强的GA4检查方法
  isGA4Enabled() {
    return (
      typeof window !== 'undefined' && 
      typeof window.gtag === 'function' &&
      process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID &&
      process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
    );
  }

  track(eventName, eventData = {}) {
    // 只在浏览器环境中执行
    if (typeof window === 'undefined') {
      console.log('📊 SSR Tracked:', eventName, eventData);
      return;
    }
    
    // 本地存储（保持现有功能）
    const sessionData = JSON.parse(localStorage.getItem(`session_${this.sessionId}`) || '{"events":[]}');
    
    const event = {
      event: eventName,
      timestamp: Date.now(),
      timeFromStart: Date.now() - this.sessionStartTime,
      data: eventData,
      page: this.getCurrentPage()
    };

    sessionData.events = sessionData.events || [];
    sessionData.events.push(event);
    localStorage.setItem(`session_${this.sessionId}`, JSON.stringify(sessionData));

    // 🔥 增强的GA4追踪 - 新的方法
    this.trackWithEnhancedGA4(eventName, eventData);

    // 发送到自定义分析API
    this.sendToCustomAnalytics(eventName, eventData);

    console.log('📊 Tracked:', eventName, eventData);
  }

  // 🔥 新增：发送到自定义分析API
  async sendToCustomAnalytics(eventName, eventData) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, data: eventData })
      });
    } catch (error) {
      console.error('Custom analytics error:', error);
    }
  }

  // 🔥 全新的增强GA4追踪方法
  trackWithEnhancedGA4(eventName, eventData) {
    if (!this.isGA4Enabled()) return;

    try {
      // 使用塔罗专用事件映射
      this.sendTarotSpecificEvents(eventName, eventData);
      
      // 保持原有的通用GA4追踪作为备用
      this.trackWithGA4(eventName, eventData);
      
    } catch (error) {
      console.error('Enhanced GA4 tracking error:', error);
    }
  }

  // 🔥 新增：塔罗专用GA4事件
  sendTarotSpecificEvents(eventName, eventData) {
    if (!this.isGA4Enabled()) return;

    const tarotEventMappings = {
      'session_start': () => {
        window.gtag('event', 'session_start', {
          engagement_time_msec: 1,
          session_id: this.sessionId,
          ...this.cleanDataForGA4(eventData)
        });
      },

      'plan_selected': () => {
        const planValue = eventData.planId === 'quick' ? 0 : 
                         eventData.planId === 'deep' ? 2.99 : 4.99;
        window.gtag('event', 'plan_selected', {
          plan_id: eventData.planId,
          currency: 'USD',
          value: planValue,
          plan_type: eventData.planType || 'free',
          ...this.cleanDataForGA4(eventData)
        });
      },

      'question_selected': () => {
        window.gtag('event', 'question_selected', {
          question_category: eventData.questionType,
          method: eventData.isCustom ? 'custom' : 'predefined',
          question_length: eventData.questionLength || 0,
          ...this.cleanDataForGA4(eventData)
        });
      },

      'card_selected': () => {
        window.gtag('event', 'card_selected', {
          card_name: eventData.cardName,
          card_element: eventData.cardElement,
          card_upright: eventData.cardUpright,
          selection_order: eventData.selectionOrder || 1,
          ...this.cleanDataForGA4(eventData)
        });
      },

      'reading_completed': () => {
        const planValue = eventData.planType === 'quick' ? 0 : 
                         eventData.planType === 'deep' ? 2.99 : 4.99;
        window.gtag('event', 'reading_completed', {
          currency: 'USD',
          value: planValue,
          card_name: eventData.cardName,
          question_category: eventData.questionType,
          reading_source: eventData.source || 'unknown',
          reading_length: eventData.readingLength || 0,
          plan_type: eventData.planType,
          ...this.cleanDataForGA4(eventData)
        });
      },

      'rating_given': () => {
        window.gtag('event', 'rating_given', {
          rating: eventData.rating,
          satisfaction_level: eventData.rating >= 4 ? 'high' : 
                             eventData.rating >= 3 ? 'medium' : 'low',
          card_name: eventData.cardName,
          plan_type: eventData.planType,
          ...this.cleanDataForGA4(eventData)
        });
      },

      'share_completed': () => {
        window.gtag('event', 'share', {
          method: eventData.shareMethod || 'unknown',
          content_type: 'tarot_reading',
          content_id: eventData.cardName,
          ...this.cleanDataForGA4(eventData)
        });
      },

      'email_provided': () => {
        const leadValue = eventData.planId === 'deep' ? 2.99 : 4.99;
        window.gtag('event', 'email_provided', {
          plan_interest: eventData.planId,
          lead_value: leadValue,
          currency: 'USD',
          method: 'voluntary',
          ...this.cleanDataForGA4(eventData)
        });
      },

      'error_occurred': () => {
        window.gtag('event', 'exception', {
          description: eventData.errorType || 'unknown_error',
          fatal: false,
          error_stage: eventData.stage || 'unknown',
          ...this.cleanDataForGA4(eventData)
        });
      }
    };

    // 执行对应的塔罗事件
    if (tarotEventMappings[eventName]) {
      tarotEventMappings[eventName]();
    } else {
      // 发送自定义事件
      window.gtag('event', eventName, {
        event_category: 'tarot_custom',
        event_label: eventName,
        ...this.cleanDataForGA4(eventData)
      });
    }
  }

  // 🔥 保持原有的GA4方法作为备用
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
      'reading_completed': 'purchase', // 🔥 更改为purchase以提高转化追踪
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
      'reading_completed': eventData.planType === 'quick' ? 0 : 
                          eventData.planType === 'deep' ? 2.99 : 4.99,
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

  // 🔥 增强的页面浏览追踪
  trackPageView(pageName, pageData = {}) {
    if (this.isGA4Enabled()) {
      // 获取测量ID
      const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
      
      window.gtag('config', measurementId, {
        page_path: `/${pageName}`,
        page_title: `ArcaneCards - ${pageName}`,
        custom_map: {
          custom_dimension_1: pageData.planSelected || 'none',
          custom_dimension_2: pageData.questionSelected || 'none',
          custom_dimension_3: pageData.planType || 'none'
        }
      });

      // 发送页面浏览事件
      window.gtag('event', 'page_view', {
        page_title: `ArcaneCards - ${pageName}`,
        page_location: window.location.href,
        page_path: `/${pageName}`,
        content_group1: pageData.planSelected || 'none',
        content_group2: pageData.questionSelected || 'none'
      });
    }
    
    // 本地追踪
    this.track('page_view', { page: pageName, ...pageData });
  }

  // 🔥 增强的转化事件追踪
  trackConversion(conversionType, value = 0, additionalData = {}) {
    if (this.isGA4Enabled()) {
      const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
      
      window.gtag('event', 'conversion', {
        send_to: measurementId,
        value: value,
        currency: 'USD',
        conversion_type: conversionType,
        ...this.cleanDataForGA4(additionalData)
      });

      // 同时发送特定的转化事件
      window.gtag('event', 'purchase', {
        transaction_id: `tarot_${Date.now()}`,
        value: value,
        currency: 'USD',
        items: [{
          item_id: additionalData.planType || 'tarot_reading',
          item_name: `Tarot Reading - ${additionalData.planType || 'Unknown'}`,
          category: 'Digital Service',
          quantity: 1,
          price: value
        }]
      });
    }

    // 本地追踪
    this.track('conversion', { type: conversionType, value, ...additionalData });
  }

  // 🔥 新增：便捷的追踪方法别名（保持向后兼容）
  trackUserAction(eventName, data = {}) {
    return this.track(eventName, data);
  }
}

// 导出单例
export const tracker = new MVPTracker();