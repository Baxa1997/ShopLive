'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'E-commerce Brand Owner',
    content: "The unified importer is a game-changer! I generated my Shopify CSV and Amazon listings in under 60 seconds. The bullet points are perfectly optimized for SEO.",
    stars: 5,
    avatar: 'SC'
  },
  {
    name: 'David Miller',
    role: 'Dropshipping Expert',
    content: "Finally a tool that understands variant mapping. My Shopify import was flawless, and the Amazon category suggestions saved me hours of manual research.",
    stars: 5,
    avatar: 'DM'
  },
  {
    name: 'Michael Ross',
    role: 'Marketplace Manager',
    content: "Syncing across channels used to take days. Now it's one click. The AI-generated Shopify handles and Amazon keywords are incredibly accurate and professional.",
    stars: 5,
    avatar: 'MR'
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-[100px] -translate-y-1/2" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
            Loved by <span className="text-emerald-600">Humans</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Join thousands of users who are already saving time and creating better content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, index) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300"
            >
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < t.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                  />
                ))}
              </div>
              
              <p className="text-slate-700 italic mb-6 leading-relaxed">
                &quot;{t.content}&quot;
              </p>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500 uppercase tracking-wide">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
