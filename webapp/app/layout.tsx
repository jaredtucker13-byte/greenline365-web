import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/chatwidget';
import { headers } from 'next/headers';

export const metadata = {
  title: 'GreenLine365 - Your AI Planning Partner',
  description: 'AI-assisted planning and accountability partner. Stop guessing, start growing.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Get the current path from headers to conditionally render navbar/footer
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  
  // Hide navbar and footer for dashboard routes
  const isDashboard = pathname.startsWith('/admin-v2') || pathname.startsWith('/dashboard') || pathname.startsWith('/god-mode');
  
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050a08]">
        {!isDashboard && <Navbar />}
        <main>{children}</main>
        <ChatWidget />
        {!isDashboard && <Footer />}
      </body>
    </html>
  );
}
