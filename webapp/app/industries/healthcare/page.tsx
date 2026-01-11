'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/os';
import SEOBreadcrumbs from '@/app/components/SEOBreadcrumbs';

export default function HealthcarePage() {
  return (
    <>
      <SEOBreadcrumbs
        items={[
          { name: 'Home', url: '/' },
          { name: 'Industries', url: '/industries' },
          { name: 'Healthcare' },
        ]}
      />

      <main className="min-h-screen bg-os-dark relative">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-32 pb-20">
          <div className="absolute inset-0 bg-os-dark" />
          <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-neon-green-500/10 to-transparent blur-3xl" />
          
          <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 glass-green rounded-full border border-neon-green-500/30">
                  <span className="w-2 h-2 bg-neon-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-neon-green-400 font-semibold tracking-wide">FOR HEALTHCARE</span>
                </div>
                
                <h1 className="font-display font-bold text-white mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.1' }}>
                  More Patients, Less <span className="text-neon-green-500">Admin Burnout</span>
                </h1>
                
                <p className="text-white/70 text-lg mb-8 leading-relaxed">
                  HIPAA-compliant AI automation for doctors, dentists, therapists, and healthcare providers. 24/7 appointment booking, automated reminders, and patient intake that reduces no-shows by 75%.
                </p>
                
                <div className="flex flex-wrap gap-4 mb-8">
                  <Link href="/#booking">
                    <Button variant="primary" size="lg">
                      Reduce No-Shows Now
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
                    { value: '75%', label: 'Fewer No-Shows' },
                    { value: '24/7', label: 'Booking' },
                    { value: '+35%', label: 'Patient Volume' }
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
                        <span className="text-xl">🏥</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">Patient Scheduling</div>
                        <div className="text-white/50 text-sm">HIPAA-compliant system</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-neon-green-500/10 rounded-lg border border-neon-green-500/30">
                        <div className="text-neon-green-400 text-xs mb-1">✓ New Appointment</div>
                        <div className="text-white font-semibold">Dr. Chen - Tomorrow 10:00 AM</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-white/60 text-xs mb-1">Reminder Sent</div>
                        <div className="text-white font-semibold">15 patients confirmed via SMS</div>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-white/60 text-xs mb-1">This Week</div>
                        <div className="text-white font-semibold">No-show rate: 5% (down from 25%)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Healthcare Challenges */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                The <span className="text-red-400">Healthcare Scheduling</span> Crisis
              </h2>
              <p className="text-white/60 text-lg">Your staff spends more time on phones than caring for patients</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '📞', challenge: 'Phone Bottleneck', desc: 'Staff overwhelmed with booking calls during peak hours' },
                { icon: '👻', challenge: '25% No-Show Rate', desc: 'Empty appointment slots = lost revenue and wasted time' },
                { icon: '📋', challenge: 'Manual Intake', desc: 'Clipboards and paper forms slow down operations' },
                { icon: '⏰', challenge: 'After-Hours Calls', desc: 'Patients call nights/weekends, leaving voicemails you handle Monday' }
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
                HIPAA-Compliant <span className="text-neon-green-500">Automation</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: '🤖', 
                  title: '24/7 AI Booking', 
                  desc: 'Patients book appointments online anytime. AI handles insurance verification, checks eligibility, and collects copay info.',
                  features: ['Real-time availability', 'Insurance verification', 'Automated confirmations']
                },
                { 
                  icon: '📱', 
                  title: 'Smart Reminders', 
                  desc: 'Multi-channel reminders via SMS, email, and phone calls. Patients can confirm or reschedule with one tap.',
                  features: ['24hr & 1hr reminders', 'Easy rescheduling', 'Cancellation management']
                },
                { 
                  icon: '📝', 
                  title: 'Digital Intake Forms', 
                  desc: 'Patients complete health history, consent forms, and insurance info before arrival. Syncs with your EHR.',
                  features: ['HIPAA secure', 'EHR integration', 'E-signatures']
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
                Real Healthcare <span className="text-neon-green-500">Results</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  name: 'Valley Family Practice',
                  type: 'Primary Care (3 physicians)',
                  problem: '28% no-show rate costing $15K/month in lost revenue. Staff spent 20+ hours/week on phone.',
                  solution: 'AI booking + automated SMS reminders + digital intake forms',
                  result: 'No-shows dropped to 6%, saved 25 staff hours/week, added 120 patients/month capacity'
                },
                {
                  name: 'Bright Smiles Dental',
                  type: 'General Dentistry',
                  problem: 'Answering service for after-hours calls was expensive and patients still left voicemails',
                  solution: 'Implemented 24/7 AI booking system with real-time appointment availability',
                  result: 'Booked 40+ after-hours appointments/month, +$18K revenue, 100% patient satisfaction'
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

        {/* Healthcare-Specific Features */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Built for <span className="text-neon-green-500">Healthcare Compliance</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: 'HIPAA Compliant',
                  desc: 'SOC 2 Type II + HIPAA certified. All patient data encrypted, BAA included, regular security audits.',
                  icon: '🔒'
                },
                {
                  title: 'EHR Integration',
                  desc: 'Syncs with Epic, Cerner, Athenahealth, DrChrono, and 40+ other EHR systems.',
                  icon: '📊'
                },
                {
                  title: 'Insurance Verification',
                  desc: 'Real-time eligibility checks. Collect copay info before appointments to reduce billing issues.',
                  icon: '💳'
                },
                {
                  title: 'Telemedicine Ready',
                  desc: 'Book in-person and virtual visits. Generate secure video links automatically.',
                  icon: '📹'
                },
                {
                  title: 'Multi-Location Support',
                  desc: 'Manage appointments across multiple offices with provider-specific availability.',
                  icon: '🏭'
                },
                {
                  title: 'Patient Portal',
                  desc: 'Secure messaging, appointment history, test results, and bill pay in one place.',
                  icon: '📝'
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

        {/* By Specialty */}
        <section className="py-20 relative">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-white mb-3 text-4xl">
                Every <span className="text-neon-green-500">Specialty</span> Covered
              </h2>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { specialty: 'Primary Care', use: 'Annual physicals, sick visits, chronic care management' },
                { specialty: 'Dentistry', use: 'Cleanings, emergencies, orthodontic check-ins' },
                { specialty: 'Mental Health', use: 'Therapy sessions, psychiatry appointments, group sessions' },
                { specialty: 'Specialists', use: 'Referrals, follow-ups, pre-op consultations' }
              ].map((item, i) => (
                <div key={i} className="os-card p-6 text-center">
                  <h3 className="text-white font-bold text-lg mb-3">{item.specialty}</h3>
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
                Healthcare Provider <span className="text-neon-green-500">FAQs</span>
              </h2>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  q: 'Is this really HIPAA compliant?',
                  a: 'Yes. We are SOC 2 Type II certified and fully HIPAA compliant. We sign BAAs with all healthcare providers and undergo regular third-party security audits.'
                },
                {
                  q: 'Can patients book specific appointment types?',
                  a: 'Absolutely. Set up different appointment types (new patient, follow-up, urgent care, telemedicine) with custom durations, forms, and availability.'
                },
                {
                  q: 'How does insurance verification work?',
                  a: 'Real-time eligibility checks through Availity and other clearinghouses. Patients enter insurance info during booking, and the system verifies coverage instantly.'
                },
                {
                  q: 'What if a patient needs to reschedule?',
                  a: 'Patients can reschedule or cancel via the confirmation link sent in their reminder. Open slots automatically become available for new bookings.'
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
                See More Patients. <span className="text-neon-green-500">Reduce Burnout.</span>
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
                Join 250+ healthcare providers using AI to reduce no-shows and administrative burden.
              </p>
              <Link href="/#booking">
                <Button variant="primary" size="lg">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
