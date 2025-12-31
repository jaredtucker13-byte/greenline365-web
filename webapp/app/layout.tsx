import './globals.css'

export const metadata = {
  title: 'GreenLine365',
  description: 'Investor-Ready Website',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}