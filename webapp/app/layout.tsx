import './globals.css';
import type { Metadata } from 'next';
import N8nChatWidget from './components/N8nChatWidget';

export const metadata: Metadata = {
  title: 'GreenLine365',
  description: 'Investor-Ready Website',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <div id="n8n-chat"></div>
        <N8nChatWidget />
      </body>
    </html>
  );
}