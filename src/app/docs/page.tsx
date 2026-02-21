'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, Upload, Settings, Download, Search, CheckCircle2, Terminal, Cpu, FileText, ChevronRight } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState('getting-started');

  const steps = [
    {
      id: 'upload',
      title: 'Phase 01: Intelligent Ingestion',
      icon: Upload,
      color: 'bg-emerald-500',
      content: 'Upload your supplier documents. Our AI supports OCR and structural depth for complex PDFs, Excel sheets, and raw text-heavy catalogs. Simply drag and drop into the architect node.',
      code: '$ shopsready upload --file supplier_catalog_v2.pdf\nAnalyzing structure... OK\nDetecting 243 product entries...'
    },
    {
      id: 'config',
      title: 'Phase 02: Structural Mapping',
      icon: Settings,
      color: 'bg-blue-500',
      content: 'Review the automated taxonomy mapping. Our system aligns your supplier data with native Shopify and Amazon 2026 schemas. Adjust pricing markups and data transforms in real-time.',
      code: '{\n  "mapping": "OFFICIAL_SHOPIFY_2026",\n  "markup": "2.5x",\n  "integrity_check": "PASSED"\n}'
    },
    {
      id: 'extract',
      title: 'Phase 03: High-Fidelity Export',
      icon: Download,
      color: 'bg-purple-500',
      content: 'Generate your final artifacts. The core engine compiles all processed data into a single, high-integrity CSV or JSON file ready for immediate marketplace deployment.',
      code: 'Generating artifacts...\nOutput: final_shopify_import.csv (1.2MB)\nReady for sync.'
    }
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-emerald-500/20">
      {/* Decorative Grid Background */}
      <div className="fixed inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Header Space for Fixed Navbar */}
      <div className="h-24" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col lg:flex-row gap-12">
        {/* Sidebar Nav */}
        <aside className="lg:w-64 shrink-0 space-y-8 hidden lg:block sticky top-32 h-fit">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-3">Onboarding</h3>
            <nav className="flex flex-col gap-1">
              {['Getting Started', 'Engine Architecture', 'Security & Compliance'].map((item) => (
                <button
                  key={item}
                  onClick={() => setActiveTab(item.toLowerCase().replace(/ /g, '-'))}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-between group ${
                    activeTab === item.toLowerCase().replace(/ /g, '-') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {item}
                  <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === item.toLowerCase().replace(/ /g, '-') ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                </button>
              ))}
            </nav>
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-3">Connectors</h3>
            <nav className="flex flex-col gap-1">
              {['Shopify SDK', 'Amazon Marketplace', 'Custom Export'].map((item) => (
                <button
                  key={item}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-600/20">
                <Book className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-black text-emerald-600 tracking-tighter uppercase">Developer Docs</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-black text-slate-900 tracking-tight mb-6">
              Platform Overview
            </h1>
            <p className="text-xl text-slate-500 leading-relaxed font-body mb-8">
              Learn how to utilize ShopsReady to automate your e-commerce data supply chain. Our platform is built for speed, integrity, and scale.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold text-slate-600">
                <Cpu className="w-4 h-4" />
                Version 1.4.2
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold text-slate-600">
                <Terminal className="w-4 h-4" />
                RESTful API
              </div>
            </div>
          </motion.div>

          <hr className="border-slate-100 mb-16" />

          {/* The Flow */}
          <section className="space-y-20 mb-32">
            {steps.map((step, index) => (
              <motion.div 
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="shrink-0 flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-2xl ${step.color} shadow-xl flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform`}>
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    {index !== steps.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-100 my-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-black text-slate-900 mb-4 font-heading">{step.title}</h2>
                    <p className="text-lg text-slate-500 leading-relaxed mb-6 italic">
                      {step.content}
                    </p>
                    {/* Mock Terminal/Code Block */}
                    <div className="bg-slate-900 rounded-2xl p-6 font-mono text-sm text-emerald-400 shadow-2xl relative overflow-hidden group/code overflow-x-auto whitespace-pre">
                      <div className="flex gap-1.5 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                      </div>
                      <code>{step.code}</code>
                      <div className="absolute top-4 right-4 text-slate-700 opacity-0 group-hover/code:opacity-100 transition-opacity">
                        <FileText className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </section>

          {/* Callout */}
          <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 mb-32 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-1000">
              <CheckCircle2 className="w-64 h-64 text-emerald-500" />
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-heading font-black text-slate-900 mb-4">Ready to automate?</h3>
              <p className="text-lg text-slate-500 max-w-md mb-8">
                Join 2,400+ merchants who have eliminated manual data entry from their daily workflow.
              </p>
              <button className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-600/30">
                Get Started Now
              </button>
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
