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
  amazon_fields: {
    category_suggestion: string;
    bullet_points: string[];
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
              amazon_fields: {
                type: SchemaType.OBJECT,
                properties: {
                  category_suggestion: { type: SchemaType.STRING },
                  bullet_points: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                  },
                  inventory_loader_mapping: {
                    type: SchemaType.OBJECT,
                    properties: {
                      item_type_keyword: { type: SchemaType.STRING },
                      standard_product_id_type: { type: SchemaType.STRING }
                    }
                  }
                }
              }
            },
            required: ["internal_id", "shopify_fields", "amazon_fields"]
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

        const prompt = `Role: You are a senior E-commerce Data Engineer specializing in Shopify and Amazon marketplace logistics.

Task: Analyze the attached PDF product catalog. Extract all product data and structure it to be "Ready" for both Shopify and Amazon platforms.

Extraction Requirements:
1. Unified Schema: Identify Title, Price, SKU, Weight, and all Variants (Size, Color, Material).
2. Amazon Category Mapping: Based on the product type, predict the most accurate Amazon "Product Type" or "Category" (e.g., Home_Decoration or Pet_Supplies).
3. Amazon Bullet Point Optimizer: Generate 5 high-converting bullet points following Amazon’s strict character limits (max 200 chars per bullet).
   Logic: Bullet 1: Top Benefit; Bullet 2: Material/Quality; Bullet 3: Best Use Case; Bullet 4: Dimensions/Specs; Bullet 5: Warranty/Trust.
4. Shopify Handle Logic: Create a clean, unique "Handle" for each product to ensure correct variant grouping in the CSV.

CRITICAL RULES:
- Never leave Vendor, Type, or Tags empty.
- HTML: The description must be valid HTML (use <p>, <ul>, <li>).
- Shopify Defaults: Use 500 for grams and 'shopify' for variant_inventory_tracker if not specified.
- Remove '$' symbols from prices.`;

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
            amazon_fields: {
              category_suggestion: 'Outerwear',
              bullet_points: [
                'Premium quality denim for long-lasting durability.',
                'Classic design that never goes out of style.',
                'Perfect for casual outings and layering.',
                'Available in multiple sizes for comfortable fit.',
                'Buy with confidence with our satisfaction guarantee.'
              ],
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
      amazonContent += `Category: ${p.amazon_fields.category_suggestion}\n`;
      amazonContent += `Keywords: ${p.amazon_fields.inventory_loader_mapping.item_type_keyword}\n\n`;
      amazonContent += `Bullet Points:\n`;
      p.amazon_fields.bullet_points.forEach((bp, i) => {
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
                          <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Marketplace AI</span>
                          <button 
                            onClick={() => setActiveAmazonToolId(activeAmazonToolId === product.internal_id ? null : product.internal_id)}
                            className="text-[9px] font-bold text-orange-600 hover:text-orange-700 underline"
                          >
                            {activeAmazonToolId === product.internal_id ? 'Hide Details' : 'View AI Bullet Points'}
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">Amazon Category</span>
                            <p className="text-xs font-bold text-slate-700 truncate">{product.amazon_fields.category_suggestion}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-500 uppercase">Search Keyword</span>
                            <p className="text-xs font-mono text-slate-500 truncate">{product.amazon_fields.inventory_loader_mapping.item_type_keyword}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Preview Section */}
                    {activeAmazonToolId === product.internal_id && (
                      <div className="p-4 bg-slate-900 rounded-xl text-white animate-in slide-in-from-top-2 duration-300">
                        <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">AI Suggested Bullet Points</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {product.amazon_fields.bullet_points.map((bp, i) => (
                            <div key={i} className="text-[11px] text-slate-300 leading-relaxed border-l-2 border-emerald-500/30 pl-2">
                              {bp}
                            </div>
                          ))}
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
