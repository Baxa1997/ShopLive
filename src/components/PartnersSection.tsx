'use client';

import { motion } from 'framer-motion';

const PARTNERS = [
  'Shopify', 'Amazon', 'Nike', 'Adidas', 'Sephora', 'Etsy', 'Zalo', 'Slack'
];

export default function PartnersSection() {
  return (
    <section className="py-12 bg-slate-50 border-y border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">
          Trusted by creators from
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {PARTNERS.map((partner, index) => (
            <motion.div 
              key={partner}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
              className="text-2xl font-bold font-heading text-slate-800 hover:text-emerald-600 transition-colors cursor-default"
            >
              {partner}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
