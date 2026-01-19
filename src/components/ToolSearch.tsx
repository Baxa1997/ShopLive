'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Category, Tool } from '@/types';
import { TOOLS } from '@/data/toolsData';
import ToolGrid from './ToolGrid';
import ToolPanel from './ToolPanel';
import { Zap, Search, Command, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import Floating3DObject from '@/components/Floating3DObject';

const CATEGORIES: Category[] = ['All', 'Work', 'Development', 'Social', 'Writing'];

export default function ToolSearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  

  const categoryParam = searchParams.get('category') as Category;
  const activeCategory = (categoryParam && CATEGORIES.includes(categoryParam)) ? categoryParam : 'All';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const filteredTools = TOOLS.filter(tool => {
    const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCategoryChange = (cat: Category) => {

    const url = cat === 'All' ? '/search' : `/search?category=${cat}`;
    router.push(url, { scroll: false });
  };

  return (
    <div className="min-h-screen relative">

      <div className="h-64 bg-slate-900 relative overflow-hidden flex items-center justify-center">

         <div className="absolute opacity-50 scale-75 blur-sm top-0">
             <Floating3DObject />
         </div>


         <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <div className="absolute top-[-50%] left-[20%] w-[600px] h-[600px] bg-emerald-500/30 rounded-full blur-[120px]" />
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-48 relative z-10 pb-20">
        

        <div className="flex items-center justify-between mb-8 text-white/80">
          <Link href="/" className="flex items-center gap-2 hover:text-white transition-colors group cursor-pointer">
            <div className="bg-emerald-500/10 p-2 rounded-lg backdrop-blur-md border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all">
                <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="font-heading font-bold text-xl text-white tracking-tight">LifeShop</span>
          </Link>
        </div>


        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mb-12">
           <h1 className="text-3xl font-heading font-bold text-slate-900 mb-6 text-center">
             Find your <span className="text-emerald-600">perfect tool</span>
           </h1>


           <div className="relative max-w-2xl mx-auto mb-8 group">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
               <Search className="w-6 h-6" />
             </div>
             <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search for tools (e.g. 'email', 'recipe')..."
               className="w-full pl-14 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:shadow-lg focus:shadow-emerald-500/10 transition-all duration-300"
             />
             <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
               <kbd className="hidden md:inline-flex h-8 items-center gap-1 rounded border border-slate-200 bg-white px-2 text-[10px] font-medium text-slate-500 font-mono">
                 <Command className="w-3 h-3" /> K
               </kbd>
             </div>
           </div>


           <div className="flex flex-wrap items-center justify-center gap-2">
             {CATEGORIES.map((category) => (
               <button
                 key={category}
                 onClick={() => handleCategoryChange(category)}
                 className={cn(
                   "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer",
                   activeCategory === category
                     ? "bg-slate-900 text-white border-slate-900 shadow-md"
                     : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                 )}
               >
                 {category}
               </button>
             ))}
           </div>
        </div>

          <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800">
            {filteredTools.length} {filteredTools.length === 1 ? 'Result' : 'Results'} Found
          </h2>
        </div>

        <ToolGrid 
          key={activeCategory}
          tools={filteredTools} 
          onToolSelect={setSelectedTool} 
        />
      </div>

      {/* Slide-over Panel */}
      <ToolPanel 
        selectedTool={selectedTool} 
        onClose={() => setSelectedTool(null)} 
      />
    </div>
  );
}
