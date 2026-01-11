'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/os';
import SEOBreadcrumbs from '@/app/components/SEOBreadcrumbs';

export default function ProfessionalServicesPage() {
  return (
    <>
      <SEOBreadcrumbs
        items={[
          { name: 'Home', url: '/' },
          { name: 'Industries', url: '/industries' },
          { name: 'Professional Services' },
        ]}
      />

      <main className="min-h-screen bg-os-dark relative">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-32 pb-20">
          <div className="absolute inset-0 bg-os-dark" />
          <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-neon-green-500/10 to-transparent blur-3xl" />
          
          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 glass-green rounded-full border border-neon-green-500/30">
                  <span className="w-2 h-2 bg-neon-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-neon-green-400 font-semibold tracking-wide">FOR PROFESSIONALS</span>
                </div>
                
                <h1 className="font-display font-bold text-white mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.1' }}>
                  Focus on Clients, Not <span className="text-neon-green-500">Admin Work</span>
                </h1>
                
                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  AI-powered automation for lawyers, accountants, consultants, and professional service providers. Automated client onboarding, scheduling, and follow-ups that scale your practice.
                </p>
                
                <div className="flex flex-wrap gap-4 mb-8">
                  <Link href="/#booking">
                    <Button variant="primary" size="lg">
                      Automate Your Practice
                    </Button>
                  </Link>
                  <Link href="/features/automated-scheduling">
                    <Button variant="secondary" size="lg">
                      See How It Works →
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { value: '20hrs', label: 'Saved/Week' },
                    { value: '+50%', label: 'More Clients' },
                    { value: '24/7', label: 'Availability' }
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
                        <span className="text-xl">💼</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">Client Management</div>
                        <div className="text-white/50 text-sm">Automated workflows</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-neon-green-500/10 rounded-lg border border-neon-green-500/30">
                        <div className="text-neon-green-400 text-xs mb-1">✓ New Client</div>
                        <div className="text-white font-semibold">Sarah M. - Initial Consultation Scheduled</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-white/60 text-xs mb-1">Follow-up Reminder</div>
                        <div className="text-white font-semibold">3 clients need quarterly check-ins</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-white/60 text-xs mb-1">This Week</div>
                        <div className="text-white font-semibold">12 consultations booked, 90% capacity</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Professional Challenges */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                The <span className="text-red-400">Time Drain</span> Problem
              </h2>
              <p className="text-white/60 text-lg">Your expertise is valuable. Admin work is not.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '📞', challenge: 'Phone Tag', desc: 'Back-and-forth scheduling wastes 5+ hours per week' },
                { icon: '📧', challenge: 'Email Overload', desc: 'Repetitive client questions steal billable time' },
                { icon: '📋', challenge: 'Manual Intake', desc: 'New client paperwork and onboarding is tedious' },
                { icon: '🔄', challenge: 'Follow-ups', desc: 'Forgetting to check in with clients hurts retention' }
              ].map((item, i) => (
                <div key={i} className="os-card p-6 text-center">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{item.challenge}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Automate Everything Except <span className="text-neon-green-500">Your Expertise</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: '🤖', 
                  title: 'AI Client Intake', 
                  desc: 'New clients schedule consultations, fill intake forms, and receive welcome packets automatically. Zero manual work.',
                  features: ['Automated scheduling', 'Digital intake forms', 'Document collection']
                },
                { 
                  icon: '📅', 
                  title: 'Smart Calendar Management', 
                  desc: 'AI handles meeting requests, reschedules conflicts, and sends reminders. Syncs with Google/Outlook.',
                  features: ['Buffer time management', 'No double bookings', 'SMS reminders']
                },
                { 
                  icon: '💬', 
                  title: 'Client Communication Hub', 
                  desc: 'Automated check-ins, milestone reminders, and follow-up sequences keep clients engaged.',
                  features: ['Scheduled follow-ups', 'Status updates', 'Review requests']
                }
              ].map((solution, i) => (
                <div key={i} className="os-card p-8 hover:-translate-y-1 transition-all duration-300">
                  <div className="icon-glass mb-4 text-2xl">
                    {solution.icon}
                  </div>
                  <h3 className="text-white font-bold text-xl mb-3">{solution.title}</h3>
                  <p className="text-white/70 mb-4 leading-relaxed">{solution.desc}</p>
                  <div className="space-y-2">
                    {solution.features.map((feature, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-neon-green-500 rounded-full" />
                        <span className="text-white/60 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                How Professionals <span className="text-neon-green-500">Scale Up</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  name: 'Martinez Law Firm',
                  type: 'Immigration Attorney',
                  problem: 'Spending 15 hours/week on scheduling and client intake instead of casework',
                  solution: 'Implemented AI booking + automated intake forms + follow-up sequences',
                  result: 'Saved 18 hours/week, took on 40% more clients, 5-star reviews increased 200%'
                },
                {
                  name: 'Summit Financial Advisors',
                  type: 'Financial Planning',
                  problem: 'Missing quarterly check-ins with clients, leading to churn and lost referrals',
                  solution: 'Automated quarterly review reminders + milestone tracking + referral requests',
                  result: '95% client retention (up from 70%), +60% referral rate, $500K new AUM'
                }
              ].map((story, i) => (
                <div key={i} className="os-card p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-neon-green-500/20 border border-neon-green-500/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-neon-green-400 font-bold text-lg">{i + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">{story.name}</h3>
                      <div className="text-white/50 text-sm">{story.type}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-red-400/80 text-xs font-semibold mb-1">❌ PROBLEM</div>
                      <p className="text-white/70 text-sm">{story.problem}</p>
                    </div>
                    <div>
                      <div className="text-neon-green-400/80 text-xs font-semibold mb-1">✓ SOLUTION</div>
                      <p className="text-white/70 text-sm">{story.solution}</p>
                    </div>
                    <div className="pt-3 border-t border-white/10">
                      <div className="text-neon-green-400 font-bold">{story.result}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Professional-Specific Features */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Built for <span className="text-neon-green-500">Professional Practices</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: 'Secure Document Management',
                  desc: 'Client portal for secure document sharing. HIPAA/SOC2 compliant with encrypted storage.',
                  icon: '🔒'
                },
                {
                  title: 'Conflict Checking',
                  desc: 'Automatic conflict-of-interest screening for law firms before booking consultations.',
                  icon: '⚖️'
                },
                {
                  title: 'Billing Integration',
                  desc: 'Sync with QuickBooks, FreshBooks, and major practice management software.',
                  icon: '💰'
                },
                {
                  title: 'Referral Tracking',
                  desc: 'Track referral sources and automate thank-you messages to referring clients and partners.',
                  icon: '🤝'
                },
                {
                  title: 'Consultation Types',
                  desc: 'Different booking flows for free consultations, strategy sessions, and follow-ups.',
                  icon: '📊'
                },
                {
                  title: 'Client Milestones',
                  desc: 'Automated celebration emails for case wins, project completions, and anniversaries.',
                  icon: '🎉'
                }
              ].map((feature, i) => (
                <div key={i} className="os-card p-6 flex gap-4">
                  <div className="icon-glass flex-shrink-0 text-2xl">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* By Profession */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Tailored for <span className="text-neon-green-500">Your Profession</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { profession: 'Lawyers', use: 'Case intake, conflict checks, court date reminders' },
                { profession: 'Accountants', use: 'Tax season scheduling, quarterly reviews, document collection' },
                { profession: 'Consultants', use: 'Discovery calls, strategy sessions, project milestone tracking' },
                { profession: 'Financial Advisors', use: 'Portfolio reviews, market update alerts, compliance documentation' }
              ].map((item, i) => (
                <div key={i} className="os-card p-6 text-center">
                  <h3 className="text-white font-bold text-lg mb-3">{item.profession}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{item.use}</p>
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
                Professional <span className="text-neon-green-500">FAQs</span>
              </h2>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  q: 'Is this secure enough for sensitive client information?',
                  a: 'Yes. We are SOC2 Type II certified and HIPAA compliant. All data is encrypted at rest and in transit. Client portals use bank-level security.'
                },
                {
                  q: 'Can it integrate with my practice management software?',
                  a: 'We integrate with Clio, MyCase, PracticeOps, QuickBooks, FreshBooks, and 30+ other platforms commonly used by professional service providers.'
                },
                {
                  q: 'What if I have multiple service types?',
                  a: 'You can create different booking flows for free consultations, paid strategy sessions, follow-ups, and any other service type with custom intake forms for each.'
                },
                {
                  q: 'How much time does this actually save?',
                  a: 'On average, professionals save 15-20 hours per week on scheduling, client intake, and follow-up tasks. That is 800+ billable hours per year.'
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

        {/* CTA */}
        <section className="py-20 relative">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
            <div className="os-card p-12 text-center">
              <h2 className="font-display font-bold text-white mb-4 text-3xl">
                Bill More Hours. <span className="text-neon-green-500">Work Less.</span>
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                Join 300+ professional service providers using AI to scale their practices.
              </p>
              <Link href="/#booking">
                <Button variant="primary" size="lg">
                  Start Automating Today
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
