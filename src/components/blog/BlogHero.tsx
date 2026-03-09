'use client';

import { motion } from 'framer-motion';
import { BookOpen, TrendingUp } from 'lucide-react';

export default function BlogHero() {
  return (
    <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-100/30 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 font-medium text-sm mb-6 border border-emerald-200/60"
        >
          <BookOpen className="w-4 h-4" />
          <span>ShopsReady Blog</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-4xl md:text-6xl font-heading font-extrabold text-slate-900 tracking-tight mb-5 leading-[1.1]"
        >
          E-commerce Insights{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500">
            & Guides
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-body"
        >
          Expert tips on Shopify, Amazon, product data management, and scaling your e-commerce business.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center justify-center gap-6 mt-8 text-sm text-slate-400"
        >
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Updated weekly
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>Free expert knowledge</span>
        </motion.div>
      </div>
    </section>
  );
}
