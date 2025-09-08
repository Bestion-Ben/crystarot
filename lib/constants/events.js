// ===== 核心事件常量 - 只保留8个关键业务指标 =====
export const EVENTS = {
  // 1. 访问人数
  SESSION_START: 'session_start',
  
  // 2. AI解读成功  
  AI_READING_SUCCESS: 'ai_reading_success',
  
  // 3. AI解读失败
  AI_READING_FAILED: 'ai_reading_failed',
  
  // 4. 解读生成耗时
  READING_GENERATION_TIME: 'reading_generation_time',
  
  // 5. 分享数
  SHARE_COMPLETED: 'share_completed',
  
  // 6. 评分
  RATING_GIVEN: 'rating_given',
  
  // 7. 邮箱收集完成
  EMAIL_PROVIDED: 'email_provided',
  
  // 8. 完成率
  READING_COMPLETED: 'reading_completed'
};