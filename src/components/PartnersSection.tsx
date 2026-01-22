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
          Trusted by Sellers from
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-70 transition-all duration-500">
          {[
            { name: 'USA', flag: '🇺🇸', color: 'text-blue-600' },
            { name: 'Canada', flag: '🇨🇦', color: 'text-red-500' },
            { name: 'UK', flag: '🇬🇧', color: 'text-indigo-600' },
            { name: 'Europe', flag: '🇪🇺', color: 'text-amber-500' },
            { name: 'Asian Sellers', flag: '🌏', color: 'text-teal-600' }
          ].map((item, index) => (
            <motion.div 
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`flex items-center gap-2 text-xl md:text-2xl font-bold font-heading transition-all cursor-default group hover:scale-105`}
            >
              <span className="text-3xl">{item.flag}</span>
              <span className={`${item.color} grayscale-[0.5] group-hover:grayscale-0 transition-all`}>{item.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
