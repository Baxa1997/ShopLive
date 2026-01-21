'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShoppingBag, Share2, Package, LayoutTemplate } from 'lucide-react';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

const CATEGORY_BOXES: { label: string; icon: any; description: string; color: string; href?: string; badge?: string }[] = [
  { 
    label: 'Shopify Product', 
    icon: Package, 
    description: 'Convert Supplier PDFs into Shopify-Ready CSV Files',
    color: 'from-green-500 to-emerald-600',
    href: '/tools/shopify-importer',
    badge: 'Try it Now'
  },
  { 
    label: 'Amazon Product', 
    icon: ShoppingBag, 
    description: 'Optimize listings & generate copy',
    color: 'from-orange-500 to-amber-600',
    badge: 'Coming Soon'
  },
  { 
    label: 'Development', 
    icon: LayoutTemplate, 
    description: 'No-Code UI Architect & Prompt Builder',
    color: 'from-emerald-500 to-teal-600',
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


      <div className="max-w-4xl mx-auto text-center relative z-10 mb-4">
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
          className="text-5xl md:text-7xl font-heading font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1]"
        >
          Ultimate <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600">
            Shopify Importer
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-body"
        >
          ShopsReady is the smartest way to import products to Shopify. Convert PDFs, images, and raw text into optimized Shopify CSV files in seconds.
        </motion.p>
      </div>

      {/* Tabs as Boxes */}
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORY_BOXES.map((box, index) => {
            const isComingSoon = box.badge === 'Coming Soon';
            const content = (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={!isComingSoon ? { y: -8, scale: 1.02 } : {}}
                className={cn(
                  "group relative h-64 rounded-[2rem] p-8 bg-white border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col justify-between transition-all duration-300",
                  isComingSoon ? "cursor-default opacity-80" : "cursor-pointer"
                )}
              >
                {/* Hover Gradient Overlay */}
                {!isComingSoon && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${box.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
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
                    "inline-flex p-4 rounded-2xl bg-gradient-to-br text-white shadow-lg mb-6 transition-transform duration-300",
                    box.color,
                    !isComingSoon && "group-hover:scale-110"
                  )}>
                    <box.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-slate-900 transition-colors">
                    {box.label}
                  </h3>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                  <p className="text-slate-500 font-medium text-sm max-w-[80%]">
                    {box.description}
                  </p>
                  {!isComingSoon && (
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
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
