'use client';

import { useState } from 'react';
import { Check, Sparkles, ArrowRight, Zap, Crown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { redirectToCheckout, type StripePlan } from '@/lib/stripe';

export default function PricingPage() {
  const { user, isPro } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<StripePlan | null>(null);
  const [error, setError] = useState('');

  const handleSelectPlan = async (plan: StripePlan) => {
    setError('');

    // If user is already Pro, do nothing
    if (isPro) return;

    setLoadingPlan(plan);
    try {
      await redirectToCheckout(plan, user?.email ?? undefined);
      // Page will redirect to Stripe — no need to reset state
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans selection:bg-emerald-500/30 pt-16">

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter mb-2">
            Simple, <span className="text-emerald-600">Transparent</span> Pricing
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Choose the plan that fits your business needs. No hidden fees, no complexity.
          </p>

          {/* Already Pro banner */}
          {isPro && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-sm font-bold"
            >
              <Crown className="w-4 h-4" />
              You're on the Pro plan — enjoy unlimited access!
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-sm text-red-500 font-semibold"
            >
              {error}
            </motion.p>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

          {/* Pay Per Use */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col"
          >
            <div className="mb-8">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Pay Per Use</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-slate-900">$1</span>
                <span className="text-slate-500 font-medium">/ generation</span>
              </div>
              <p className="text-slate-500 text-sm">Perfect for occasional imports and small catalogs.</p>
            </div>

            <div className="space-y-4 mb-10 flex-grow">
              {[
                'No PDF page limit',
                'Full Shopify/Amazon mapping',
                'Download CSV instantly',
                'AI Field extraction',
                'Technical Support',
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-slate-600">
                  <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSelectPlan('pay_per_use')}
              disabled={!!loadingPlan || isPro}
              className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all group disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loadingPlan === 'pay_per_use' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
              ) : (
                <>Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </motion.div>

          {/* Monthly Pro */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-[2.5rem] p-1 bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-2xl shadow-emerald-200/50"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
              <Sparkles className="w-3 h-3 text-amber-400" /> Most Popular
            </div>

            <div className="bg-white rounded-[2.3rem] p-8 h-full flex flex-col">
              <div className="mb-8">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                  <Crown className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Monthly Pro</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-black text-slate-900">$9.99</span>
                  <span className="text-slate-500 font-medium">/ month</span>
                </div>
                <p className="text-slate-500 text-sm">Unlimited power for growing e-commerce teams.</p>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                {[
                  'Unlimited generations (no limit)',
                  'Priority AI processing',
                  'Unlimited history storage',
                  'Bulk exports (Sync Package)',
                  'Priority Support',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-slate-600">
                    <Check className="w-4 h-4 text-emerald-500" strokeWidth={3} />
                    <span className="text-sm font-bold">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPlan('pro_monthly')}
                disabled={!!loadingPlan || isPro}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition-all shadow-lg shadow-emerald-100 group disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isPro ? (
                  <>✓ Current Plan</>
                ) : loadingPlan === 'pro_monthly' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
                ) : (
                  <>Go Pro Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        <p className="mt-12 text-slate-400 text-sm">
          All plans include standard updates and secure cloud processing. {' '}
          <Link href="/policy" className="underline hover:text-slate-600 transition-colors">Privacy & Terms</Link>
        </p>
      </div>
    </div>
  );
}
