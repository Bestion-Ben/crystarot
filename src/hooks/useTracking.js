import { useEffect, useCallback } from 'react';
import { tracker } from '../utils/tracking';
import { EVENTS } from '../constants/events';

export const useTracking = () => {
  const track = useCallback((eventName, data) => {
    tracker.track(eventName, data);
  }, []);

  // 页面访问追踪（更新为使用tracker的新方法）
  const trackPageView = useCallback((pageName, pageData = {}) => {
    tracker.trackPageView(pageName, pageData);
  }, []);

  // 用户行为追踪
  const trackUserAction = useCallback((action, data = {}) => {
    tracker.track(action, {
      timestamp: Date.now(),
      ...data
    });
  }, []);

  // 新增：转化追踪
  const trackConversion = useCallback((conversionType, value = 0) => {
    tracker.trackConversion(conversionType, value);
  }, []);

  return { 
    track, 
    trackPageView, 
    trackUserAction, 
    trackConversion 
  };
};