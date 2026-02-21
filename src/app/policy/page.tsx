'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, FileText, Scale, Cookie, ChevronRight } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';

export default function PolicyPage() {
  const [activeSection, setActiveSection] = useState('privacy');

  const sections = [
    { id: 'privacy', label: 'Privacy Policy', icon: Eye },
    { id: 'terms', label: 'Terms of Service', icon: Scale },
    { id: 'cookies', label: 'Cookie Policy', icon: Cookie },
    { id: 'security', label: 'Data Security', icon: Lock }
  ];

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-emerald-500/20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="h-24" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Sticky Sidebar */}
          <aside className="lg:w-80 shrink-0">
            <div className="sticky top-32 space-y-10">
              <div>
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 mb-8"
                >
                  <div className="p-2.5 bg-slate-900 rounded-2xl shadow-xl">
                    <Shield className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h1 className="text-3xl font-heading font-black tracking-tight text-slate-900">Legal Center</h1>
                </motion.div>
                
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id);
                        document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all ${
                        activeSection === section.id 
                          ? 'bg-white shadow-xl shadow-slate-200/50 text-slate-900 ring-1 ring-slate-200' 
                          : 'text-slate-500 hover:bg-white/50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <section.icon className={`w-5 h-5 transition-colors ${activeSection === section.id ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className="font-bold text-sm uppercase tracking-wider">{section.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${activeSection === section.id ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`} />
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-8 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <FileText className="w-24 h-24" />
                </div>
                <h3 className="text-lg font-bold mb-2 relative z-10">Need a summary?</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 relative z-10">We keep it simple: We never sell your data. We only process it to build your catalogs.</p>
                <a href="mailto:bahridnurullav@gmail.com" className="text-emerald-400 text-sm font-black underline hover:text-emerald-300">Contact Legal Team</a>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 max-w-3xl space-y-24 pb-40">
            {/* Privacy Section */}
            <section id="privacy" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="text-4xl font-heading font-black text-slate-900 mb-8 flex items-center gap-4">
                  <Eye className="w-8 h-8 text-emerald-500" />
                  Privacy Policy
                </h2>
                <div className="prose prose-slate prose-lg text-slate-600 leading-relaxed font-body">
                  <p>Our Privacy Policy highlights how we treat your data with transparency and respect. At ShopsReady, data integrity is paramount.</p>
                  <h3 className="text-slate-900 font-bold mt-10 mb-4">Data Collection</h3>
                  <p>We collect structural data identifiers from the files you upload (PDFs, CSVs, Excel) to enable our AI to map them correctly. We also collect basic profile information via Google OAuth to manage your history and pro subscriptions.</p>
                  <h3 className="text-slate-900 font-bold mt-10 mb-4">Data Usage</h3>
                  <p>We strictly use your data to generate the CSV/JSON artifacts you request. We do not use your supplier catalogs to train universal models, and we never share your specific business data with competitors.</p>
                </div>
              </motion.div>
            </section>

            {/* Terms Section */}
            <section id="terms" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="text-4xl font-heading font-black text-slate-900 mb-8 flex items-center gap-4">
                  <Scale className="w-8 h-8 text-emerald-500" />
                  Terms of Service
                </h2>
                <div className="prose prose-slate prose-lg text-slate-600 leading-relaxed font-body">
                  <p>By using ShopsReady, you agree to these legal terms. Please read them carefully.</p>
                  <ul className="space-y-4 list-none pl-0">
                    <li className="flex gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-600 text-xs font-black">01</div>
                      <p className="m-0">You maintain ownership of all original supplier documents uploaded to our servers.</p>
                    </li>
                    <li className="flex gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-600 text-xs font-black">02</div>
                      <p className="m-0">We provide the service as-is. While our AI is 99% accurate, users are responsible for final data verification before marketplace import.</p>
                    </li>
                    <li className="flex gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm transition-transform hover:-translate-y-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center text-emerald-600 text-xs font-black">03</div>
                      <p className="m-0">Abuse of the AI generation system through automated scrapers or malicious inputs will result in immediate termination.</p>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </section>

            {/* Cookie Policy Section */}
            <section id="cookies" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="text-4xl font-heading font-black text-slate-900 mb-8 flex items-center gap-4">
                  <Cookie className="w-8 h-8 text-emerald-500" />
                  Cookie Policy
                </h2>
                <div className="prose prose-slate prose-lg text-slate-600 leading-relaxed font-body">
                  <p>We use cookies and similar technologies to enhance your experience and ensure platform security.</p>
                  <h3 className="text-slate-900 font-bold mt-10 mb-4">Essential Cookies</h3>
                  <p>These are required for authentication (Google OAuth) and to keep your session active across tools. Disabling these will break the core functionality of the app.</p>
                  <h3 className="text-slate-900 font-bold mt-10 mb-4">Analytics (Optional)</h3>
                  <p>We use Vercel Analytics to understand how users move through the Generator to find and fix friction points. These do not store personally identifiable business information.</p>
                </div>
              </motion.div>
            </section>

            {/* Security Section */}
            <section id="security" className="scroll-mt-32">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="text-4xl font-heading font-black text-slate-900 mb-8 flex items-center gap-4">
                  <Lock className="w-8 h-8 text-emerald-500" />
                  Data Security
                </h2>
                <div className="prose prose-slate prose-lg text-slate-600 leading-relaxed font-body">
                  <p>We use enterprise-grade protocols to protect your business intelligence.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
                    <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
                      <h4 className="text-emerald-400 font-black mb-2 uppercase tracking-tight">Encryption</h4>
                      <p className="text-slate-400 text-sm m-0 leading-relaxed">AES-256 encryption at rest and TLS 1.3 in transit.</p>
                    </div>
                    <div className="p-8 bg-slate-900 rounded-[2rem] text-white">
                      <h4 className="text-emerald-400 font-black mb-2 uppercase tracking-tight">Isolation</h4>
                      <p className="text-slate-400 text-sm m-0 leading-relaxed">Processing happens in sandboxed ephemeral nodes.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>
          </main>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
