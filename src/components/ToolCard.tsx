'use client';

import { Tool } from '@/types';
import { cn } from '@/lib/utils';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface ToolCardProps {
  tool: Tool;
  onClick: () => void;
}

export default function ToolCard({ tool, onClick }: ToolCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={cn(
        'group relative rounded-3xl p-8 cursor-pointer overflow-hidden',
        'bg-white/60 backdrop-blur-xl border border-white/40 shadow-sm',
        'hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500'
      )}
    >
      {/* Hover Gradient Effect */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(16, 185, 129, 0.1),
              transparent 80%
            )
          `,
        }}
      />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-4 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border border-emerald-100/50 text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-500">
              {tool.icon}
            </div>
          </div>
          
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <ArrowRight className="w-4 h-4 text-slate-900" />
          </div>
        </div>
        
        <h3 className="text-xl font-heading font-bold text-slate-900 mb-3 group-hover:text-emerald-700 transition-colors">
          {tool.title}
        </h3>
        
        <p className="text-sm font-body text-slate-500 leading-relaxed mb-6 flex-grow">
          {tool.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100/50">
           <span className="text-xs font-semibold px-3 py-1.5 bg-slate-100/80 text-slate-600 rounded-lg backdrop-blur-sm border border-slate-200/50">
              {tool.category}
           </span>
        </div>
      </div>
    </motion.div>
  );
}
