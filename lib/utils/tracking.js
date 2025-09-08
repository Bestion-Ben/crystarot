// ===== 简化版追踪系统 - 只处理8个核心事件 =====

import { EVENTS } from '../constants/events';

class CoreTracker {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
  }

  getOrCreateSessionId() {
    if (typeof window === 'undefined') {
      return `ssr_session_${Date.now()}`;
    }
    
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  track(eventName, eventData = {}) {
    if (typeof window === 'undefined') {
      console.log('📊 SSR Tracked:', eventName, eventData);
      return;
    }
    
    // 1. 本地存储
    this.saveToLocal(eventName, eventData);
    
    // 2. 发送到GA4（核心事件映射）
    this.sendToGA4(eventName, eventData);
    
    // 3. 发送到自定义API
    this.sendToCustomAPI(eventName, eventData);
    
    console.log('📊 Core Event Tracked:', eventName, eventData);
  }

  saveToLocal(eventName, eventData) {
    try {
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
    } catch (error) {
      console.error('Local storage error:', error);
    }
  }

  // 简化的GA4事件映射 - 只处理8个核心事件
  sendToGA4(eventName, eventData) {
    if (!this.isGA4Enabled()) return;

    try {
      const cleanedData = this.cleanDataForGA4(eventData);
      
      // 核心事件的GA4映射
      switch (eventName) {
        case EVENTS.SESSION_START:
          window.gtag('event', 'session_start', {
            engagement_time_msec: 1,
            session_id: this.sessionId,
            ...cleanedData
          });
          break;

        case EVENTS.READING_COMPLETED:
          // 映射到GA4的purchase事件（表示完成了免费"购买"）
          window.gtag('event', 'purchase', {
            transaction_id: `tarot_reading_${Date.now()}`,
            currency: 'USD',
            value: 0, // 免费版本
            items: [{
              item_id: 'quick_tarot_reading',
              item_name: 'Quick Tarot Reading',
              category: 'Digital Service',
              quantity: 1,
              price: 0
            }],
            ...cleanedData
          });
          break;

        case EVENTS.RATING_GIVEN:
          window.gtag('event', 'post_score', {
            score: cleanedData.rating,
            level: cleanedData.rating >= 4 ? 'high_satisfaction' : 'needs_improvement',
            ...cleanedData
          });
          break;

        case EVENTS.SHARE_COMPLETED:
          window.gtag('event', 'share', {
            method: cleanedData.shareMethod || 'unknown',
            content_type: 'tarot_reading',
            content_id: cleanedData.cardName || 'unknown_card',
            ...cleanedData
          });
          break;

        case EVENTS.EMAIL_PROVIDED:
          window.gtag('event', 'sign_up', {
            method: 'email',
            ...cleanedData
          });
          break;

        case EVENTS.AI_READING_SUCCESS:
          // 自定义事件 - 重要的技术指标
          window.gtag('event', 'ai_success', {
            event_category: 'ai_performance',
            event_label: cleanedData.provider || 'unknown',
            value: cleanedData.generationTime || 0,
            ...cleanedData
          });
          break;

        case EVENTS.AI_READING_FAILED:
          // 自定义事件 - 重要的技术指标
          window.gtag('event', 'ai_failure', {
            event_category: 'ai_performance',
            event_label: cleanedData.fallbackReason || 'unknown',
            ...cleanedData
          });
          break;

        case EVENTS.READING_GENERATION_TIME:
          // 自定义事件 - 性能指标
          window.gtag('event', 'timing_complete', {
            name: 'reading_generation',
            value: cleanedData.duration || 0,
            event_category: 'performance',
            ...cleanedData
          });
          break;

        default:
          console.warn('Unknown core event:', eventName);
      }
      
    } catch (error) {
      console.error('GA4 tracking error:', error);
    }
  }

  async sendToCustomAPI(eventName, eventData) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          event: eventName, 
          data: eventData,
          sessionId: this.sessionId,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Custom analytics error:', error);
    }
  }

  isGA4Enabled() {
    return (
      typeof window !== 'undefined' && 
      typeof window.gtag === 'function' &&
      process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID &&
      process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true'
    );
  }

  cleanDataForGA4(data) {
    const cleaned = {};
    
    Object.keys(data).forEach(key => {
      let cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 40);
      let value = data[key];
      
      if (typeof value === 'string' && value.length > 100) {
        value = value.substring(0, 97) + '...';
      }
      
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        cleaned[cleanKey] = value;
      }
    });

    return cleaned;
  }

  getCurrentPage() {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  }

  // 简化的页面浏览追踪
  trackPageView(pageName, pageData = {}) {
    if (this.isGA4Enabled()) {
      const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
      
      window.gtag('config', measurementId, {
        page_path: `/${pageName}`,
        page_title: `ArcaneCards - ${pageName}`,
        ...this.cleanDataForGA4(pageData)
      });
    }
  }

  // 简化的用户行为追踪入口
  trackUserAction(eventName, data = {}) {
    // 只允许追踪定义的核心事件
    const allowedEvents = Object.values(EVENTS);
    if (!allowedEvents.includes(eventName)) {
      console.warn('Attempted to track non-core event:', eventName);
      return;
    }
    
    return this.track(eventName, data);
  }
}

export const tracker = new CoreTracker();