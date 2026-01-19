'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const EXAMPLES = [
  {
    title: 'Instagram Caption',
    before: 'photo of me and friends at beach',
    after: 'Salt water, sun-kissed hair, and the best crew. 🌊✨ Living for these golden hour moments that turn into forever memories. #SummerVibes #BeachDays #SquadGoals',
    color: 'from-purple-500 to-pink-500',
    icon: '📸'
  },
  {
    title: 'Professional Email',
    before: 'hey boss i feel sick wont allow me to come',
    after: 'Hi [Name], I am writing to let you know that I am feeling unwell today and will need to take a sick day to recover. I will ensure any urgent tasks are delegated or addressed upon my return. Best regards.',
    color: 'from-blue-500 to-indigo-600',
    icon: '📧'
  },
];

export default function ExamplesSection() {
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
            See the <span className="text-emerald-600">Magic</span> Happen
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Turn simple thoughts into polished, professional content in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {EXAMPLES.map((example, index) => (
            <motion.div
              key={example.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-slate-50 rounded-3xl p-1 shadow-sm border border-slate-100 overflow-hidden"
            >
              <div className="bg-white rounded-[1.3rem] p-6 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${example.color} flex items-center justify-center text-lg shadow-md text-white`}>
                    {example.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{example.title}</h3>
                </div>

                <div className="flex-1 space-y-4">
                  {/* Before */}
                  <div className="bg-slate-100/50 p-4 rounded-xl border border-dashed border-slate-300">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Input</span>
                    <p className="text-slate-600 font-mono text-sm">&quot;{example.before}&quot;</p>
                  </div>

                  <div className="flex justify-center">
                    <div className="bg-emerald-50 text-emerald-600 p-2 rounded-full">
                      <ArrowRight className="w-5 h-5 rotate-90 md:rotate-0" />
                    </div>
                  </div>

                  {/* After */}
                  <div className={`p-6 rounded-2xl bg-gradient-to-br ${example.color} shadow-lg relative overflow-hidden group`}>
                     {/* Shine Effect */}
                     <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-[-150%] transition-transform duration-700 pointer-events-none skew-y-12" />
                     
                     <span className="relative z-10 text-xs font-bold text-white/90 uppercase tracking-wider block mb-3 flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-white" /> Result
                     </span>
                     <p className="relative z-10 text-white font-medium text-lg leading-relaxed shadow-sm">
                       {example.after}
                     </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
