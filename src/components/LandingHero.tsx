'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Briefcase, Share2, PenTool, LayoutTemplate } from 'lucide-react';
import { Category } from '@/types';

const CATEGORY_BOXES: { label: Category; icon: any; description: string; color: string; href?: string }[] = [
  { 
    label: 'Work', 
    icon: Briefcase, 
    description: 'Buster bureaucracy & polish emails',
    color: 'from-blue-500 to-indigo-600'
  },
  { 
    label: 'Development', 
    icon: LayoutTemplate, 
    description: 'No-Code UI Architect & Prompt Builder',
    color: 'from-emerald-500 to-teal-600',
    href: '/tools/ui-architect'
  },
  { 
    label: 'Social', 
    icon: Share2, 
    description: 'Perfect captions & viral posts',
    color: 'from-purple-500 to-pink-600'
  },
  { 
    label: 'Writing', 
    icon: PenTool, 
    description: 'Creative drafts & editing',
    color: 'from-orange-500 to-red-600'
  },
];

import Floating3DObject from '@/components/Floating3DObject';

export default function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[90vh] flex flex-col justify-center">
      {/* 3D Element (Top/Background) */}
      <div className="absolute top-10 right-10 md:right-1/4 opacity-80 pointer-events-none z-0">
          <Floating3DObject />
      </div>

      {/* Hero Content */}
      <div className="max-w-4xl mx-auto text-center relative z-10 mb-16">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/5 text-emerald-700 font-medium text-sm mb-8 border border-emerald-500/10 backdrop-blur-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>New AI Tools Added Weekly</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-5xl md:text-7xl font-heading font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1]"
        >
          Your Personal <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600">
            Life Assistant
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed font-body"
        >
          Simplify your daily chaos. Choose a category below to access powerful, specialized AI tools designed for real life.
        </motion.p>
      </div>

      {/* Tabs as Boxes */}
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORY_BOXES.map((box, index) => (
            <Link key={box.label} href={box.href || `/search?category=${box.label}`}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative h-64 rounded-[2rem] p-8 bg-white border border-slate-200 shadow-xl shadow-slate-200/50 cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                {/* Hover Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${box.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className="relative z-10">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${box.color} text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <box.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-700 transition-colors">
                    {box.label}
                  </h3>
                </div>

                <div className="relative z-10 flex items-end justify-between">
                  <p className="text-slate-500 font-medium text-sm max-w-[80%]">
                    {box.description}
                  </p>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                     <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
