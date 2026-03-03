'use client';

import { useState, useEffect } from 'react';
import { Check, Sparkles, ArrowRight, Zap, Crown, Loader2, X, LogIn, History, Infinity as InfinityIcon, FileText, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/utils/supabase/client';
import { redirectToCheckout, type StripePlan } from '@/lib/stripe';

const plans = [
  {
    id: 'standard' as StripePlan,
    name: 'Standard',
    price: '$1.25',
    period: 'one-time',
    description: 'Perfect for trying out the service with a few generations.',
    icon: Zap,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    highlight: false,
    features: [
      '3 usage generations',
      'Full Shopify/Amazon mapping',
      'Download CSV instantly',
      'AI Field extraction',
      'Email Support',
    ],
    buttonLabel: 'Get Started',
    buttonStyle: 'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200/50',
  },
  {
    id: 'pro' as StripePlan,
    name: 'Pro',
    price: '$5.25',
    period: 'one-time',
    description: 'Great for regular users who need more power & flexibility.',
    icon: Star,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    highlight: true,
    features: [
      '15 usage generations',
      'Full Shopify/Amazon mapping',
      'Download CSV instantly',
      'AI Field extraction',
      'Priority Support',
    ],
    buttonLabel: 'Go Pro',
    buttonStyle: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-200/50',
  },
  {
    id: 'ultra' as StripePlan,
    name: 'Ultra',
    price: '$14.25',
    period: 'month',
    description: 'Unlimited everything for power users and growing teams.',
    icon: Crown,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    highlight: false,
    features: [
      'Unlimited usage generations',
      'Unlimited PDF pages',
      'Full Shopify/Amazon mapping',
      'Download CSV instantly',
      'AI Field extraction',
      'Priority Support',
      'Early access to new features',
    ],
    buttonLabel: 'Go Ultra',
    buttonStyle: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg shadow-amber-200/50',
  },
] as const;

export default function PricingPage() {
  const router = useRouter();
  const { user, isPro, userPlan } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<StripePlan | null>(null);
  const [error, setError] = useState('');

  // After login redirect, check if there's a pending plan to check out
  useEffect(() => {
    if (user && !isPro) {
      const saved = sessionStorage.getItem('pending_checkout_plan');
      if (saved === 'standard' || saved === 'pro' || saved === 'ultra') {
        sessionStorage.removeItem('pending_checkout_plan');
        // Small delay to let auth context settle
        setTimeout(() => handleSelectPlan(saved as StripePlan), 500);
      }
    }
  }, [user]);

  const isCurrentPlan = (planId: StripePlan) => {
    return userPlan === planId;
  };

  const handleSelectPlan = async (plan: StripePlan) => {
    setError('');

    if (isCurrentPlan(plan)) return;

    if (!user) {
      sessionStorage.setItem('pending_checkout_plan', plan);
      router.push('/auth/login?next=/pricing');
      return;
    }

    setLoadingPlan(plan);
    try {
      await redirectToCheckout(plan, user?.email ?? undefined);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoadingPlan(null);
    }
  };

  const getPlanLabel = (planId: StripePlan) => {
    if (isCurrentPlan(planId)) return '✓ Current Plan';
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans selection:bg-emerald-500/30 pt-16">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] left-[50%] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >

          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter mb-2">
            Choose Your <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Perfect Plan</span>
          </h1>

          {isPro && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-sm font-bold"
            >
              <Crown className="w-4 h-4" />
              You&apos;re on the {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} plan
            </motion.div>
          )}

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

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">

          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isCurrent = isCurrentPlan(plan.id);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className={`relative flex flex-col ${plan.highlight ? 'md:-mt-4 md:mb-0' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl z-20">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Most Popular
                  </div>
                )}

                <div
                  className={`flex flex-col h-full rounded-[2.5rem] ${
                    plan.highlight
                      ? 'p-1 bg-gradient-to-b from-emerald-500 to-emerald-700 shadow-2xl shadow-emerald-200/50'
                      : plan.id === 'ultra'
                        ? 'p-1 bg-gradient-to-b from-amber-400 to-orange-600 shadow-2xl shadow-amber-200/30'
                        : ''
                  }`}
                >
                  <div
                    className={`flex flex-col h-full rounded-[2.3rem] p-6 ${
                      plan.highlight || plan.id === 'ultra'
                        ? 'bg-white'
                        : 'bg-white border border-slate-200 shadow-xl shadow-slate-200/50'
                    }`}
                  >
                    <div className="mb-6">
                      <div className={`w-12 h-12 ${plan.iconBg} rounded-2xl flex items-center justify-center mb-5`}>
                        <Icon className={`w-6 h-6 ${plan.iconColor}`} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                      <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                        <span className="text-slate-500 font-medium text-sm">/ {plan.period}</span>
                      </div>
                      <p className="text-slate-500 text-sm">{plan.description}</p>
                    </div>

                    <div className="space-y-3.5 mb-8 flex-grow">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-3 text-slate-600">
                          <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                          </div>
                          <span className={`text-sm ${plan.highlight ? 'font-bold' : 'font-medium'}`}>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={!!loadingPlan || isCurrent}
                      className={`w-full py-4 rounded-2xl font-black transition-all group disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${plan.buttonStyle}`}
                    >
                      {isCurrent ? (
                        <>✓ Current Plan</>
                      ) : loadingPlan === plan.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
                      ) : (
                        <>{plan.buttonLabel} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-14 max-w-3xl mx-auto"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-slate-200/60 shadow-lg shadow-slate-100/50">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-black text-slate-900">3</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Standard Uses</div>
              </div>
              <div className="border-x border-slate-200">
                <div className="text-2xl font-black text-emerald-600">15</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Pro Uses</div>
              </div>
              <div>
                <div className="text-2xl font-black bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">∞</div>
                <div className="text-xs text-slate-500 font-medium mt-1">Ultra Uses + Pages</div>
              </div>
            </div>
          </div>
        </motion.div>

        <p className="mt-12 text-slate-400 text-sm">
          All plans include standard updates and secure cloud processing. {' '}
          <Link href="/policy" className="underline hover:text-slate-600 transition-colors">Privacy &amp; Terms</Link>
        </p>
      </div>


    </div>
  );
}
