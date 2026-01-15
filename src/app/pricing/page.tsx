'use client';

import { Check, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
         <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-emerald-600/10 p-2 rounded-lg backdrop-blur-md border border-emerald-600/20 group-hover:bg-emerald-600/20 transition-all">
                <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-heading font-bold text-xl text-slate-900 tracking-tight">Life Assistant</span>
          </Link>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <div className="max-w-md w-full">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative rounded-3xl p-1 bg-gradient-to-b from-emerald-500 via-emerald-500/20 to-slate-200"
            >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Most Popular
                </div>

                <div className="bg-slate-900 backdrop-blur-xl rounded-[1.4rem] p-8 h-full flex flex-col border border-white/10 relative overflow-hidden shadow-2xl">
                    {/* Inner Glow */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

                    <div className="relative z-10 text-center mb-8">
                        <h2 className="text-xl text-emerald-400 font-bold uppercase tracking-widest mb-2">Pro Version</h2>
                        <div className="flex items-end justify-center gap-1 mb-4">
                            <span className="text-5xl font-extrabold text-white">$0</span>
                            <span className="text-slate-500 font-medium mb-1 line-through text-lg opacity-60">$29</span>
                            <span className="text-slate-400 font-medium mb-1 ml-1">/mo</span>
                        </div>
                        <p className="text-slate-400 text-sm">Limited time offer. Get full access to all AI tools completely free.</p>
                    </div>

                    <div className="space-y-4 mb-8 flex-grow">
                        {[
                            'Unlimited AI Generations',
                            'Access to UI Architect',
                            'No Watermark',
                            'Priority Support',
                            'Early Access to New Tools'
                        ].map((feature) => (
                            <div key={feature} className="flex items-center gap-3 text-slate-300">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-emerald-400" />
                                </div>
                                <span className="text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <button className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-lg transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 relative z-10 group cursor-pointer">
                        <span className="flex items-center justify-center gap-2">
                             Get Started Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                    
                    <p className="text-center text-xs text-slate-600 mt-4">No credit card required</p>
                </div>
            </motion.div>
        </div>
      </main>

    </div>
  );
}
