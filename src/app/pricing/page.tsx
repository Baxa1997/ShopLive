'use client';

import { useState, useEffect } from 'react';
import { Check, Sparkles, ArrowRight, Zap, Crown, Loader2, X, LogIn, History } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/utils/supabase/client';
import { redirectToCheckout, type StripePlan } from '@/lib/stripe';

export default function PricingPage() {
  const { user, isPro } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<StripePlan | null>(null);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<StripePlan | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // After login redirect, check if there's a pending plan to check out
  useEffect(() => {
    if (user && !isPro) {
      const saved = sessionStorage.getItem('pending_checkout_plan');
      if (saved === 'pay_per_use' || saved === 'pro_monthly') {
        sessionStorage.removeItem('pending_checkout_plan');
        // Small delay to let auth context settle
        setTimeout(() => handleSelectPlan(saved as StripePlan), 500);
      }
    }
  }, [user]);

  const handleSelectPlan = async (plan: StripePlan) => {
    setError('');

    // If user is already Pro, do nothing
    if (isPro) return;

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
              You&apos;re on the Pro plan — enjoy unlimited access!
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
                    {pendingPlan === 'pro_monthly' ? ' Pro subscription' : ' purchase'} to your profile.
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
