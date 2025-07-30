import { tracker as originalTracker } from './tracking';

class EnhancedTracker {
  constructor() {
    this.ga4Tracker = originalTracker;
    this.sheetsBuffer = [];
    this.criticalEvents = [
      'email_provided',
      'plan_selected', 
      'reading_completed',
      'rating_given',
      'payment_intent_expressed'
    ];
  }

  async track(eventName, eventData = {}) {
    // GA4 追踪（所有事件）
    this.ga4Tracker.track(eventName, this.cleanForGA4(eventData));
    
    // Google Sheets 追踪（关键事件）
    if (this.shouldSendToSheets(eventName, eventData)) {
      await this.sendToSheets(eventName, eventData);
    }
  }

  shouldSendToSheets(eventName, eventData) {
    return (
      this.criticalEvents.includes(eventName) ||
      eventData.email ||
      eventData.question_text ||
      eventData.ai_reading ||
      eventData.detailed_feedback
    );
  }

  async sendToSheets(eventName, eventData) {
    try {
      const sheetData = this.formatForSheets(eventName, eventData);
      
      const response = await fetch('/api/google-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: sheetData,
          sheet_name: 'User_Interactions'
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Sheets tracking failed:', result.error);
      }
    } catch (error) {
      console.error('Sheets API error:', error);
      // 静默失败，不影响用户体验
    }
  }

  formatForSheets(eventName, eventData) {
    return {
      timestamp: new Date().toISOString(),
      session_id: this.ga4Tracker.sessionId,
      event_name: eventName,
      email: eventData.email || '',
      question_text: eventData.question_text || eventData.full_question || '',
      question_category: eventData.question_category || eventData.questionType || '',
      selected_plan: eventData.plan_id || eventData.planType || '',
      selected_card: eventData.card_name || eventData.cardName || '',
      card_orientation: eventData.card_upright ? 'upright' : 'reversed',
      ai_reading: eventData.ai_reading || eventData.reading_content || '',
      user_rating: eventData.rating || eventData.userRating || 0,
      user_feedback: eventData.feedback || eventData.detailed_feedback || '',
      plan_interest: eventData.plan_interest || '',
      utm_source: this.getUTMSource(),
      device_type: this.ga4Tracker.getDeviceInfo().isMobile ? 'mobile' : 'desktop',
      location: 'Singapore', // 你的用户位置
      notes: eventData.notes || ''
    };
  }

  cleanForGA4(eventData) {
    // 移除敏感数据，只保留分析需要的信息
    const { email, question_text, ai_reading, ...cleanData } = eventData;
    return cleanData;
  }

  getUTMSource() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('utm_source') || 
           urlParams.get('source') || 
           document.referrer || 
           'direct';
  }
}

export const enhancedTracker = new EnhancedTracker();