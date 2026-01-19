'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShoppingBag, Check } from 'lucide-react';

export default function AmazonExampleSection() {
  return (
    <section className="py-20 bg-slate-50 relative border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-medium text-sm mb-4">
            <ShoppingBag className="w-4 h-4" />
            <span>Featured Tool</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
            Amazon Listing <span className="text-orange-500">Transformation</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            See how our AI transforms raw product notes into a high-converting, keyword-rich listing.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-2 shadow-xl shadow-slate-200 border border-slate-200 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-4 bg-slate-50 rounded-2xl overflow-hidden md:p-4">
                
                {/* Before: Raw Input */}
                <div className="p-6 md:p-8 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-slate-200 bg-white md:rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1 rounded-full">Before</span>
                         <span className="text-sm font-semibold text-slate-500">Raw Input</span>
                    </div>
                    
                    <div className="font-mono text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 relative">
                        <p className="mb-2"><span className="text-slate-400">Product:</span> Garlic Press</p>
                        <p><span className="text-slate-400">Notes:</span> stainless steel, easy to clean, black handle, good grip, dishwasher safe, no rust, lifetime warranty</p>
                    </div>

                    <div className="mt-auto hidden md:flex justify-center text-slate-300">
                        <ArrowRight className="w-6 h-6 animate-pulse" />
                    </div>
                </div>

                {/* After: Optimized Result */}
                <div className="p-6 md:p-8 flex flex-col gap-4 bg-white md:rounded-2xl shadow-sm relative overflow-hidden group">
                     {/* Orange Glow */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[60px] pointer-events-none" />

                    <div className="flex items-center justify-between mb-2 relative z-10">
                         <span className="text-xs font-bold text-white uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1 rounded-full shadow-lg shadow-orange-500/20 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> After
                         </span>
                         <span className="text-sm font-semibold text-orange-600">Optimized Listing</span>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div>
                            <h4 className="text-sm font-bold text-slate-900 mb-1">Title</h4>
                            <p className="text-sm text-slate-700 leading-snug p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                                Premium Stainless Steel Garlic Press - Ergonomic Soft-Grip Handle, Rust-Proof Crushing Mechanism - Dishwasher Safe Kitchen Tool with Lifetime Warranty
                            </p>
                        </div>
                        <div>
                             <h4 className="text-sm font-bold text-slate-900 mb-1">Bullet Points</h4>
                             <ul className="space-y-2">
                                {[
                                    'EFFORTLESS CRUSHING: Heavy-duty stainless steel chamber allows you to mince whole unpeeled cloves in seconds.',
                                    'ERGONOMIC DESIGN: Non-slip, soft-touch handle provides a comfortable grip and reduces hand fatigue.',
                                    'EASY CLEANING: Dishwasher safe and rust-resistant materials ensure simple maintenance.'
                                ].map((bullet, i) => (
                                    <li key={i} className="text-xs text-slate-600 flex gap-2 items-start">
                                        <Check className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                             </ul>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </section>
  );
}
