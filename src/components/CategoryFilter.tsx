'use client';

import { Category } from '@/types';
import { cn } from '@/lib/utils';
import { motion, LayoutGroup } from 'framer-motion';

interface CategoryFilterProps {
  categories: Category[];
  activeCategory: Category;
  onSelect: (category: Category) => void;
}

export default function CategoryFilter({
  categories,
  activeCategory,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto pb-6 pt-2 no-scrollbar">
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 backdrop-blur-md rounded-full border border-white/20 w-max mx-auto md:mx-0">
        <LayoutGroup>
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                onClick={() => onSelect(category)}
                className={cn(
                  'relative px-5 py-2.5 rounded-full text-sm font-medium transition-colors duration-300 whitespace-nowrap z-10 cursor-pointer',
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute inset-0 bg-slate-900 rounded-full shadow-lg"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 font-heading tracking-wide">{category}</span>
              </button>
            );
          })}
        </LayoutGroup>
      </div>
    </div>
  );
}
