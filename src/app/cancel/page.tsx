'use client';

import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl border border-slate-100"
      >
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-slate-400" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Cancelled</h1>
        <p className="text-slate-500 mb-8 leading-relaxed">
          No worries — your payment was cancelled and you have not been charged. You can upgrade anytime.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/pricing"
            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all group"
          >
            View Plans Again
          </Link>
          <Link
            href="/tools/multi-importer"
            className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-2xl transition-all group"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Generator
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
