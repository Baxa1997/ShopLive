'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Calendar, Clock } from 'lucide-react';
import type { BlogPostMeta } from '@/types/blog';

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  'E-commerce Guides': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Product Data': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Industry News': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Tutorials': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
};

export default function BlogPreviewSection() {
  const [posts, setPosts] = useState<BlogPostMeta[]>([]);

  useEffect(() => {
    fetch('/api/blog')
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts?.slice(0, 3) || []);
      })
      .catch(() => {});
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-50/50 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 font-medium text-sm mb-4 border border-emerald-200/60">
            <BookOpen className="w-4 h-4" />
            <span>From Our Blog</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-slate-900 tracking-tight mb-3">
            E-commerce Insights & Guides
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Expert tips to help you scale your online business
          </p>
        </motion.div>

        {/* Blog Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {posts.map((post, index) => {
            const colors = categoryColors[post.category] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
            const formattedDate = new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={`/blog/${post.slug}`} className="group block h-full">
                  <div className="h-full rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-sm hover:shadow-lg transition-all duration-400 hover:-translate-y-1">
                    <div className={`h-32 bg-gradient-to-br ${
                      index === 0 ? 'from-emerald-500 to-teal-600' :
                      index === 1 ? 'from-blue-500 to-indigo-600' :
                      'from-amber-500 to-orange-600'
                    } relative`}>
                      <div className="absolute top-3 left-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm ${colors.bg} ${colors.text} ${colors.border}`}>
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-base font-heading font-bold text-slate-900 mb-2 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formattedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readingTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all hover:shadow-lg hover:shadow-emerald-200/50"
          >
            View All Articles
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
