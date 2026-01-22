'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, Check, ArrowRight, ArrowLeft, Loader2, FileSpreadsheet, Sparkles, AlertCircle, Package, ShoppingBag, Tag } from 'lucide-react';
import Link from 'next/link';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ShopifyVariant {
  option1_name: string;
  option1_value: string;
  variant_sku: string;
  variant_grams: number;
  variant_price: string;
  variant_inventory_qty: number;
  variant_inventory_tracker: string;
}

interface UnifiedProduct {
  internal_id: string;
  shopify_fields: {
    handle: string;
    title: string;
    body_html: string;
    vendor: string;
    product_type: string;
    tags: string;
    published: string;
    variants: ShopifyVariant[];
  };
  amazon_technical_data: {
    optimized_title: string;
    power_bullets: string[];
    backend_search_terms: string;
    item_type_keyword: string;
    target_audience: string;
    ai_semantic_summary: string;
    inventory_loader_mapping: {
      item_type_keyword: string;
      standard_product_id_type: string;
    };
  };
}


const fileToGenerativePart = async (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function ShopifyImporterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [activeAmazonToolId, setActiveAmazonToolId] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [usageCount, setUsageCount] = useState(0);
  const [inputTab, setInputTab] = useState<'upload' | 'manual'>('upload');

  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('import_usage_date');
    const savedCount = localStorage.getItem('import_count');

    if (savedDate !== today) {
      localStorage.setItem('import_usage_date', today);
      localStorage.setItem('import_count', '0');
      setUsageCount(0);
    } else {
      setUsageCount(Number(savedCount) || 0);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setUploadedFile(file);
    setError('');

    if (file.type === 'text/plain' || file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputText(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyze = async () => {
    if (usageCount >= 10) {
      alert("Daily Limit Reached (10/10). Please come back tomorrow!");
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
        throw new Error('API key not configured.');
      }

      if (uploadedFile && (uploadedFile.type.includes('image') || uploadedFile.type.includes('pdf'))) {
        
        const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);

        const schema = {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              internal_id: { type: SchemaType.STRING },
              shopify_fields: {
                type: SchemaType.OBJECT,
                properties: {
                  handle: { type: SchemaType.STRING },
                  title: { type: SchemaType.STRING },
                  body_html: { type: SchemaType.STRING },
                  vendor: { type: SchemaType.STRING },
                  product_type: { type: SchemaType.STRING },
                  tags: { type: SchemaType.STRING },
                  published: { type: SchemaType.STRING },
                  variants: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        option1_name: { type: SchemaType.STRING },
                        option1_value: { type: SchemaType.STRING },
                        variant_sku: { type: SchemaType.STRING },
                        variant_grams: { type: SchemaType.NUMBER },
                        variant_price: { type: SchemaType.STRING },
                        variant_inventory_qty: { type: SchemaType.NUMBER },
                        variant_inventory_tracker: { type: SchemaType.STRING },
                      }
                    }
                  }
                },
                required: ["handle", "title", "body_html", "vendor", "product_type", "tags", "published", "variants"]
              },
              amazon_technical_data: {
                type: SchemaType.OBJECT,
                properties: {
                  optimized_title: { type: SchemaType.STRING },
                  power_bullets: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                  },
                  backend_search_terms: { type: SchemaType.STRING },
                  item_type_keyword: { type: SchemaType.STRING },
                  target_audience: { type: SchemaType.STRING },
                  ai_semantic_summary: { type: SchemaType.STRING },
                  inventory_loader_mapping: {
                    type: SchemaType.OBJECT,
                    properties: {
                      item_type_keyword: { type: SchemaType.STRING },
                      standard_product_id_type: { type: SchemaType.STRING }
                    }
                  }
                },
                required: ["optimized_title", "power_bullets", "backend_search_terms", "item_type_keyword", "target_audience", "ai_semantic_summary", "inventory_loader_mapping"]
              }
            },
            required: ["internal_id", "shopify_fields", "amazon_technical_data"]
          }
        };

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema as any,
          },
        });

        const imagePart = await fileToGenerativePart(uploadedFile);

        const prompt = `Role: You are a Senior Amazon Marketplace Strategist and Technical Data Engineer. Your goal is to convert raw product data into an "Elite Tier" Amazon FBA listing that is 100% compliant with Amazon's Style Guides and optimized for high-conversion mobile shopping.

Task: Analyze the attached PDF/Image. Extract and structure data for Shopify/Amazon.

Amazon Listing instructions:
1. Title Architecture (Mobile-First):
   Formula: [Brand] + [Core Keyword] + [Top Benefit] + [Key Material/Feature] + [Unit Count/Size/Color].
   Ensure it is between 150-190 characters. Ensure most important keywords are in the first 80 characters.

2. Power-Bullet Logic (5 Bullets):
   Each bullet MUST start with a BOLDED CAPITALIZED HEADER followed by a colon.
   Bullet 1 (Immediate Solution): What is the "Job to be Done"?
   Bullet 2 (Technical Superiority): Durability, materials, and craftsmanship.
   Bullet 3 (User Experience): Explain the "feel" or specific use case.
   Bullet 4 (Safety & Compliance): Mention certifications (FDA, BPA-free), exact dimensions in inches, care instructions.
   Bullet 5 (The Brand Promise): Call to action regarding quality and support.

3. Technical Meta-Data:
   item_type_keyword: Suggest accurate Amazon "Item Type Keyword" for Flat File.
   backend_search_terms: 250 bytes. No brand names, no commas, no repetition.
   target_audience: Explicitly state who this is for and where it should be used.

4. SEO for "Rufus" (Amazon AI):
   ai_semantic_summary: 3-sentence description for AI crawlers to help product surface in natural language queries.

Shopify Requirements:
- HTML descriptions (<p>, <ul>, <li>).
- grams: 500 default.
- handle: unique slugs.`;

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        const parsedProducts = JSON.parse(text);

        if (!Array.isArray(parsedProducts)) {
            throw new Error("Invalid response format from AI");
        }

        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('import_count', newCount.toString());

        setProducts(parsedProducts);
        setCurrentStep(2);

      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockProducts: UnifiedProduct[] = [
          {
            internal_id: '1',
            shopify_fields: {
              handle: 'classic-denim-jacket',
              title: 'Classic Denim Jacket',
              body_html: '<p>Premium denim jacket.</p>',
              vendor: 'Urban Threads',
              product_type: 'Outerwear',
              tags: 'denim, jacket',
              published: 'TRUE',
              variants: [
                {
                  option1_name: 'Title',
                  option1_value: 'Default Title',
                  variant_sku: 'DNM-JKT-001',
                  variant_grams: 500,
                  variant_price: '89.99',
                  variant_inventory_qty: 45,
                  variant_inventory_tracker: 'shopify'
                }
              ]
            },
            amazon_technical_data: {
              optimized_title: 'Urban Threads Classic Denim Jacket - Mobile Optimized Rugged Outerwear - Men\'s Medium Blue - Durable Cotton',
              power_bullets: [
                'IMMEDIATE SOLUTION: Provides instant warmth and a timeless rugged aesthetic for shifting seasons.',
                'TECHNICAL SUPERIORITY: Reinforced with 14oz heavy-duty denim and double-stitched seams for maximum durability.',
                'USER EXPERIENCE: Designed for a relaxed fit that feels broken-in from Day 1, ideal for layering.',
                'SAFETY & COMPLIANCE: 100% Cotton; Lead-free buttons; Machine washable. Back length measures 28 inches.',
                'THE BRAND PROMISE: We stand by our craftsmanship with a 5-year guarantee on all stitching and fabric.'
              ],
              backend_search_terms: 'denim jacket blue outerwear men fashion rugged classic gift daily wear worker style',
              item_type_keyword: 'jacket',
              target_audience: 'Fashion-forward men looking for durable everyday outerwear.',
              ai_semantic_summary: 'A classic denim jacket that balances style and durability. Ideal for men seeking a reliable piece for layering in spring or autumn. Made from pre-shrunk cotton for a perfect fit.',
              inventory_loader_mapping: {
                item_type_keyword: 'jacket',
                standard_product_id_type: 'UPC'
              }
            }
          }
        ];
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('import_count', newCount.toString());

        setProducts(mockProducts);
        setCurrentStep(2);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      if (err.response) {
        console.error('API Error Response:', err.response);
      }
      setError(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShopifyChange = (pIdx: number, field: string, value: string) => {
    const updated = [...products];
    const product = updated[pIdx];
    (product.shopify_fields as any)[field] = value;
    setProducts(updated);
  };

  const handleVariantChange = (pIdx: number, vIdx: number, field: keyof ShopifyVariant, value: string) => {
    const updated = [...products];
    const variant = updated[pIdx].shopify_fields.variants[vIdx];
    if (field === 'variant_grams' || field === 'variant_inventory_qty') {
      (variant[field] as number) = Number(value);
    } else {
      (variant[field] as string) = value;
    }
    setProducts(updated);
  };

  const generateCSV = () => {
    const headers = [
      'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
      'Option1 Name', 'Option1 Value', 'Variant Price', 'Variant Grams', 
      'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant SKU', 'Image Src'
    ];
    
    const rows: any[] = [];
    products.forEach(p => {
      p.shopify_fields.variants.forEach(v => {
        rows.push([
          p.shopify_fields.handle,
          p.shopify_fields.title,
          p.shopify_fields.body_html,
          p.shopify_fields.vendor,
          p.shopify_fields.product_type,
          p.shopify_fields.tags,
          p.shopify_fields.published,
          v.option1_name,
          v.option1_value,
          v.variant_price,
          v.variant_grams,
          v.variant_inventory_tracker,
          v.variant_inventory_qty,
          v.variant_sku,
          '' // image_src placeholder
        ]);
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map((cell: any) => `"${cell || ''}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  const downloadShopifyCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'shopify_import.csv');
    link.click();
  };

  const downloadMultiChannelPackage = async () => {
    const zip = new JSZip();
    
    // 1. Shopify CSV
    zip.file('shopify_import.csv', generateCSV());
    
    // 2. Amazon Listings (Text format)
    let amazonContent = "AMAZON PRODUCT LISTINGS\n=======================\n\n";
    products.forEach(p => {
      amazonContent += `Product: ${p.shopify_fields.title}\n`;
      amazonContent += `Amazon Optimized Title: ${p.amazon_technical_data.optimized_title}\n`;
      amazonContent += `Item Type Keyword: ${p.amazon_technical_data.item_type_keyword}\n`;
      amazonContent += `Target Audience: ${p.amazon_technical_data.target_audience}\n`;
      amazonContent += `Backend Search Terms: ${p.amazon_technical_data.backend_search_terms}\n`;
      amazonContent += `AI Semantic Summary: ${p.amazon_technical_data.ai_semantic_summary}\n\n`;
      amazonContent += `Power Bullets:\n`;
      p.amazon_technical_data.power_bullets.forEach((bp, i) => {
        amazonContent += `${i+1}. ${bp}\n`;
      });
      amazonContent += "\n-----------------------\n\n";
    });
    zip.file('amazon_listings.txt', amazonContent);
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'ShopsReady_MultiChannel_Package.zip');
  };

  const handleConfirm = () => {
    setCurrentStep(3);
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setInputText('');
    setProducts([]);
    setFileName('');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-6 font-sans pb-10 relative">

      <div className="fixed top-6 left-6 z-50">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-emerald-600/10 p-2 rounded-lg backdrop-blur-md border border-emerald-600/20 group-hover:bg-emerald-600/20 transition-all shadow-sm">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="font-heading font-bold text-lg text-slate-800 tracking-tight hidden md:block">ShopsReady</span>
        </Link>
      </div>

      <header className="mb-4 text-center max-w-4xl mx-auto pt-10 relative">
        <div className="flex items-center justify-center gap-6 md:gap-12 mb-4">
          <div className="hidden md:flex flex-col items-center gap-1 transition-opacity">
            <div className="w-12 h-12 bg-[#95BF47] rounded-xl flex items-center justify-center shadow-lg transform -rotate-12">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <span className="text-[10px] font-black text-[#95BF47] uppercase tracking-tighter">Shopify</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-3">
            <span className="text-emerald-600">Unified</span> Multi-Channel Importer
          </h1>

          <div className="hidden md:flex flex-col items-center gap-1 transition-opacity">
            <div className="w-12 h-12 bg-[#FF9900] rounded-xl flex items-center justify-center shadow-lg transform rotate-12">
              <Package className="w-7 h-7 text-white" />
            </div>
            <span className="text-[10px] font-black text-[#FF9900] uppercase tracking-tighter">Amazon</span>
          </div>
        </div>
        <p className="text-lg text-slate-600 max-w-4xl mx-auto font-medium">
          Transform messy supplier data into high-converting <span className="font-bold text-emerald-600">Shopify CSVs</span> and <span className="text-orange-600 font-bold">Amazon Listings</span>.
        </p>
      </header>


      <div className="max-w-5xl mx-auto mb-4">
        <div className="flex items-center justify-between relative">
          {[
            { num: 1, label: 'Input Data' },
            { num: 2, label: 'Review & Edit' },
            { num: 3, label: 'Download CSV' }
          ].map((step, idx) => (
            <div key={step.num} className="flex-1 flex flex-col items-center relative z-10">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                currentStep > step.num ? 'bg-green-500 text-white' :
                currentStep === step.num ? 'bg-green-600 text-white ring-4 ring-green-200' :
                'bg-slate-200 text-slate-400'
              }`}>
                {currentStep > step.num ? <Check className="w-6 h-6" /> : step.num}
              </div>
              <span className={`mt-2 text-sm font-medium ${currentStep >= step.num ? 'text-slate-900' : 'text-slate-400'}`}>
                {step.label}
              </span>
              {idx < 2 && (
                <div className={`absolute top-6 left-1/2 w-full h-0.5 -z-10 ${currentStep > step.num ? 'bg-green-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>


      <main className="max-w-5xl mx-auto">
        

        {currentStep === 1 && (
          <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-200 max-w-3xl mx-auto overflow-hidden">
            <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8">
              <button
                onClick={() => setInputTab('upload')}
                className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
                  inputTab === 'upload' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Upload className="w-4 h-4" /> Upload Supplier File
              </button>
              <button
                onClick={() => setInputTab('manual')}
                className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
                  inputTab === 'manual' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Manually Type Data
              </button>
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {inputTab === 'upload' ? (
                <div className="relative w-full">
                  <input
                    type="file"
                    accept=".txt,.csv,.pdf,image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-emerald-200 rounded-3xl bg-emerald-50/20 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all cursor-pointer group h-56 shadow-inner"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-emerald-600" />
                    </div>
                    <span className="font-bold text-slate-900 text-xl mb-1">Click to Upload</span>
                    <span className="text-sm text-slate-500 text-center max-w-xs">Attach a PDF, Image, CSV or Text file from your supplier.</span>
                    {fileName && (
                      <div className="mt-4 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold ring-2 ring-emerald-200 animate-bounce">
                        {fileName}
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative group">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Example: Blue Shirt, Size M, SKU: 123, Price: $15.00&#10;Red Jacket, Size L, SKU: 456, Price: $45.00"
                      className="w-full min-h-[220px] p-6 rounded-3xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:outline-none focus:bg-white transition-all resize-none font-mono text-sm text-slate-700 shadow-inner group-hover:border-slate-300"
                    />
                    <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-100 transition-opacity">
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-medium mt-6">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-2 pt-2 border-t border-slate-100 space-y-4">
              <button
                onClick={handleAnalyze}
                disabled={isLoading || (inputTab === 'upload' ? !fileName : !inputText.trim())}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl hover:shadow-slate-200 shadow-slate-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Analyzing Everything...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Start Unified Sync
                  </>
                )}
              </button>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limit: {10 - usageCount} syncs remaining today</span>
              </div>
            </div>
          </div>
        )}


        {currentStep === 2 && (
          <div className="space-y-10">
            {/* Sticky Header */}
            <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-md rounded-2xl p-3 md:p-4 shadow-lg border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3 transition-all">
              <div className="text-center md:text-left">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-none mb-1">Review Your Products</h2>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                  <span className="text-green-600 font-black">{products.length} Products</span> • {products.reduce((acc, p) => acc + p.shopify_fields.variants.length, 0)} Variants Detected
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => downloadMultiChannelPackage()}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl group"
                >
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" /> Sync Package
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Confirm & Sync <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {products.map((product, pIdx) => (
                <div key={product.internal_id || pIdx} className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden animate-in fade-in duration-300">
                  <div className="p-4 md:p-6 space-y-6">
                    {/* Header Row */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                          {pIdx + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Product #{pIdx + 1}</h3>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Review detected information</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-full border border-emerald-100 uppercase tracking-tight">Shopify Ready</div>
                        <div className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[9px] font-bold rounded-full border border-orange-100 uppercase tracking-tight">Amazon Ready</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left: Product Info */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Title</label>
                            <input
                              type="text"
                              value={product.shopify_fields.title}
                              onChange={(e) => handleShopifyChange(pIdx, 'title', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-semibold text-slate-900 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Vendor</label>
                            <input
                              type="text"
                              value={product.shopify_fields.vendor}
                              onChange={(e) => handleShopifyChange(pIdx, 'vendor', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-semibold text-slate-700 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Handle / URL</label>
                            <input
                              type="text"
                              value={product.shopify_fields.handle}
                              onChange={(e) => handleShopifyChange(pIdx, 'handle', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-400 text-xs font-mono text-slate-600 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Type / Category</label>
                            <input
                              type="text"
                              value={product.shopify_fields.product_type}
                              onChange={(e) => handleShopifyChange(pIdx, 'product_type', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-400 text-sm font-semibold text-slate-700 outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: Marketplace Info */}
                      <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                          <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Elite FBA Strategy</span>
                          <button 
                            onClick={() => setActiveAmazonToolId(activeAmazonToolId === product.internal_id ? null : product.internal_id)}
                            className="text-[9px] font-bold text-orange-600 hover:text-orange-700 underline flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            {activeAmazonToolId === product.internal_id ? 'Hide Strategy' : 'View Full Optimization'}
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">Item Type Keyword</span>
                            <p className="text-xs font-bold text-slate-700 truncate">{product.amazon_technical_data.item_type_keyword}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">Target Audience</span>
                            <p className="text-[10px] text-slate-600 line-clamp-1 italic">{product.amazon_technical_data.target_audience}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">Mobile-First Title</span>
                            <div className="group/copy relative">
                                <p className="text-[10px] font-medium text-slate-800 line-clamp-2 bg-white p-2 rounded border border-slate-200 leading-tight">
                                    {product.amazon_technical_data.optimized_title}
                                </p>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(product.amazon_technical_data.optimized_title)}
                                    className="absolute right-1 top-1 p-1 bg-slate-100 rounded opacity-0 group-hover/copy:opacity-100 transition-opacity"
                                    title="Copy Title"
                                >
                                    <Download className="w-3 h-3 text-slate-600" />
                                </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Preview Section */}
                    {activeAmazonToolId === product.internal_id && (
                      <div className="p-4 bg-slate-900 rounded-xl text-white animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                            <div>
                                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">FBA Power Bullets</h4>
                                <p className="text-[9px] text-slate-400 mt-1">Benefit-Driven • Mobile Optimized</p>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium text-right">
                                <span className="block">HEADERS: BOLD & CAPS</span>
                                <span className="block opacity-50 text-[8px]">Job to be Done • Technical • UX</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {product.amazon_technical_data.power_bullets.map((bp, i) => (
                            <div key={i} className="flex items-start gap-3 group/bp bg-white/5 p-3 rounded-lg border border-white/10 hover:border-emerald-500/50 transition-all">
                              <div className="flex-1 text-[11px] text-slate-200 leading-relaxed">
                                {bp.includes(':') ? (
                                    <>
                                        <span className="font-black text-white uppercase tracking-wider">{bp.split(':')[0]}:</span>
                                        {bp.split(':').slice(1).join(':')}
                                    </>
                                ) : (
                                    bp
                                )}
                              </div>
                              <button 
                                onClick={() => navigator.clipboard.writeText(bp)}
                                className="p-1.5 bg-white/10 rounded-md hover:bg-emerald-500 transition-colors"
                                title="Copy Bullet Point"
                              >
                                <Check className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Backend Search Terms (250 bytes)</span>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(product.amazon_technical_data.backend_search_terms)}
                                        className="text-[9px] text-emerald-400 hover:underline"
                                    >
                                        Copy Keywords
                                    </button>
                                </div>
                                <p className="text-[10px] font-mono text-slate-500 bg-black/30 p-2 rounded break-words min-h-[40px]">
                                    {product.amazon_technical_data.backend_search_terms}
                                </p>
                            </div>
                            <div className="pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">Rufus SEO (AI Crawler Context)</span>
                                        <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                    {product.amazon_technical_data.ai_semantic_summary}
                                </p>
                            </div>
                        </div>
                      </div>
                    )}

                    {/* Variants Table */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Product Variants</h4>
                      <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300">
                              <th className="p-2 font-bold text-slate-600 uppercase tracking-tighter">Variant Value</th>
                              <th className="p-2 font-bold text-slate-600 text-center uppercase tracking-tighter">Price</th>
                              <th className="p-2 font-bold text-slate-600 uppercase tracking-tighter">SKU</th>
                              <th className="p-2 font-bold text-slate-600 text-center uppercase tracking-tighter">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {product.shopify_fields.variants.map((v, vIdx) => (
                              <tr key={vIdx} className="hover:bg-slate-50 transition-colors">
                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={v.option1_value}
                                    onChange={(e) => handleVariantChange(pIdx, vIdx, 'option1_value', e.target.value)}
                                    className="w-full bg-transparent font-bold text-slate-900 outline-none border-b border-transparent focus:border-emerald-500"
                                  />
                                </td>
                                <td className="p-2 w-24 border-x border-slate-200">
                                  <div className="flex items-center justify-center">
                                    <span className="text-slate-400 mr-0.5">$</span>
                                    <input
                                      type="text"
                                      value={v.variant_price}
                                      onChange={(e) => handleVariantChange(pIdx, vIdx, 'variant_price', e.target.value)}
                                      className="w-12 bg-transparent font-bold text-slate-700 outline-none text-center"
                                    />
                                  </div>
                                </td>
                                <td className="p-2 border-r border-slate-200">
                                  <input
                                    type="text"
                                    value={v.variant_sku}
                                    onChange={(e) => handleVariantChange(pIdx, vIdx, 'variant_sku', e.target.value)}
                                    className="w-full bg-transparent font-mono text-[10px] text-slate-500 outline-none"
                                  />
                                </td>
                                <td className="p-2 w-20 text-center">
                                  <input
                                    type="number"
                                    value={v.variant_inventory_qty}
                                    onChange={(e) => handleVariantChange(pIdx, vIdx, 'variant_inventory_qty', e.target.value)}
                                    className="w-full bg-transparent font-bold text-emerald-600 outline-none text-center"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Back & Next Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10 border-t border-slate-200/60 max-w-4xl mx-auto">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-8 py-4 text-slate-400 font-black hover:text-slate-900 transition-all flex items-center gap-3 group/back text-sm uppercase tracking-widest"
              >
                <div className="w-10 h-10 rounded-xl border-2 border-slate-100 flex items-center justify-center group-hover/back:border-slate-900 group-hover/back:bg-slate-900 group-hover/back:text-white transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                Return to Inputs
              </button>
              <div className="flex gap-4 w-full md:w-auto">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 md:flex-none px-12 py-5 bg-emerald-600 text-white font-black rounded-[1.5rem] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 text-lg ring-4 ring-white"
                >
                  Confirm & Sync All <ArrowRight className="w-6 h-6 animate-pulse" />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-slate-100 text-center max-w-xl mx-auto relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
            
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner group transition-transform hover:scale-110 duration-500">
              <Check className="w-10 h-10" />
            </div>
            
            <div className="space-y-3 mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">You&apos;re <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">ShopsReady!</span></h2>
              <p className="text-base text-slate-500 max-w-md mx-auto leading-relaxed">
                Your high-conversion product data is ready for both **Shopify** and **Amazon**.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mb-10 text-center">
              <button
                onClick={() => downloadMultiChannelPackage()}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 text-lg group ring-4 ring-slate-50"
              >
                <Package className="w-6 h-6 group-hover:rotate-12 transition-transform" /> Download Sync Package
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => downloadShopifyCSV()}
                  className="py-3 bg-white border-2 border-slate-100 text-slate-600 font-bold rounded-xl hover:border-emerald-200 hover:text-emerald-700 transition-all flex items-center justify-center gap-2 text-xs shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Shopify CSV
                </button>
                <button
                   onClick={() => downloadMultiChannelPackage()} 
                   className="py-3 bg-white border-2 border-slate-100 text-slate-600 font-bold rounded-xl hover:border-orange-200 hover:text-orange-700 transition-all flex items-center justify-center gap-2 text-xs shadow-sm"
                >
                  <Package className="w-3.5 h-3.5" /> Amazon Text
                </button>
              </div>
            </div>

          
          </div>
        )}

      </main>
    </div>
  );
}
