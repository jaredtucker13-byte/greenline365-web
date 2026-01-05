import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-6 bg-white border-b">
      <div className="text-xl font-bold text-green-600">GreenLine365</div>
      <div className="space-x-4">
        <Link href="/">Home</Link>
        <Link href="/about">About</Link>
        <Link href="/pricing">Pricing</Link>
        <Link href="/support">Support</Link>
      </div>
    </nav>
  );
}