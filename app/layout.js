 
import './globals.css'

export const metadata = {
  title: 'ArcaneCards - AI Tarot Reading',
  description: 'Ancient Wisdom, Modern Insight',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}