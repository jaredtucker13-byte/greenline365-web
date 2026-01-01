import "./globals.css";
import type { Metadata } from "next";
import ChatWidget from "../components/chatwidget";

export const metadata: Metadata = {
  title: "GreenLine365",
  description: "Investor-Ready Website",
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
        <ChatWidget />
      </body>
    </html>
  );
}