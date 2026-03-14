'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, ArrowRight, Github, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Brand Side (Visible on Desktop) */}
      <div className="hidden lg:flex relative bg-slate-950 overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-mesh opacity-60" />

        {/* Animated Shapes */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"
        />

        <Link href="/" className="relative z-10 flex items-center gap-2 group">
          <div className="bg-emerald-500 p-2 rounded-xl">
            <Package className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading font-bold text-2xl text-white tracking-tight">
            ShopsReady
          </span>
        </Link>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl font-bold text-white leading-tight mb-6 font-heading">
              Accelerate your <br />
              <span className="text-gradient">E-commerce</span> workflow.
            </h2>
            <div className="space-y-4">
              {[
                'AI-Powered PDF to CSV conversion',
                'One-click Shopify & Amazon export',
                'Advanced listing optimization',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-lg font-medium">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-slate-500 text-sm">
          © 2024 ShopsReady Inc. All rights reserved.
        </div>
      </div>

      {/* Form Side */}
      <div className="flex flex-col items-center justify-center p-8 lg:p-24 bg-slate-50/50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 lg:hidden flex justify-center">
            <Package className="w-10 h-10 text-emerald-600" />
          </div>

          <div className="text-center lg:text-left mb-8">
            <h1 className="text-3xl font-bold text-slate-900 font-heading mb-2">Welcome Back</h1>
            <p className="text-slate-500 font-medium">Log in to your account to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <Link href="/forgot" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm uppercase">
              <span className="bg-slate-50 px-4 text-slate-400 font-bold">Or continue with</span>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 transition-all font-bold text-slate-700">
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
              Google
            </button>
            <button className="flex items-center justify-center gap-3 py-3 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 transition-all font-bold text-slate-700">
              <Github className="w-5 h-5" />
              GitHub
            </button>
          </div>

          <p className="mt-10 text-center text-slate-500 font-medium">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-emerald-600 font-bold hover:underline">
              Start for free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
