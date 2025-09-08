// 所有埋点事件常量
export const EVENTS = {

  // 新增API相关事件
  AI_READING_ATTEMPT: 'ai_reading_attempt',
  AI_READING_SUCCESS: 'ai_reading_success', 
  AI_READING_FAILED: 'ai_reading_failed',
  LOCAL_FALLBACK_USED: 'local_fallback_used',
  API_TIMEOUT: 'api_timeout',
  API_ERROR: 'api_error',

  // 在 EVENTS 对象中添加
  EMAIL_PROVIDED: 'email_provided',
  FEEDBACK_PROVIDED: 'feedback_provided',
  EMAIL_SUBMIT_ATTEMPTED: 'email_submit_attempted',
  EMAIL_SUBMIT_SUCCESS: 'email_submit_success',
  EMAIL_SUBMIT_FAILED: 'email_submit_failed',

   // AI个性化追踪
  AI_PERSONALIZED_SUCCESS: 'ai_personalized_success',
  AI_PERSONALIZED_FAILED: 'ai_personalized_failed',


  // 会话事件
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  

  
  QUESTION_TYPE_SELECTED: 'question_type_selected',
  CUSTOM_QUESTION_ENTERED: 'custom_question_entered',

  // 新增问题相关事件
  CUSTOM_QUESTION_CLEARED: 'custom_question_cleared',
  QUESTION_INPUT_FOCUSED: 'question_input_focused',
  SPECIFIC_QUESTION_USED: 'specific_question_used',
  GENERIC_QUESTION_USED: 'generic_question_used',
  
  // 问题质量追踪
  QUESTION_QUALITY_HIGH: 'question_quality_high',
  QUESTION_QUALITY_MEDIUM: 'question_quality_medium',
  QUESTION_QUALITY_LOW: 'question_quality_low',
  
  // 抽卡流程事件
  CARD_SELECTION_START: 'card_selection_start',
  CARD_SELECTED: 'card_selected',
  CARDS_SELECTION_COMPLETE: 'cards_selection_complete',
  
  // 解读相关事件
  READING_GENERATED: 'reading_generated',
  READING_COMPLETED: 'reading_completed',
  READING_GENERATION_TIME: 'reading_generation_time',
  
  // 互动事件
  RATING_GIVEN: 'rating_given',
  SHARE_CLICKED: 'share_clicked',
  SHARE_COMPLETED: 'share_completed',
  
  // 付费意愿事件
  PAYMENT_BUTTON_CLICKED: 'payment_button_clicked',
  PAYMENT_INTENT_EXPRESSED: 'payment_intent_expressed',
  EMAIL_PROVIDED: 'email_provided',
  
  // 错误事件
  ERROR_OCCURRED: 'error_occurred'
};