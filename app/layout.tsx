import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Trading Simulator | Real-Time Market Data & Portfolio Simulation',
  description: 'Interactive real-time market trading simulator with live quotes, technical candlestick charts, indicator overlays, order execution, and portfolio analytics.',
  openGraph: {
    title: 'Trading Simulator | Real-Time Market Data & Portfolio Simulation',
    description: 'Interactive real-time market trading simulator with live quotes, technical candlestick charts, and order execution.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trading Simulator | Real-Time Market Data & Portfolio Simulation',
    description: 'Interactive real-time market trading simulator with live quotes, technical candlestick charts, and order execution.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
