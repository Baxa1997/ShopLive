'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Zap, Shield, ArrowRight, Target, Sparkles, Globe } from 'lucide-react';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';

export default function AboutPage() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: "easeOut" } 
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-500/20">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold tracking-wider uppercase mb-8 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Our Origin Story</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-8xl font-heading font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 via-slate-900 to-slate-500"
          >
            Pioneering the <br />
            <span className="text-emerald-600">Autonomous Catalog.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-body font-light"
          >
            We didn&apos;t just build a tool; we engineered a new standard for e-commerce efficiency. ShopsReady is the bridge between raw supplier data and high-velocity commerce.
          </motion.p>
        </div>
      </section>

      {/* Grid Features */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 group">
            <div className="h-full bg-white border-2 border-slate-200/60 rounded-[2.5rem] p-10 relative overflow-hidden transition-all hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target className="w-40 h-40 text-emerald-500" />
              </div>
              <div className="relative z-10 max-w-lg">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100">
                  <Target className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-heading font-black mb-4 text-slate-900">Precision Engineering</h3>
                <p className="text-lg text-slate-500 leading-relaxed font-body font-medium">
                  Our core extraction engine doesn&apos;t just read text; it understands the structural intent of supplier documents. From multi-page recursive tables to nested variant logic, we capture every data point with 99.9% accuracy.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="group">
            <div className="h-full bg-white border-2 border-slate-200/60 rounded-[2.5rem] p-10 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-8 border border-amber-100">
                <Zap className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-2xl font-heading font-black mb-4 text-slate-900">Real-time Velocity</h3>
              <p className="text-slate-500 leading-relaxed text-lg font-body font-medium">
                Time is the only currency that matters in e-commerce. We cut catalog onboarding from days to seconds, allowing you to react to market trends before they pass.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="group">
            <div className="h-full bg-white border-2 border-slate-200/60 rounded-[2.5rem] p-10 hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-8 border border-blue-100">
                <Globe className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-heading font-black mb-4 text-slate-900">Global Reach</h3>
              <p className="text-slate-500 leading-relaxed text-lg font-body font-medium">
                Designed for international commerce, our AI handles multi-language supplier catalogs and global currency formats flawlessly.
              </p>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 group">
            <div className="h-full bg-white border-2 border-slate-200/60 rounded-[2.5rem] p-10 relative overflow-hidden hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all">
              <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                <Shield className="w-64 h-64 text-emerald-500" />
              </div>
              <div className="relative z-10 max-w-xl">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100">
                  <Shield className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-3xl font-heading font-black mb-4 text-slate-900">Enterprise Integrity</h3>
                <p className="text-lg text-slate-500 leading-relaxed font-body font-medium">
                  Data security isn&apos;t a feature; it&apos;s our foundation. We use multi-layered encryption and isolated processing environments to ensure your supplier relationship data remains strictly yours.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-4xl md:text-6xl font-heading font-black mb-10 tracking-tight text-slate-900">
            Stop copy-pasting. <br />
            <span className="text-emerald-600 underline decoration-emerald-500/20 underline-offset-8">Start scaling.</span>
          </h2>
          <p className="text-xl text-slate-500 leading-relaxed mb-12 font-body font-light">
            We believe that entrepreneurs should focus on strategy, brand, and customer experience—not formatting CSVs. ShopsReady is our contribution to a more automated, intelligent future for global trade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/tools/multi-importer"
              className="group px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-emerald-600 hover:shadow-[0_20px_40px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-3"
            >
              Launch Architect
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  );
}
