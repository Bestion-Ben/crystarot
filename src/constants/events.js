// 所有埋点事件常量
export const EVENTS = {
  // 会话事件
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',
  
  // 页面流转事件
  PAGE_VIEW: 'page_view',
  PAGE_EXIT: 'page_exit',
  
  // 用户选择事件
  PLAN_SELECTED: 'plan_selected',
  PLAN_CLICKED: 'plan_clicked',
  QUESTION_TYPE_SELECTED: 'question_type_selected',
  CUSTOM_QUESTION_ENTERED: 'custom_question_entered',
  
  // 抽卡流程事件
  CARD_SELECTION_START: 'card_selection_start',
  CARD_SELECTED: 'card_selected',
  CARDS_SELECTION_COMPLETE: 'cards_selection_complete',
  
  // 解读相关事件
  READING_GENERATED: 'reading_generated',
  READING_COMPLETED: 'reading_completed',
  
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