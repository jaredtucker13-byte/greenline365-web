'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const blogPosts = [
  {
    id: 1,
    title: 'The Future of AI-Powered Business Management',
    excerpt: 'How artificial intelligence is transforming the way small businesses operate and compete in 2026.',
    category: 'AI & Technology',
    date: 'Jan 5, 2026',
    readTime: '5 min read',
    image: null,
  },
  {
    id: 2,
    title: 'Local Marketing Strategies That Actually Work',
    excerpt: 'Proven tactics for leveraging local events and trends to drive foot traffic and engagement.',
    category: 'Marketing',
    date: 'Jan 3, 2026',
    readTime: '7 min read',
    image: null,
  },
  {
    id: 3,
    title: 'Automating Your Social Media Without Losing Authenticity',
    excerpt: 'Strike the perfect balance between efficiency and genuine connection with your audience.',
    category: 'Social Media',
    date: 'Dec 28, 2025',
    readTime: '6 min read',
    image: null,
  },
  {
    id: 4,
    title: 'Lead Management Best Practices for Service Businesses',
    excerpt: 'Turn more inquiries into paying customers with these proven lead nurturing strategies.',
    category: 'Sales',
    date: 'Dec 20, 2025',
    readTime: '8 min read',
    image: null,
  },
];

export default function BlogPage() {
  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            GreenLine365 <span className="text-emerald-400">Blog</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/60 max-w-2xl mx-auto"
          >
            Insights, tips, and strategies to help you grow your business with AI-powered tools.
          </motion.p>
        </div>

        {/* Coming Soon Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 mb-12 text-center"
        >
          <p className="text-emerald-400 font-semibold">📝 Blog launching soon!</p>
          <p className="text-white/60 text-sm mt-2">Subscribe to our newsletter to get notified when new posts are published.</p>
        </motion.div>

        {/* Blog Grid (Preview) */}
        <div className="grid md:grid-cols-2 gap-6">
          {blogPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition group cursor-pointer"
            >
              {/* Placeholder Image */}
              <div className="h-48 bg-gradient-to-br from-emerald-900/30 to-gray-900 flex items-center justify-center">
                <span className="text-6xl opacity-30">📰</span>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">
                    {post.category}
                  </span>
                  <span className="text-white/40 text-xs">{post.readTime}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition">
                  {post.title}
                </h3>
                
                <p className="text-white/60 text-sm mb-4">{post.excerpt}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-sm">{post.date}</span>
                  <span className="text-emerald-400 text-sm font-medium">Coming Soon →</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Newsletter CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <Link
            href="/newsletter"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition border border-white/20"
          >
            Subscribe to Newsletter
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
