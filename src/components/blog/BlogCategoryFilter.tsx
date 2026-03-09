'use client';

import { motion } from 'framer-motion';

interface BlogCategoryFilterProps {
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const categoryIcons: Record<string, string> = {
  'E-commerce Guides': '🛒',
  'Product Data': '📊',
  'Industry News': '📰',
  'Tutorials': '📖',
};

export default function BlogCategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: BlogCategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onCategoryChange(null)}
        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
          activeCategory === null
            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        All Posts
      </button>
      {categories.map((category) => (
        <motion.button
          key={category}
          whileTap={{ scale: 0.97 }}
          onClick={() => onCategoryChange(activeCategory === category ? null : category)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border flex items-center gap-1.5 ${
            activeCategory === category
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200/50'
              : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
          }`}
        >
          <span>{categoryIcons[category] || '📄'}</span>
          {category}
        </motion.button>
      ))}
    </div>
  );
}
