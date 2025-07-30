import { useEffect, useCallback } from 'react';
import { tracker } from '../utils/tracking';
import { EVENTS } from '../constants/events';

export const useTracking = () => {
  const track = useCallback((eventName, data) => {
    tracker.track(eventName, data);
  }, []);

  // 页面访问追踪
  const trackPageView = useCallback((pageName, pageData = {}) => {
    track(EVENTS.PAGE_VIEW, {
      page: pageName,
      ...pageData
    });
  }, [track]);

  // 用户行为追踪
  const trackUserAction = useCallback((action, data = {}) => {
    track(action, {
      timestamp: Date.now(),
      ...data
    });
  }, [track]);

  return { track, trackPageView, trackUserAction };
};