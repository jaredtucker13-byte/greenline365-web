import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatWidget from "./components/chatwidget"; // Your chat bubble

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar /> {/* Shows at the top */}
        <main>{children}</main> {/* Your actual page content */}
        <ChatWidget /> {/* The chat bubble */}
        <Footer /> {/* Shows at the bottom */}
      </body>
    </html>
  );
}