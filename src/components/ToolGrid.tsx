'use client';

import { Tool } from '@/types';
import ToolCard from './ToolCard';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolGridProps {
  tools: Tool[];
  onToolSelect: (tool: Tool) => void;
}

export default function ToolGrid({ tools, onToolSelect }: ToolGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 } 
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20"
    >
      <AnimatePresence mode="popLayout">
      {tools.map((tool) => (
        <motion.div key={tool.id} variants={item} exit="exit">
          {tool.href ? (
              <a href={tool.href} className="block h-full">
                  <ToolCard 
                    tool={tool} 
                    onClick={() => {}} // No-op, let anchor handle nav
                  />
              </a>
          ) : (
            <ToolCard 
                tool={tool} 
                onClick={() => onToolSelect(tool)} 
            />
          )}
        </motion.div>
      ))}
      </AnimatePresence>
    </motion.div>
  );
}
