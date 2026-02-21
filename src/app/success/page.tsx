'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  const router = useRouter();

  // Auto-redirect to generator after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => router.push('/tools/multi-importer'), 5000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-2xl border border-slate-100"
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </motion.div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">Payment Successful!</h1>
        <p className="text-slate-500 mb-6 leading-relaxed">
          Your account has been upgraded. You now have access to unlimited generations and all Pro features.
        </p>

        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 justify-center text-emerald-700">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold">Pro plan is now active on your account</span>
          </div>
        </div>

        <Link
          href="/tools/multi-importer"
          className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100 group"
        >
          Go to Generator
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        <p className="text-xs text-slate-400 mt-4">Redirecting automatically in 5 seconds...</p>
      </motion.div>
    </div>
  );
}
