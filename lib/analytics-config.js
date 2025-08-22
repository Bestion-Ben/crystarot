export const checkAnalyticsConfig = () => {
  const config = {
    ga4Enabled: !!process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
    ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
    analyticsEnabled: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    environment: process.env.NODE_ENV
  };

  console.log('📊 Analytics Configuration:', config);
  
  if (!config.ga4Enabled) {
    console.warn('⚠️ GA4 not configured. Add NEXT_PUBLIC_GA4_MEASUREMENT_ID to your environment variables.');
  }

  return config;
};

// 在开发环境中调用以验证配置
if (process.env.NODE_ENV === 'development') {
  checkAnalyticsConfig();
}