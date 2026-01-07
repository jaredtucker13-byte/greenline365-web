import './globals.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/chatwidget';

export const metadata = {
  title: 'GreenLine365 - Your AI Planning Partner',
  description: 'AI-assisted planning and accountability partner. Stop guessing, start growing.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#050a08]">
        <Navbar />
        <main>{children}</main>
        <ChatWidget />
        <Footer />
      </body>
    </html>
  );
}
