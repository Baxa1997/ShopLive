'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Zap, BarChart3, Fingerprint } from 'lucide-react';

const FEATURES = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Lightning Fast',
    description: 'Powered by advanced AI models that deliver results in milliseconds, not minutes.',
    color: 'emerald',
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: 'Secure & Private',
    description: 'Your data is processed locally where possible and never used to train our models.',
    color: 'teal',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Smart Analytics',
    description: 'Track your usage and see how much time you save with our productivity dashboard.',
    color: 'cyan',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <span className="text-emerald-600 font-semibold tracking-wider uppercase text-sm bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900">
            Built for <span className="text-emerald-600">Performance</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            We combine cutting-edge technology with intuitive design to give you a productivity superpower.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <Fingerprint className="w-32 h-32" />
              </div>

              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-emerald-600 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-heading font-bold text-slate-900 mb-3">
                {feature.title}
              </h3>
              
              <p className="text-slate-500 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
