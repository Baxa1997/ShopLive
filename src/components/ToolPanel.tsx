'use client';

import { useState, useEffect } from 'react';
import { Tool } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Copy, Check } from 'lucide-react';

interface ToolPanelProps {
  selectedTool: Tool | null;
  onClose: () => void;
}

export default function ToolPanel({ selectedTool, onClose }: ToolPanelProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Reset state when tool changes
  useEffect(() => {
    if (selectedTool) {
      setFormData({});
      setResult('');
      setIsGenerating(false);
    }
  }, [selectedTool]);

  const handleInputChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedTool) return;
    
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setResult(`Here is a generated result for ${selectedTool.title} based on your input:\n\n"${Object.values(formData).join(' ')}"\n\n(This is a simulated output. In a real app, this would call an AI endpoint.)`);
      setIsGenerating(false);
    }, 1500);
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {selectedTool && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 transition-opacity duration-300"
          />

          {/* Slide-over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full md:w-[600px] bg-white/80 backdrop-blur-2xl z-50 overflow-y-auto border-l border-white/50 shadow-2xl"
          >
            <div className="flex flex-col h-full relative">
              {/* Decorative Gradient */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-50/50 to-transparent pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between p-8 pt-10 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-emerald-100/50 text-emerald-600">
                    {selectedTool.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-slate-900">{selectedTool.title}</h2>
                    <p className="text-sm font-body text-slate-500">{selectedTool.category}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 px-8 pb-8 space-y-8 relative z-10">
                <div className="bg-slate-50/80 p-5 rounded-2xl text-slate-600 text-sm font-body leading-relaxed border border-slate-100/50">
                  {selectedTool.description}
                </div>

                <div className="space-y-6">
                  {selectedTool.inputs.map((input) => (
                    <div key={input.id} className="space-y-2">
                      <label className="block text-sm font-heading font-semibold text-slate-700 ml-1">
                        {input.label}
                      </label>
                      
                      {input.type === 'textarea' ? (
                        <textarea
                          rows={5}
                          placeholder={input.placeholder}
                          value={formData[input.id] || ''}
                          onChange={(e) => handleInputChange(input.id, e.target.value)}
                          className="w-full p-4 rounded-2xl border border-slate-200/60 bg-white/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 resize-none shadow-sm"
                        />
                      ) : input.type === 'dropdown' ? (
                        <div className="relative">
                          <select
                            value={formData[input.id] || ''}
                            onChange={(e) => handleInputChange(input.id, e.target.value)}
                            className="w-full p-4 rounded-2xl border border-slate-200/60 bg-white/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none shadow-sm"
                          >
                            <option value="">Select an option</option>
                            {input.options?.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder={input.placeholder}
                          value={formData[input.id] || ''}
                          onChange={(e) => handleInputChange(input.id, e.target.value)}
                          className="w-full p-4 rounded-2xl border border-slate-200/60 bg-white/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 shadow-sm"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Output Section */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 pt-4 border-t border-slate-100"
                  >
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-heading font-semibold text-slate-700 ml-1">
                        Generated Result
                      </label>
                      <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors bg-emerald-50 px-3 py-1.5 rounded-full"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? 'Copied!' : 'Copy Text'}
                      </button>
                    </div>
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-100/50 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap shadow-sm font-medium">
                      {result}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-slate-100 bg-white/80 backdrop-blur-xl sticky bottom-0 z-20">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className={cn(
                    "w-full py-4 rounded-2xl font-heading font-bold text-white shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-lg",
                    isGenerating 
                      ? "bg-slate-300 cursor-not-allowed shadow-none" 
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500"
                  )}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Magic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Output
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
