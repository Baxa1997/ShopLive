'use client';

import { useState, useEffect } from 'react';
import { Check, Sparkles, ArrowRight, Zap, Crown, Loader2, X, LogIn, History, Infinity as InfinityIcon, FileText, Star } from 'lucide-react';
import Link from 'next/link';
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
  const { user, isPro, userPlan } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<StripePlan | null>(null);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<StripePlan | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

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

    // If user is already on this plan, do nothing
    if (isCurrentPlan(plan)) return;

    // If user is NOT logged in, show login modal and remember the plan
    if (!user) {
      setPendingPlan(plan);
      setShowLoginModal(true);
      return;
    }

    setLoadingPlan(plan);
    try {
      await redirectToCheckout(plan, user?.email ?? undefined);
      // Page will redirect to Stripe — no need to reset state
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoadingPlan(null);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);

    // Store the pending plan so we can auto-checkout after redirect
    if (pendingPlan) {
      sessionStorage.setItem('pending_checkout_plan', pendingPlan);
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/pricing`,
      },
    });
    if (error) {
      console.error('Google login error:', error.message);
      setIsSigningIn(false);
      sessionStorage.removeItem('pending_checkout_plan');
    }
    // Page will redirect, so no need to reset isSigningIn on success
  };

  const getPlanLabel = (planId: StripePlan) => {
    if (isCurrentPlan(planId)) return '✓ Current Plan';
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans selection:bg-emerald-500/30 pt-16">

      {/* Background Ambience */}
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

          {/* Already on a plan banner */}
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
                {/* Popular badge */}
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

        {/* Comparison callout */}
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

      {/* ── LOGIN-FIRST MODAL ── */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowLoginModal(false); setPendingPlan(null); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden"
            >
              {/* Decorative Header */}
              <div className="h-32 bg-gradient-to-br from-slate-900 to-emerald-950 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent" />
                <div className="absolute top-[-40%] left-[-10%] w-[180px] h-[180px] bg-emerald-500/10 rounded-full blur-[60px]" />
                <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl relative z-10">
                  <LogIn className="w-8 h-8 text-emerald-400" />
                </div>
                <button
                  onClick={() => { setShowLoginModal(false); setPendingPlan(null); }}
                  className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all z-20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 pt-6">
                <div className="text-center mb-7">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to continue</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Create an account or sign in so we can link your
                    {pendingPlan === 'ultra' ? ' Ultra subscription' : pendingPlan === 'pro' ? ' Pro plan' : ' Standard plan'} purchase to your profile.
                  </p>
                </div>

                <div className="space-y-2.5 mb-7">
                  {[
                    { icon: Sparkles, text: 'Your plan activates instantly after payment', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { icon: Zap, text: 'Seamless checkout — one click after login', color: 'text-amber-600', bg: 'bg-amber-50' },
                    { icon: History, text: 'All history & exports linked to your account', color: 'text-blue-600', bg: 'bg-blue-50' },
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className={`w-8 h-8 ${benefit.bg} ${benefit.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <benefit.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{benefit.text}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={isSigningIn}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
                >
                  <AnimatePresence>
                    {isSigningIn && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900 flex items-center justify-center z-10"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Signing in...</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".8"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".8"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".8"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <p className="text-center text-[10px] text-slate-400 mt-5 leading-relaxed">
                  By joining, you agree to our <span className="underline">Terms of Use</span> and <span className="underline">Privacy Policy</span>.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
