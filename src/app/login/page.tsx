'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, ArrowLeft } from 'lucide-react';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 bg-mesh flex flex-col items-center justify-center p-6">
      {/* Back to Home Logo Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Link href="/" className="flex flex-col items-center gap-2 group transition-all">
          <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Package className="w-10 h-10 text-emerald-500" />
          </div>
          <span className="font-heading font-bold text-xl text-white tracking-tight">
            ShopsReady
          </span>
        </Link>
      </motion.div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl">
          <LoginForm />

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-400 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
                Get Started
              </Link>
            </p>
          </div>
        </div>

        {/* Subtle Back Button */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 mt-8 text-slate-500 hover:text-slate-300 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to homepage
        </Link>
      </motion.div>
    </div>
  );
}
