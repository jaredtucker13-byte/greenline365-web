'use client';

import { motion } from 'framer-motion';

const clients = [
  'SALESFORCE',
  'HUBSPOT',
  'STRIPE',
  'ZENDESK',
  'SHOPIFY',
  'MAILCHIMP',
  'SLACK',
  'INTERCOM',
  'ASANA',
  'NOTION'
];

export default function LogoTicker() {
  return (
    <div className="relative overflow-hidden py-8">
      {/* Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-os-dark to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-os-dark to-transparent z-10" />
      
      {/* Scrolling Container */}
      <div className="flex">
        <motion.div
          className="flex gap-16"
          animate={{
            x: [0, -1920],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: 30,
              ease: 'linear',
            },
          }}
        >
          {/* First Set */}
          {clients.map((client, index) => (
            <div
              key={`first-${index}`}
              className="flex-shrink-0 text-white/30 hover:text-white transition-colors duration-300 font-display font-bold text-2xl tracking-wider whitespace-nowrap"
            >
              {client}
            </div>
          ))}
          {/* Duplicate for Seamless Loop */}
          {clients.map((client, index) => (
            <div
              key={`second-${index}`}
              className="flex-shrink-0 text-white/30 hover:text-white transition-colors duration-300 font-display font-bold text-2xl tracking-wider whitespace-nowrap"
            >
              {client}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
