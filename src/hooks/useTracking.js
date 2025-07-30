import { useEffect, useCallback } from 'react';
import { enhancedTracker } from '../utils/enhanced-tracking';  // ✅ 改为双轨追踪
import { EVENTS } from '../constants/events';

export const useTracking = () => {
  
  // 基础追踪方法 - 使用增强版tracker
  const track = useCallback(async (eventName, data) => {
    await enhancedTracker.track(eventName, data);
  }, []);

  // 页面访问追踪
  const trackPageView = useCallback(async (pageName, pageData = {}) => {
    await enhancedTracker.trackPageView(pageName, pageData);
  }, []);

  // 用户行为追踪
  const trackUserAction = useCallback(async (action, data = {}) => {
    await enhancedTracker.track(action, {
      timestamp: Date.now(),
      ...data
    });
  }, []);

  // 转化追踪
  const trackConversion = useCallback(async (conversionType, value = 0, additionalData = {}) => {
    await enhancedTracker.trackConversion(conversionType, value, additionalData);
  }, []);

  // 业务专用追踪方法们

  // 套餐选择追踪
  const trackPlanSelection = useCallback(async (planData) => {
    await enhancedTracker.track(EVENTS.PLAN_SELECTED, {
      plan_id: planData.id,
      plan_type: planData.id,
      plan_price: planData.price,
      plan_cards: planData.cards,
      selection_time: Date.now(),
      ...planData
    });
  }, []);

  // 问题选择追踪
  const trackQuestionSelection = useCallback(async (questionData) => {
    await enhancedTracker.track(EVENTS.QUESTION_TYPE_SELECTED, {
      question_category: questionData.id,
      question_text: questionData.question,
      question_type: questionData.id,
      ...questionData
    });
  }, []);

  // 卡牌选择追踪
  const trackCardSelection = useCallback(async (cardData, selectionContext = {}) => {
    await enhancedTracker.track(EVENTS.CARD_SELECTED, {
      card_name: cardData.name,
      card_id: cardData.id,
      card_element: cardData.element,
      card_upright: cardData.upright,
      card_meaning: cardData.meaning,
      selection_order: selectionContext.order || 1,
      total_required: selectionContext.totalRequired || 1,
      ...selectionContext
    });
  }, []);

  // 解读完成追踪（重要业务事件）
  const trackReadingComplete = useCallback(async (readingData, context = {}) => {
    await enhancedTracker.trackReadingComplete(
      readingData.reading,
      readingData.cards,
      context.question
    );
  }, []);

  // 用户评分追踪
  const trackRating = useCallback(async (rating, context = {}) => {
    await enhancedTracker.track(EVENTS.RATING_GIVEN, {
      rating: rating,
      user_rating: rating,
      time_to_rate: context.timeToRate || 0,
      plan_type: context.planType,
      card_name: context.cardName,
      question_category: context.questionCategory,
      satisfaction_level: rating >= 4 ? 'high' : rating >= 3 ? 'medium' : 'low',
      ...context
    });
  }, []);

  // 邮箱收集追踪（关键转化事件）
  const trackEmailCollection = useCallback(async (email, context = {}) => {
    await enhancedTracker.trackEmailCollection(email, {
      source: context.source || 'unknown',
      plan_interest: context.planId ? `${context.planId}_reading` : '',
      collection_method: context.method || 'form_input',
      user_rating: context.userRating || 0,
      completed_free_reading: context.completedFreeReading || false,
      ...context
    });
  }, []);

  // 分享行为追踪
  const trackShare = useCallback(async (shareData) => {
    await enhancedTracker.track(EVENTS.SHARE_CLICKED, {
      share_method: shareData.method || 'unknown',
      share_content: shareData.content || 'reading_result',
      plan_type: shareData.planType,
      user_rating: shareData.userRating,
      card_name: shareData.cardName
    });
  }, []);

  // 分享完成追踪
  const trackShareComplete = useCallback(async (shareData) => {
    await enhancedTracker.track(EVENTS.SHARE_COMPLETED, {
      share_method: shareData.method,
      success: shareData.success,
      share_platform: shareData.platform || 'unknown',
      ...shareData
    });
  }, []);

  // 付费意愿追踪（重要转化信号）
  const trackPaymentIntent = useCallback(async (intentData) => {
    await enhancedTracker.track(EVENTS.PAYMENT_INTENT_EXPRESSED, {
      plan_id: intentData.planId,
      plan_price: intentData.planPrice,
      payment_intent_level: intentData.level || 'interested',
      user_journey_stage: intentData.stage || 'unknown',
      completed_free_reading: intentData.completedFreeReading || false,
      user_rating: intentData.userRating || 0,
      click_context: intentData.context || 'unknown',
      ...intentData
    });
  }, []);

  // 付费按钮点击追踪
  const trackPaymentButtonClick = useCallback(async (buttonData) => {
    await enhancedTracker.track(EVENTS.PAYMENT_BUTTON_CLICKED, {
      plan_id: buttonData.planId,
      plan_price: buttonData.planPrice,
      button_location: buttonData.location || 'unknown',
      user_rating: buttonData.userRating || 0,
      time_from_start: buttonData.timeFromStart || 0,
      ...buttonData
    });
  }, []);

  // 错误追踪
  const trackError = useCallback(async (errorData) => {
    await enhancedTracker.track(EVENTS.ERROR_OCCURRED, {
      error_type: errorData.type || 'unknown',
      error_message: errorData.message || '',
      error_context: errorData.context || '',
      user_action: errorData.userAction || '',
      ...errorData
    });
  }, []);

  // 会话结束追踪
  const trackSessionEnd = useCallback(async (sessionData = {}) => {
    await enhancedTracker.track(EVENTS.SESSION_END, {
      session_duration: sessionData.duration || 0,
      pages_visited: sessionData.pagesVisited || [],
      completed_reading: sessionData.completedReading || false,
      provided_email: sessionData.providedEmail || false,
      user_rating: sessionData.userRating || 0,
      final_page: sessionData.finalPage || 'unknown',
      ...sessionData
    });
  }, []);

  // 页面卸载时的自动追踪
  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionSummary = enhancedTracker.getSessionSummary();
      trackSessionEnd({
        duration: sessionSummary.uptime,
        unexpected_exit: true
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      trackSessionEnd({
        duration: Date.now() - enhancedTracker.sessionStartTime,
        component_unmount: true
      });
    };
  }, [trackSessionEnd]);

  return { 
    // 基础方法
    track, 
    trackPageView, 
    trackUserAction, 
    trackConversion,
    
    // 业务专用方法 - 这些是关键的！
    trackPlanSelection,
    trackQuestionSelection,
    trackCardSelection,
    trackReadingComplete,
    trackRating,
    trackEmailCollection,
    trackShare,
    trackShareComplete,
    trackPaymentIntent,
    trackPaymentButtonClick,
    trackError,
    trackSessionEnd
  };
};