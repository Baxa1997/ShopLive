'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Package } from 'lucide-react';

import MagicTextTransform from '@/components/MagicTextTransform';

export default function LandingHero() {
  return (
    <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[90vh] flex flex-col justify-center">

      <MagicTextTransform />

      <nav className="absolute top-0 left-0 w-full p-6 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">

            <div className="flex items-center gap-2">
                 <div className="bg-white/80 p-2 rounded-lg backdrop-blur-md border border-emerald-500/10 shadow-sm">
                    <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-heading font-bold text-xl text-slate-900 tracking-tight">ShopsReady</span>
            </div>

        </div>
      </nav>


      <div className="max-w-6xl mx-auto text-center relative z-10 mb-2">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/5 text-emerald-700 font-medium text-sm mb-2 border border-emerald-500/10 backdrop-blur-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Tools Added Weekly</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-xl md:text-6xl font-heading font-extrabold text-slate-900 tracking-tight mb-4 leading-[1.1]"
        >
          ShopsReady: Advanced <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-orange-500">
            PDF to CSV for E-commerce
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto mb-10 leading-relaxed font-body"
        >
          Automatically map supplier PDFs to <strong>Official 2026 Shopify & Amazon Taxonomies</strong>. No manual cleanup. Just high-integrity, import-ready data.
        </motion.p>
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3, duration: 0.5 }}
           className="flex justify-center"
        >
            <Link 
              href="/tools/multi-importer" 
              className="group inline-flex items-center justify-center px-12 py-5 text-xl font-black text-white transition-all duration-300 bg-slate-900 rounded-2xl hover:bg-emerald-600 hover:shadow-2xl hover:shadow-emerald-500/20 transform hover:-translate-y-1"
            >
              Launch Marketplace Architect
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
        </motion.div>
      </div>
    </section>
  );
}
