'use client';

import { useState } from 'react';
import Breadcrumbs from '@/app/components/Breadcrumbs';
import JsonLd from '@/app/components/JsonLd';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'What is GreenLine365?',
    answer:
      'GreenLine365 is Florida\'s trusted local business directory. We connect residents with verified businesses across every category — from home services and dining to professional experts and community resources. Every listing is verified, and every review comes from a real customer.',
  },
  {
    question: 'How do I list my business?',
    answer:
      'You can list your business for free by visiting our Register Business page. Simply provide your business name, category, and location. Basic listings are always free and include your contact info, description, and customer reviews.',
  },
  {
    question: 'How does the verification process work?',
    answer:
      'We verify businesses through a combination of public records checks, phone verification, and website validation. Businesses that complete verification receive a "Verified" badge and rank higher in search results. The process typically takes less than 24 hours.',
  },
  {
    question: 'Is it free to list my business?',
    answer:
      'Yes! Basic listings on GreenLine365 are completely free. This includes your business profile, customer reviews, and directory presence. We also offer Pro and Premium tiers with additional features like enhanced photos, analytics, and priority placement.',
  },
  {
    question: 'How do reviews work?',
    answer:
      'Customers can leave reviews and ratings on any business listing. We use a trust scoring system that weights reviews from verified customers more heavily. Business owners can respond to reviews from their dashboard. We actively filter fake reviews and bot submissions.',
  },
  {
    question: 'Can I claim an existing listing?',
    answer:
      'Yes! If your business is already in our directory (added by a customer or through our data partners), you can claim it for free. Visit the Claim Your Listing page, search for your business, and follow the verification steps to take ownership.',
  },
  {
    question: 'What areas does GreenLine365 cover?',
    answer:
      'GreenLine365 covers all of Florida — from Key West to Jacksonville, Tampa Bay to Miami, and every community in between. We\'re hyper-focused on Florida because we believe a deep local focus delivers better results than trying to cover the entire country.',
  },
  {
    question: 'How can I improve my listing\'s visibility?',
    answer:
      'There are several ways to boost your visibility: complete your profile with photos and a detailed description, encourage satisfied customers to leave reviews, respond to existing reviews, and consider upgrading to our Pro or Premium tiers for enhanced features and priority placement.',
  },
  {
    question: 'How do I contact GreenLine365?',
    answer:
      'You can reach us through our Contact page, email us at greenline365help@gmail.com, or use the chat widget on our site. We typically respond within 24 hours. For urgent business listing issues, our support team is available during business hours.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  name: 'FAQ — GreenLine365',
  description:
    'Frequently asked questions about GreenLine365, listing your business, and using the directory.',
  url: 'https://greenline365.com/community/faq',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://greenline365.com' },
      { '@type': 'ListItem', position: 2, name: 'Community', item: 'https://greenline365.com/community/claim' },
      { '@type': 'ListItem', position: 3, name: 'FAQ' },
    ],
  },
};

function AccordionItem({ faq, isOpen, onToggle }: { faq: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className={`rounded-[20px] border bg-white/[0.02] overflow-hidden transition-all duration-300 ${
        isOpen ? 'border-gold/30 bg-white/[0.04]' : 'border-white/10 hover:border-white/20'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left transition-all duration-300"
      >
        <span className="text-sm font-heading font-semibold text-white pr-4">{faq.question}</span>
        <svg
          className={`w-5 h-5 text-gold/60 flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="px-6 pb-6 text-sm text-white/50 leading-relaxed">{faq.answer}</p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div data-theme="community" className="min-h-screen bg-[#0A0A0A]">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <Breadcrumbs
            items={[
              { label: 'Community', href: '/community/claim' },
              { label: 'FAQ' },
            ]}
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-light text-white tracking-tight mt-8 mb-4">
            Frequently Asked{' '}
            <span className="text-gradient-gold font-semibold">Questions</span>
          </h1>
          <p className="text-lg text-white/50 max-w-2xl font-body leading-relaxed">
            Everything you need to know about GreenLine365, listing your business, and using the
            directory.
          </p>
        </div>
      </section>

      {/* Accordion */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
