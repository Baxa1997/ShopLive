'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import type { BlogPostMeta } from '@/types/blog';

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  'E-commerce Guides': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Product Data': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Industry News': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Tutorials': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
};

interface BlogCardProps {
  post: BlogPostMeta;
  index?: number;
  featured?: boolean;
}

export default function BlogCard({ post, index = 0, featured = false }: BlogCardProps) {
  const colors = categoryColors[post.category] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (featured) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="group"
      >
        <Link href={`/blog/${post.slug}`} className="block">
          <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Cover Image */}
              <div className="relative h-64 md:h-full min-h-[320px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500">
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/90 text-center p-8">
                    <div className="text-7xl mb-3">📦</div>
                    <p className="text-sm font-medium tracking-widest uppercase opacity-80">Featured Article</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Featured</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 mb-3 leading-tight group-hover:text-emerald-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-slate-500 leading-relaxed mb-6 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formattedDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readingTime}
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 text-emerald-600 font-bold text-sm group-hover:gap-3 transition-all">
                  Read Article
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <Link href={`/blog/${post.slug}`} className="block h-full">
        <div className="h-full rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-400 hover:-translate-y-1">
          {/* Cover Gradient */}
          <div className="relative h-44 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${
              index % 4 === 0 ? 'from-emerald-500 to-teal-600' :
              index % 4 === 1 ? 'from-blue-500 to-indigo-600' :
              index % 4 === 2 ? 'from-amber-500 to-orange-600' :
              'from-violet-500 to-purple-600'
            }`}>
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20.5z' fill='%23ffffff' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              }} />
            </div>
            <div className="absolute top-4 left-4">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-sm ${colors.bg} ${colors.text} ${colors.border}`}>
                {post.category}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="text-lg font-heading font-bold text-slate-900 mb-2 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
              {post.title}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
              {post.excerpt}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.readingTime}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
