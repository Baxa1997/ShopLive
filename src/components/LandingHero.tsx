'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShoppingBag, Share2, Package, LayoutTemplate, FileText, Settings, Download } from 'lucide-react';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORY_BOXES: { label: string; icon: any; description: string; color: string; href?: string; badge?: string }[] = [
  { 
    label: 'PDF to Multi-Channel Tool', 
    icon: Package, 
    description: 'Convert messy supplier catalogs into platform-ready files.',
    color: 'from-emerald-600 to-orange-500',
    href: '/tools/multi-importer',
    badge: 'New & Improved'
  },
  { 
    label: 'UI Architect', 
    icon: LayoutTemplate, 
    description: 'No-Code UI Architect & Prompt Builder',
    color: 'from-blue-600 to-indigo-600',
    badge: 'Coming Soon'
  },

  { 
    label: 'Social', 
    icon: Share2, 
    description: 'Perfect captions & viral posts',
    color: 'from-purple-500 to-pink-600',
    badge: 'Coming Soon'
  },
 
];

import MagicTextTransform from '@/components/MagicTextTransform';

export default function LandingHero() {
  return (
    <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[90vh] flex flex-col justify-center">
      {/* Magic Text Transform Animation */}
      <MagicTextTransform />

      <nav className="absolute top-0 left-0 w-full p-6 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-2">
                 <div className="bg-white/80 p-2 rounded-lg backdrop-blur-md border border-emerald-500/10 shadow-sm">
                    <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-heading font-bold text-xl text-slate-900 tracking-tight">ShopsReady</span>
            </div>

        </div>
      </nav>


      <div className="max-w-4xl mx-auto text-center relative z-10 mb-2">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/5 text-emerald-700 font-medium text-sm mb-8 border border-emerald-500/10 backdrop-blur-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Tools Added Weekly</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-4xl md:text-7xl font-heading font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]"
        >
          From Supplier PDF <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-orange-500">
            to Shopify & Amazon in 60 Seconds.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-body"
        >
          Stop manual data entry. Upload any supplier PDF or image, and our Architect engine generates structured Shopify CSVs and Amazon Inventory Files instantly.
        </motion.p>
        
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3, duration: 0.5 }}
           className="flex justify-center mb-16"
        >
            <Link 
              href="/tools/multi-importer" 
              className="group inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-emerald-600 rounded-full hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-500/30 transform hover:-translate-y-1"
            >
              Start Importing Now — It's Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
        </motion.div>
      </div>

      {/* Tabs as Boxes */}
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORY_BOXES.map((box, index) => {
            const isComingSoon = box.badge === 'Coming Soon';
            const content = (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={cn(
                  "group relative h-auto min-h-[22rem] rounded-[2rem] p-8 bg-white border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col justify-between transition-all duration-150",
                  isComingSoon ? "cursor-default opacity-80" : "cursor-pointer"
                )}
              >
                {/* Hover Gradient Overlay */}
                {!isComingSoon && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${box.color} opacity-0 group-hover:opacity-5 transition-opacity duration-100`} />
                )}
                
                {box.badge && (
                  <div className={cn(
                    "absolute top-6 right-6 z-20 px-3 py-1 rounded-full backdrop-blur-sm border text-xs font-bold uppercase tracking-wider",
                    isComingSoon 
                      ? "bg-indigo-50/80 border-indigo-100 text-indigo-500" 
                      : "bg-emerald-100/80 border-emerald-200 text-emerald-700"
                  )}>
                    {box.badge}
                  </div>
                )}
                
                <div className="relative z-10">
                  <div className={cn(
                    "inline-flex p-4 rounded-2xl bg-gradient-to-br text-white shadow-lg mb-4 transition-transform duration-100",
                    box.color
                  )}>
                    <box.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-slate-900 transition-colors">
                    {box.label}
                  </h3>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                  <div className="space-y-4">
                    <p className="text-slate-500 font-medium text-sm max-w-[80%]">
                      {box.description}
                    </p>
                    {box.label === 'PDF to Multi-Channel Tool' && (
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                          <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span>Step 1: Upload Supplier PDF</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                           <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                            <Settings className="w-4 h-4" />
                          </div>
                          <span>Step 2: AI extracts SKUs & Details</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                           <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600">
                            <Download className="w-4 h-4" />
                          </div>
                          <span>Step 3: Download Amazon .txt or Shopify .csv</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {!isComingSoon && (
                    <div className="w-14 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-100">
                       <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </motion.div>
            );

            return isComingSoon ? (
              <div key={box.label}>{content}</div>
            ) : (
              <Link key={box.label} href={box.href || `/search?category=${box.label}`}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
