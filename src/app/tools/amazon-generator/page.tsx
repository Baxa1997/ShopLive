'use client';

import { useState } from 'react';
import { Upload, Copy, ShoppingBag, Loader2, Sparkles, X, List as ListIcon, FileText, Tag, Zap } from 'lucide-react';
import Link from 'next/link';

export default function AmazonGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [formData, setFormData] = useState({
    image: null as string | null,
    productName: '',
    rawFeatures: '',
  });

  const [results, setResults] = useState({
    title: '',
    bullets: ['', '', '', '', ''],
    htmlDescription: '',
    searchTerms: '',
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setFormData({ ...formData, image: url });
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: null });
  };

  const handleGenerate = () => {
    if (!formData.productName) return;

    setIsLoading(true);
    setShowResults(false);

    // Simulate API call
    setTimeout(() => {
      setResults({
        title: `${formData.productName} - Premium Quality, Durable Design for Everyday Use - Eco-Friendly Materials - Perfect Gift`,
        bullets: [
          "PREMIUM DURABILITY: Constructed from high-grade materials ensuring long-lasting performance and reliability for years to come.",
          "ERGONOMIC DESIGN: Designed for comfort and ease of use, reducing fatigue during extended sessions. Fits perfectly in any environment.",
          "ECO-FRIENDLY: Made with sustainable components, 100% recyclable packaging. Safe for you and the planet.",
          "VERSATILE APPLICATION: Perfect for home, office, or travel use. Adapts to your lifestyle seamlessly.",
          "SATISFACTION GUARANTEED: Backed by our 1-year warranty and dedicated 24/7 customer support team."
        ],
        htmlDescription: `<p><strong>Elevate Your Experience with the ${formData.productName}</strong></p>\n<p>Discover the perfect blend of style and functionality. Our product is designed to meet the rigorous demands of daily life while maintaining a sleek aesthetic.</p>\n<p><strong>Key Features:</strong></p>\n<ul>\n<li>Robust Construction</li>\n<li>Modern Design</li>\n<li>Easy Maintenance</li>\n</ul>`,
        searchTerms: "premium, durable, eco-friendly, home essentials, gift idea, high quality, sustainable, ergonomic design",
      });
      setIsLoading(false);
      setShowResults(true);
    }, 2000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...results.bullets];
    newBullets[index] = value;
    setResults({ ...results, bullets: newBullets });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans pb-20 relative">
       {/* Home Logo */}
       <div className="absolute top-6 left-6 z-10">
         <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-emerald-600/10 p-2 rounded-lg backdrop-blur-md border border-emerald-600/20 group-hover:bg-emerald-600/20 transition-all">
                <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-heading font-bold text-lg text-slate-800 tracking-tight hidden md:block">ShopsReady</span>
          </Link>
      </div>

      <header className="mb-12 text-center max-w-4xl mx-auto pt-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 flex items-center justify-center gap-3">
          <span className="text-orange-500">Amazon</span> Listing Optimizer
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Upload image & details to generate high-converting copy.
        </p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Inputs */}
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4 mb-2">
                <h2 className="text-2xl font-bold text-slate-800">Product Details</h2>
                <p className="text-slate-500 text-sm">Enter the raw data for your product.</p>
            </div>
            
            {/* Image Upload */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Product Image</label>
                <div className="relative group">
                     {!formData.image && (
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                    )}
                    <div className={`
                        border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition-all bg-slate-50 relative overflow-hidden
                        ${formData.image ? 'border-orange-200 bg-white' : 'border-slate-300 group-hover:border-orange-400 group-hover:bg-orange-50'}
                    `}>
                        {formData.image ? (
                            <>
                                <img src={formData.image} alt="Preview" className="h-full w-full object-contain p-2" />
                                <button 
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 p-1.5 bg-slate-900/50 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors z-20"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <>
                                <Upload className="w-10 h-10 text-slate-400 mb-2 group-hover:text-orange-500 transition-colors" />
                                <span className="text-slate-500 font-medium group-hover:text-orange-600">Click or Drop Image Here</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Product Name */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Product Name</label>
                <input 
                    type="text" 
                    value={formData.productName}
                    onChange={(e) => setFormData({...formData, productName: e.target.value})}
                    placeholder="e.g. Stainless Steel Garlic Press"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all font-medium text-slate-800"
                />
            </div>

            {/* Raw Features */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Key Features / Notes</label>
                <textarea 
                    value={formData.rawFeatures}
                    onChange={(e) => setFormData({...formData, rawFeatures: e.target.value})}
                    placeholder="e.g. 100% cotton, non-slip handle, dishwasher safe, lifetime warranty..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all h-40 resize-none font-medium text-slate-800"
                />
            </div>

            <button 
                onClick={handleGenerate}
                disabled={isLoading || !formData.productName}
                className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xl active:scale-[0.98] group"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-6 h-6 animate-spin" /> Generating...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" /> Generate Listing
                    </>
                )}
            </button>
        </section>

        {/* Right Column: Results */}
        <section className="bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-800 min-h-[800px] flex flex-col relative overflow-hidden">
             
             {/* Background decoration */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />

             {/* Idle State */}
             {!showResults && !isLoading && (
                 <div className="flex-grow flex flex-col items-center justify-center text-slate-600 space-y-6">
                     <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 dash-spin-slow">
                        <ShoppingBag className="w-10 h-10 opacity-40 text-slate-400" />
                     </div>
                     <p className="font-medium text-lg text-slate-500">Your optimized listing will appear here.</p>
                 </div>
             )}

             {/* Loading State */}
             {isLoading && (
                 <div className="flex-grow flex flex-col p-4 space-y-8 animate-pulse">
                     {/* Title Skeleton */}
                     <div className="space-y-3">
                        <div className="h-4 w-32 bg-slate-800 rounded" />
                        <div className="h-24 bg-slate-800/50 rounded-xl w-full" />
                     </div>

                     {/* Bullets Skeleton */}
                     <div className="space-y-4">
                        <div className="h-4 w-28 bg-slate-800 rounded" />
                        {[1, 2, 3, 4, 5].map((i) => (
                             <div key={i} className="flex gap-3">
                                <div className="w-6 h-6 rounded-full bg-slate-800 flex-shrink-0" />
                                <div className="h-16 bg-slate-800/50 rounded-lg w-full" />
                             </div>
                        ))}
                     </div>

                     {/* Description Skeleton */}
                     <div className="space-y-3">
                        <div className="h-4 w-40 bg-slate-800 rounded" />
                        <div className="h-40 bg-slate-800/50 rounded-xl w-full" />
                     </div>
                 </div>
             )}

             {/* Results State */}
             {showResults && (
                 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     
                     {/* 1. Title */}
                     <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Title
                            </label>
                            <button onClick={() => copyToClipboard(results.title)} className="text-slate-400 hover:text-white transition-colors p-1" title="Copy">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea 
                            value={results.title}
                            onChange={(e) => setResults({...results, title: e.target.value})}
                            className="w-full bg-slate-800/50 rounded-xl p-4 text-slate-200 border border-slate-700/50 focus:border-orange-500/50 focus:bg-slate-800 focus:outline-none transition-all resize-none h-28 leading-relaxed selection:bg-orange-500/30 font-medium"
                        />
                     </div>

                     {/* 2. Bullet Points */}
                     <div className="space-y-4">
                        <label className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2 px-1">
                            <ListIcon className="w-4 h-4" /> Bullet Points
                        </label>
                        <div className="space-y-3">
                            {results.bullets.map((bullet, i) => (
                                <div key={i} className="flex gap-3 group items-start">
                                     <div className="w-6 h-6 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center flex-shrink-0 mt-2 border border-orange-500/20 text-xs font-bold">
                                        {i + 1}
                                     </div>
                                     <div className="flex-grow relative">
                                        <textarea
                                            value={bullet}
                                            onChange={(e) => handleBulletChange(i, e.target.value)}
                                            className="w-full bg-slate-800/50 rounded-lg p-3 text-sm text-slate-300 border border-slate-700/50 focus:border-orange-500/50 focus:bg-slate-800 focus:outline-none transition-colors min-h-[80px] pr-8 resize-none selection:bg-orange-500/30"
                                        />
                                        <button 
                                            onClick={() => copyToClipboard(bullet)} 
                                            className="absolute top-2 right-2 text-slate-600 hover:text-white transition-colors p-1 opacity-0 group-hover:opacity-100"
                                            title="Copy bullet"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                     </div>
                                </div>
                            ))}
                        </div>
                     </div>

                     {/* 3. HTML Description */}
                     <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> HTML Description
                            </label>
                            <button onClick={() => copyToClipboard(results.htmlDescription)} className="text-slate-400 hover:text-white transition-colors p-1" title="Copy">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea 
                            value={results.htmlDescription}
                            onChange={(e) => setResults({...results, htmlDescription: e.target.value})}
                            className="w-full bg-slate-800/50 rounded-xl p-4 text-xs font-mono text-slate-400 border border-slate-700/50 focus:border-orange-500/50 focus:bg-slate-800 focus:outline-none transition-colors h-48 overflow-y-auto font-mono selection:bg-orange-500/30 leading-normal"
                        />
                     </div>

                     {/* 4. Backend Keywords */}
                     <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                                <Tag className="w-4 h-4" /> Backend Keywords
                            </label>
                            <button onClick={() => copyToClipboard(results.searchTerms)} className="text-slate-400 hover:text-white transition-colors p-1" title="Copy">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="relative">
                             <textarea 
                                value={results.searchTerms}
                                onChange={(e) => setResults({...results, searchTerms: e.target.value})}
                                className="w-full bg-slate-900 rounded-xl p-4 text-sm text-emerald-400 border-l-4 border-l-orange-500 border-y border-r border-slate-800 focus:outline-none focus:border-l-orange-400 transition-colors h-24 resize-none font-mono tracking-tight"
                            />
                        </div>
                     </div>

                 </div>
             )}

        </section>

      </main>
    </div>
  );
}
