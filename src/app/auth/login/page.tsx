'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  History, 
  ArrowRight, 
  CheckCircle2, 
  Mail, 
  ShieldCheck,
  Layout,
  Globe,
  ArrowLeft,
  Moon, // Added for theme toggle
  Sun // Added for theme toggle
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [theme, setTheme] = useState('light'); // Added theme state

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      const redirectTo = searchParams.get('next') || '/tools/multi-importer';
      router.push(redirectTo);
    }
  }, [user, isLoading, router, searchParams]);

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const supabase = createClient();
      const next = searchParams.get('next') || '/tools/multi-importer';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setIsSubmitting(true);
      const supabase = createClient();
      const next = searchParams.get('next') || '/tools/multi-importer';
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
      toast.success('Magic link sent to your email!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send magic link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
      title: "AI-Powered Generation",
      description: "Create high-converting product listings in seconds."
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: "Instant Sync",
      description: "Direct connection to your favorite marketplaces."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
      title: "Secure & Private",
      description: "Your data is encrypted and never shared with third parties."
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfd] dark:bg-slate-950 flex flex-col md:flex-row overflow-hidden">
      {/* Left Side - Visual/Marketing */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 dark:bg-slate-950 relative items-center justify-center p-12 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03]" 
               style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >


            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
              Empower your commerce with <span className="text-emerald-400">AI intelligence.</span>
            </h1>
            <p className="text-slate-400 dark:text-slate-500 text-lg mb-10 leading-relaxed">
              Join thousands of merchants who use ShopsReady to automate their workflow and increase sales by up to 45%.
            </p>

            <div className="space-y-6">
              {benefits.map((benefit, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="mt-1 shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{benefit.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 pt-8 border-t border-white/5"
          >
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                  </div>
                ))}
              </div>
              <p className="text-slate-400 dark:text-slate-500 text-sm italic">
                "This tool saved me 20+ hours every single week."
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col relative">
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-20"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
        <div 
          className="absolute inset-0 z-0 opacity-20 dark:opacity-10"
          style={{ backgroundImage: 'radial-gradient(var(--tw-gradient-stops))', '--tw-gradient-stops': 'var(--gradient-start) 0%, var(--gradient-end) 100%', '--gradient-start': theme === 'light' ? 'rgba(20, 184, 166, 0.05)' : 'rgba(20, 184, 166, 0.1)', '--gradient-end': theme === 'light' ? 'rgba(236, 72, 153, 0.05)' : 'rgba(236, 72, 153, 0.1)' }}
        />
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-20">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="mb-10">
                <p className="text-slate-500 dark:text-slate-400">Sign in to your account to continue</p>
              </div>

              {!magicLinkSent ? (
                <>
                  <div className="space-y-4">
                    <button
                      onClick={handleGoogleLogin}
                      disabled={isGoogleLoading}
                      className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:hover:bg-slate-600 dark:hover:border-slate-500 transition-all shadow-md dark:shadow-none relative overflow-hidden group"
                    >
                      {isGoogleLoading ? (
                        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span>Sign in with Google</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="my-8 flex items-center gap-4">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">or use email</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  </div>

                  <form onSubmit={handleEmailLogin} className="space-y-5">
                    <div>
                      <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-md transition-all font-medium"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-emerald-400/30 dark:shadow-lg dark:shadow-emerald-500/30 disabled:opacity-70 group"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Send Magic Link</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-100 dark:bg-slate-800 dark:border-slate-700 p-8 rounded-[2rem] text-center"
                >
                  <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Check your inbox</h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-8">
                    We've sent a magic sign-in link to <span className="font-bold text-emerald-700 dark:text-emerald-400">{email}</span>.
                  </p>
                  <button
                    onClick={() => setMagicLinkSent(false)}
                    className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    Use a different email
                  </button>
                </motion.div>
              )}

              <p className="mt-10 text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                By signing in, you agree to our{' '}
                <Link href="/policy" className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Terms of Service</Link>{' '}
                and{' '}
                <Link href="/policy" className="underline hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Privacy Policy</Link>.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 mt-auto flex items-center justify-center gap-8 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 grayscale opacity-50">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-200 tracking-tight">Worldwide</span>
          </div>
          <div className="flex items-center gap-2 grayscale opacity-50">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold text-slate-900 dark:text-slate-200 tracking-tight">Enterprise Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
