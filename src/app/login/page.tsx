'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, Mail, Lock, ArrowRight, Loader2, Github, Eye, EyeOff, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="absolute top-[-15%] left-[-5%] w-[55%] h-[55%] bg-emerald-500/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[55%] h-[55%] bg-emerald-600/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[40%] bg-emerald-500/4 rounded-full blur-[180px] pointer-events-none" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mb-10"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/25 rounded-2xl blur-lg group-hover:bg-emerald-500/45 transition-all duration-300" />
              <div className="relative bg-emerald-500/15 p-3 rounded-2xl border border-emerald-500/30 group-hover:border-emerald-400/60 group-hover:bg-emerald-500/25 transition-all duration-300">
                <Package className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
            <span className="font-heading font-bold text-[1.6rem] text-white tracking-tight">
              Shops<span className="text-emerald-400">Ready</span>
            </span>
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.975 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {/* Glowing border gradient */}
          <div className="absolute -inset-px bg-gradient-to-b from-emerald-500/25 via-white/5 to-white/3 rounded-[2.6rem] pointer-events-none" />

          <div className="relative bg-slate-900/65 backdrop-blur-2xl border border-white/8 rounded-[2.5rem] p-8 md:p-10 overflow-hidden">
            {/* Top shimmer line */}
            <div className="absolute top-0 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-emerald-400/55 to-transparent" />

            {/* Soft inner glow at top */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-emerald-500/6 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="relative mb-8">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-5"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium tracking-wide">Secure Login</span>
              </motion.div>

              <h1 className="text-[1.85rem] font-heading font-bold text-white leading-tight tracking-tight mb-2">
                Welcome back
              </h1>
              <p className="text-slate-400 text-[0.95rem]">
                Sign in to manage your e-commerce automation
              </p>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5 relative">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-[1.1rem] h-[1.1rem] text-slate-500 group-focus-within:text-emerald-400 transition-colors duration-200 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-950/55 border border-white/8 rounded-2xl py-[0.95rem] pl-11 pr-4 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500/40 hover:border-white/14 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-300" htmlFor="password">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors duration-200"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-[1.1rem] h-[1.1rem] text-slate-500 group-focus-within:text-emerald-400 transition-colors duration-200 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/55 border border-white/8 rounded-2xl py-[0.95rem] pl-11 pr-12 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500/40 hover:border-white/14 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-[1.1rem] h-[1.1rem]" /> : <Eye className="w-[1.1rem] h-[1.1rem]" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full overflow-hidden rounded-2xl mt-2 group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-300 group-hover:from-emerald-500 group-hover:to-emerald-400" />
                <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
                <div className="relative flex items-center justify-center gap-2 py-[1.05rem] text-white font-bold text-[0.95rem] active:scale-[0.985] transition-transform">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-[1.1rem] h-[1.1rem] group-hover:translate-x-1 transition-transform duration-200" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/8" />
              </div>
              <div className="relative flex justify-center text-[0.68rem] uppercase tracking-widest">
                <span className="bg-[#0d1525] px-4 text-slate-600">Or continue with</span>
              </div>
            </div>

            {/* GitHub */}
            <button
              onClick={handleGithubLogin}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 border border-white/8 rounded-2xl text-slate-300 text-sm font-medium hover:bg-white/5 hover:border-white/16 hover:text-white transition-all duration-200 group"
            >
              <Github className="w-[1.1rem] h-[1.1rem] group-hover:text-white transition-colors duration-200" />
              Continue with GitHub
            </button>

            {/* Sign up */}
            <p className="mt-7 text-center text-slate-500 text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors duration-200"
              >
                Create one free
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-7 flex justify-center items-center gap-5 text-xs text-slate-600"
        >
          <Link href="/privacy" className="hover:text-slate-400 transition-colors duration-200">
            Privacy Policy
          </Link>
          <span className="text-slate-700">·</span>
          <Link href="/terms" className="hover:text-slate-400 transition-colors duration-200">
            Terms of Service
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
