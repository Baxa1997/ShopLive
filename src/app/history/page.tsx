'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Package, Trash2, Download, Search, Filter,
  FileText, ShoppingBag, ChevronRight, Clock, Sparkles,
  AlertCircle, ArrowLeft, X, Loader2, LogIn
} from 'lucide-react';
import { getProjects, deleteProject, clearAllProjects, type Project } from '@/lib/projects';
import { useAuth } from '@/lib/auth-context';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function HistoryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [entries, setEntries] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'shopify' | 'amazon'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getProjects();
    setEntries(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) loadProjects();
  }, [authLoading, loadProjects]);

  const filtered = entries.filter(e => {
    const matchesSearch = e.file_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || e.marketplace === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string) => {
    await deleteProject(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleClearAll = async () => {
    await clearAllProjects();
    setEntries([]);
    setShowClearConfirm(false);
  };

  const downloadCSV = (entry: Project) => {
    const headers = [
      'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Product Category',
      'Google Product Category', 'Tags', 'Published', 'Option1 Name', 'Option1 Value',
      'Variant Price', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty',
      'Variant SKU', 'SEO Title', 'SEO Description'
    ];
    const rows: string[][] = [];
    entry.products.forEach((p: any) => {
      p.shopify_service?.variants?.forEach((v: any) => {
        rows.push([
          p.shopify_service?.handle || '',
          p.shopify_service?.title || '',
          p.shopify_service?.html_description || '',
          p.shopify_service?.vendor || '',
          p.shopify_service?.product_type || '',
          p.shopify_service?.category || '',
          p.shopify_service?.google_product_category || '',
          p.shopify_service?.tags || '',
          'TRUE',
          v.option1_name || '',
          v.option1_value || '',
          v.price || '',
          String(v.grams || 0),
          'shopify',
          String(v.inventory_qty || 0),
          v.sku || '',
          p.shopify_service?.seo_title || '',
          p.shopify_service?.seo_description || '',
        ]);
      });
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${entry.file_name.replace('.pdf', '')}_shopify.csv`);
  };

  const downloadAmazon = async (entry: Project) => {
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Amazon FBA');
    ws.columns = [
      { header: 'item_name', key: 'item_name', width: 40 },
      { header: 'brand_name', key: 'brand_name', width: 20 },
      { header: 'standard_price', key: 'standard_price', width: 12 },
      { header: 'item_type_keyword', key: 'item_type_keyword', width: 20 },
      { header: 'generic_keywords', key: 'generic_keywords', width: 40 },
    ];
    entry.products.forEach((p: any) => {
      ws.addRow({
        item_name: p.amazon_fba_service?.flat_file_data?.item_name || '',
        brand_name: p.amazon_fba_service?.flat_file_data?.brand_name || '',
        standard_price: p.amazon_fba_service?.flat_file_data?.standard_price || '',
        item_type_keyword: p.amazon_fba_service?.flat_file_data?.item_type_keyword || '',
        generic_keywords: p.amazon_fba_service?.search_terms || '',
      });
    });
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${entry.file_name.replace('.pdf', '')}_amazon.xlsx`);
  };

  const marketplaceColors: Record<string, string> = {
    shopify: 'bg-[#95BF47]/10 text-[#5a8a1f] border-[#95BF47]/30',
    amazon: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  const marketplaceLabel: Record<string, string> = {
    shopify: 'Shopify CSV',
    amazon: 'Amazon XLSX',
  };

  // ── Auth guard ──────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Sign in to view history</h2>
          <p className="text-slate-500 mb-6 text-sm">Your projects are saved to your account.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-200"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Link href="/tools/multi-importer" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Generator
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <History className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Generation History</h1>
                <p className="text-slate-500 text-sm mt-0.5">{entries.length} catalog{entries.length !== 1 ? 's' : ''} processed</p>
              </div>
            </div>
          </div>

          {entries.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-all font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        {/* Search & Filter */}
        {entries.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by filename..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              {(['all', 'shopify', 'amazon'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                    filter === f
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'shopify' ? 'Shopify' : 'Amazon'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            <span className="text-sm font-medium">Loading your projects...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <History className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">No history yet</h2>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              Your generated catalogs will appear here after your first PDF import.
            </p>
            <Link
              href="/tools/multi-importer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-200"
            >
              <Sparkles className="w-5 h-5" />
              Start Generating
            </Link>
          </motion.div>
        )}

        {/* Filtered Empty */}
        {!isLoading && entries.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No results match your search or filter.</p>
          </div>
        )}

        {/* History Cards */}
        {!isLoading && (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((entry, idx) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all"
                >
                  {/* Card Header */}
                  <div
                    className="flex items-center gap-4 p-5 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  >
                    <div className="w-11 h-11 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-slate-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 text-sm truncate max-w-[200px] sm:max-w-none">
                          {entry.file_name}
                        </p>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${marketplaceColors[entry.marketplace] ?? ''}`}>
                          {marketplaceLabel[entry.marketplace] ?? entry.marketplace}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <Package className="w-3 h-3" />
                          {entry.product_count} products
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <Clock className="w-3 h-3" />
                          {timeAgo(entry.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {entry.marketplace === 'shopify' && (
                        <button
                          onClick={() => downloadCSV(entry)}
                          title="Download Shopify CSV"
                          className="p-2 bg-[#95BF47]/10 hover:bg-[#95BF47]/20 border border-[#95BF47]/30 rounded-xl text-[#5a8a1f] transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {entry.marketplace === 'amazon' && (
                        <button
                          onClick={() => downloadAmazon(entry)}
                          title="Download Amazon XLSX"
                          className="p-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl text-orange-600 transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-xl text-slate-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className={`w-4 h-4 text-slate-300 transition-transform ${expandedId === entry.id ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {/* Expanded Product List */}
                  <AnimatePresence>
                    {expandedId === entry.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                            Products in this session
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                            {entry.products.map((p: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-slate-200"
                              >
                                <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <ShoppingBag className="w-3 h-3 text-emerald-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-900 truncate">
                                    {p.shopify_service?.title || 'Untitled Product'}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    {p.shopify_service?.variants?.length || 1} variant{(p.shopify_service?.variants?.length || 1) !== 1 ? 's' : ''}
                                    {p.shopify_service?.variants?.[0]?.price && ` · $${p.shopify_service.variants[0].price}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-slate-400 mt-3">Processed: {formatDate(entry.created_at)}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Clear Confirm Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Clear all history?</h3>
                  <p className="text-sm text-slate-500">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-all"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
