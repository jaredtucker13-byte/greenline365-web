import Link from "next/link";

export default function Footer() {
  return (
    <footer className="p-10 bg-gray-50 border-t mt-20 text-center">
      <div className="space-x-6 mb-4">
        <Link href="/waitlist" className="hover:underline">Join Waitlist</Link>
        <Link href="/newsletter" className="hover:underline">Newsletter</Link>
        <Link href="/support" className="hover:underline">Support</Link>
      </div>
      <p className="text-sm text-gray-500">© 2026 GreenLine365. All rights reserved.</p>
    </footer>
  );
}