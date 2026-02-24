'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const tools = [
  {
    title: 'SEO Crawler',
    description: 'Greenline Pulse — scan any website for SEO gaps and opportunity signals.',
    href: '/greenline-hq/crawler',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    title: 'Audit & Distribution',
    description: 'Generate branded PDF audits and distribute via email or SMS.',
    href: '/greenline-hq/audit',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    gradient: 'from-yellow-400 to-amber-600',
  },
  {
    title: 'Website Builder',
    description: 'AI-powered website generation with vision analysis and section assembly.',
    href: '/greenline-hq/crawler',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    gradient: 'from-purple-500 to-pink-600',
  },
];

export default function GreenlineHQDashboard() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-14"
      >
        <h1 className="text-4xl font-bold text-white mb-3">Command Center</h1>
        <p className="text-white/50 text-lg">Internal tools for the Greenline365 operations team.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {tools.map((tool, i) => (
          <motion.div
            key={tool.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              href={tool.href}
              className="block group h-full p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-yellow-400/40 transition-all hover:bg-white/[0.06]"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform`}
              >
                {tool.icon}
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">{tool.title}</h2>
              <p className="text-sm text-white/50 leading-relaxed">{tool.description}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
