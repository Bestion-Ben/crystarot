import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'Crystarot - AI Tarot Reading',
  description: 'Ancient Wisdom, Modern Insight',
};

export default function RootLayout({ children }) {
  // 直接从环境变量获取GA4测量ID
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  return (
    <html lang="en">
      <head>
        {/* GA4 配置脚本 */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  
                  gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_title: 'Crystarot - AI Tarot Reading',
                    page_location: window.location.href,
                    send_page_view: true,
                    // 增强电商功能
                    custom_map: {
                      'custom_parameter_1': 'question_type',
                      'custom_parameter_2': 'card_name', 
                      'custom_parameter_3': 'plan_type'
                    }
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}