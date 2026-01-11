'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/os';
import SEOBreadcrumbs from '@/app/components/SEOBreadcrumbs';

export default function AIContentCreationPage() {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      <SEOBreadcrumbs
        items={[
          { name: 'Home', url: '/' },
          { name: 'Features', url: '/features' },
          { name: 'AI Content Creation' },
        ]}
      />

      <main className="min-h-screen bg-os-dark relative">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-32 pb-20">
          <div className="absolute inset-0 bg-os-dark" />
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-neon-green-500/10 to-transparent blur-3xl" />
          
          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 glass-green rounded-full border border-neon-green-500/30">
                  <span className="w-2 h-2 bg-neon-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-neon-green-400 font-semibold tracking-wide">AI CONTENT ENGINE</span>
                </div>
                
                <h1 className="font-display font-bold text-white mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.1' }}>
                  AI-Powered Content Creation <span className="text-neon-green-500">at Scale</span>
                </h1>
                
                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  Create high-quality blog posts, social media content, and marketing copy in minutes. Our AI understands your brand voice and generates human-like content that engages your audience.
                </p>
                
                <div className="flex flex-wrap gap-4 mb-8">
                  <Button variant="primary" size="lg" onClick={() => setShowDemo(true)}>
                    Try Content Generator
                  </Button>
                  <Link href="/#booking">
                    <Button variant="secondary" size="lg">
                      Schedule Demo →
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: '10x', label: 'Faster Creation' },
                    { value: '85%', label: 'Time Saved' },
                    { value: '50+', label: 'Content Types' }
                  ].map((stat, i) => (
                    <div key={i} className="text-center">
                      <div className="text-3xl font-display font-bold text-neon-green-500">{stat.value}</div>
                      <div className="text-sm text-white/50 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="os-card p-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                      <div className="icon-glass">
                        <span className="text-xl">✨</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">Content Generator</div>
                        <div className="text-white/50 text-sm">AI-powered writing assistant</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-neon-green-500/20 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-white/80 text-sm">Blog posts (500-2000 words)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-neon-green-500/20 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-white/80 text-sm">Social media captions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-neon-green-500/20 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-white/80 text-sm">Email marketing copy</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-neon-green-500/20 flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-neon-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-white/80 text-sm">Product descriptions</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                How Does <span className="text-neon-green-500">AI Content Creation</span> Work?
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto text-lg">
                Simple, fast, and effective content generation in four steps
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { 
                  num: '01', 
                  title: 'Define Your Topic', 
                  desc: 'Tell our AI what you want to write about. Choose content type, tone, and target audience.',
                  icon: '🎯'
                },
                { 
                  num: '02', 
                  title: 'AI Generates Draft', 
                  desc: 'Our advanced AI creates a complete draft based on your requirements, industry trends, and your brand voice.',
                  icon: '🤖'
                },
                { 
                  num: '03', 
                  title: 'Review & Edit', 
                  desc: 'Fine-tune the content with our built-in editor. Add your personal touch and expertise.',
                  icon: '✏️'
                },
                { 
                  num: '04', 
                  title: 'Publish Everywhere', 
                  desc: 'One-click publishing to your blog, social media, email, and more. Schedule for optimal engagement.',
                  icon: '🚀'
                }
              ].map((step, i) => (
                <div key={i} className="os-card p-8 hover:border-neon-green-500/50 transition-all duration-300">
                  <div className="flex items-start gap-5">
                    <div className="icon-glass flex-shrink-0 text-2xl">
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-neon-green-500 text-xs font-bold tracking-wider">{step.num}</span>
                        <h3 className="text-white font-bold text-xl">{step.title}</h3>
                      </div>
                      <p className="text-white/70 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Why Choose Our <span className="text-neon-green-500">AI Content Engine</span>?
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: '⚡', 
                  title: 'Lightning Fast', 
                  desc: 'Generate a complete blog post in under 2 minutes. Scale your content production 10x without hiring writers.'
                },
                { 
                  icon: '🎨', 
                  title: 'Brand Voice Consistency', 
                  desc: 'AI learns your brand tone and style. Every piece of content sounds authentically you.'
                },
                { 
                  icon: '📊', 
                  title: 'SEO Optimized', 
                  desc: 'Built-in keyword research and optimization. Content is automatically structured for search engines and AI answer engines.'
                },
                { 
                  icon: '🌐', 
                  title: 'Multi-Platform', 
                  desc: 'Create content for blogs, social media, emails, and ads from a single interface.'
                },
                { 
                  icon: '🔄', 
                  title: 'Auto-Repurpose', 
                  desc: 'Turn one blog post into 10+ social posts, email snippets, and ad copy automatically.'
                },
                { 
                  icon: '📅', 
                  title: 'Smart Scheduling', 
                  desc: 'AI recommends the best times to publish based on your audience engagement patterns.'
                }
              ].map((benefit, i) => (
                <div key={i} className="os-card p-6 text-center hover:-translate-y-1 transition-all duration-300">
                  <div className="icon-glass mx-auto mb-4 text-2xl">
                    {benefit.icon}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 relative">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Frequently Asked <span className="text-neon-green-500">Questions</span>
              </h2>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  q: 'Can AI really create human-like content?',
                  a: 'Yes! Our AI is trained on millions of high-quality articles and uses advanced natural language processing. The content is indistinguishable from human writing and passes all AI detection tools.'
                },
                {
                  q: 'How does AI content creation save time?',
                  a: 'Instead of spending 3-4 hours writing a blog post, you can generate a complete draft in under 2 minutes. This gives you 85% more time to focus on strategy and business growth.'
                },
                {
                  q: 'Will AI-generated content rank on Google?',
                  a: 'Absolutely. Our AI creates SEO-optimized content with proper keyword integration, semantic relevance, and natural language patterns that search engines love.'
                },
                {
                  q: 'Can I customize the AI to match my brand voice?',
                  a: 'Yes! The AI learns from your existing content and adapts to your specific tone, style, and industry terminology. Every piece sounds authentically you.'
                }
              ].map((faq, i) => (
                <div key={i} className="os-card p-6">
                  <h3 className="text-white font-bold text-lg mb-3">{faq.q}</h3>
                  <p className="text-white/70 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
            <div className="os-card p-12 text-center">
              <h2 className="font-display font-bold text-white mb-4 text-3xl">
                Start Creating Content <span className="text-neon-green-500">10x Faster</span>
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                Join 500+ businesses using AI to scale their content production without sacrificing quality.
              </p>
              <Link href="/#booking">
                <Button variant="primary" size="lg">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
