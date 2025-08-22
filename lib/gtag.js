export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

// 检查GA4是否启用
export const isGAEnabled = () => {
  return (
    process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' && 
    GA_MEASUREMENT_ID && 
    typeof window !== 'undefined'
  );
};

// 发送页面浏览事件
export const pageview = (url) => {
  if (!isGAEnabled()) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_location: url,
  });
};

// 发送自定义事件
export const event = (action, parameters = {}) => {
  if (!isGAEnabled()) return;
  
  window.gtag('event', action, {
    ...parameters,
    // 自动添加时间戳
    timestamp: Date.now()
  });
};

// 塔罗专用事件函数
export const tarotEvents = {
  // 会话开始
  sessionStart: (data = {}) => {
    event('session_start', {
      engagement_time_msec: 1,
      ...data
    });
  },

  // 计划选择
  planSelected: (planId, data = {}) => {
    event('plan_selected', {
      plan_id: planId,
      currency: 'USD',
      value: planId === 'quick' ? 0 : (planId === 'deep' ? 2.99 : 4.99),
      ...data
    });
  },

  // 问题选择
  questionSelected: (questionType, data = {}) => {
    event('question_selected', {
      question_category: questionType,
      method: data.isCustom ? 'custom' : 'predefined',
      ...data
    });
  },

  // 卡片选择
  cardSelected: (cardName, data = {}) => {
    event('card_selected', {
      card_name: cardName,
      card_element: data.element,
      card_upright: data.upright,
      ...data
    });
  },

  // 解读完成（核心转化事件）
  readingCompleted: (data = {}) => {
    event('reading_completed', {
      currency: 'USD',
      value: data.planType === 'quick' ? 0 : (data.planType === 'deep' ? 2.99 : 4.99),
      card_name: data.cardName,
      question_category: data.questionType,
      reading_source: data.source, // 'ai' or 'local'
      reading_length: data.readingLength || 0,
      ...data
    });
  },

  // 用户评分
  ratingGiven: (rating, data = {}) => {
    event('rating_given', {
      rating: rating,
      satisfaction_level: rating >= 4 ? 'high' : (rating >= 3 ? 'medium' : 'low'),
      ...data
    });
  },

  // 分享完成
  shareCompleted: (method, data = {}) => {
    event('share', {
      method: method, // 'native_share', 'copy_link', etc.
      content_type: 'tarot_reading',
      ...data
    });
  },

  // 邮箱收集（付费意向）
  emailProvided: (planId, data = {}) => {
    event('email_provided', {
      plan_interest: planId,
      lead_value: planId === 'deep' ? 2.99 : 4.99,
      currency: 'USD',
      ...data
    });
  },

  // 错误事件
  errorOccurred: (errorType, data = {}) => {
    event('exception', {
      description: errorType,
      fatal: false,
      ...data
    });
  }
};
