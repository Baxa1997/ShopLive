'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, Check, ArrowRight, ArrowLeft, Loader2, FileSpreadsheet, Sparkles, AlertCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

interface ProductRow {
  handle: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  published: string;
  option1_name: string;
  option1_value: string;
  variant_price: string;
  variant_grams: number;
  variant_inventory_tracker: string;
  variant_inventory_qty: number;
  variant_sku: string;
  image_src: string;
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
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [usageCount, setUsageCount] = useState(0);

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
              handle: { type: SchemaType.STRING },
              title: { type: SchemaType.STRING },
              body_html: { type: SchemaType.STRING },
              vendor: { type: SchemaType.STRING },
              product_type: { type: SchemaType.STRING },
              tags: { type: SchemaType.STRING },
              published: { type: SchemaType.STRING },
              option1_name: { type: SchemaType.STRING },
              option1_value: { type: SchemaType.STRING },
              variant_sku: { type: SchemaType.STRING },
              variant_grams: { type: SchemaType.NUMBER },
              variant_inventory_tracker: { type: SchemaType.STRING },
              variant_inventory_qty: { type: SchemaType.NUMBER },
              variant_price: { type: SchemaType.STRING },
              image_src: { type: SchemaType.STRING },
            },
            required: [
              "handle", "title", "body_html", "vendor", "product_type", "tags", "published",
              "option1_name", "option1_value", "variant_sku", "variant_grams", 
              "variant_inventory_tracker", "variant_inventory_qty", "variant_price"
            ],
          },
        };

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema as any,
          },
        });

        const imagePart = await fileToGenerativePart(uploadedFile);

        const prompt = `Analyze this image and extract product data. CRITICAL RULES:

Never leave Vendor, Type, or Tags empty. If not found, infer them from the image context.

HTML: The description must be valid HTML (use <p>, <ul>, <li>).

Variants: If a product has multiple options (e.g., Blue, Red), create a separate row for each option sharing the same Handle.

Defaults: Use 100 for inventory and 500 for grams if not specified.
Always set variant_inventory_tracker to 'shopify'.
Remove '$' symbols from prices.`;

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
        const mockProducts: ProductRow[] = [
          {
            handle: 'classic-denim-jacket',
            title: 'Classic Denim Jacket',
            body_html: '<p>Premium denim jacket.</p>',
            vendor: 'Urban Threads',
            product_type: 'Outerwear',
            tags: 'denim, jacket',
            published: 'TRUE',
            option1_name: 'Title',
            option1_value: 'Default Title',
            variant_sku: 'DNM-JKT-001',
            variant_grams: 500,
            variant_inventory_tracker: 'shopify',
            variant_inventory_qty: 45,
            variant_price: '89.99',
            image_src: ''
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

  const handleProductChange = (index: number, field: keyof ProductRow, value: string) => {
    const updated = [...products];
    if (field === 'variant_grams' || field === 'variant_inventory_qty') {
      (updated[index][field] as number) = Number(value);
    } else {
      (updated[index][field] as string) = value;
    }
    setProducts(updated);
  };

  const generateCSV = () => {
    const headers = [
      'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published',
      'Option1 Name', 'Option1 Value', 'Variant Price', 'Variant Grams', 
      'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant SKU', 'Image Src'
    ];
    const rows = products.map(p => [
      p.handle,
      p.title,
      p.body_html,
      p.vendor,
      p.product_type,
      p.tags,
      p.published,
      p.option1_name,
      p.option1_value,
      p.variant_price,
      p.variant_grams,
      p.variant_inventory_tracker,
      p.variant_inventory_qty,
      p.variant_sku,
      p.image_src
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'shopify_import.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans pb-20 relative">

      <div className="absolute top-6 left-6 z-10">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="bg-emerald-600/10 p-2 rounded-lg backdrop-blur-md border border-emerald-600/20 group-hover:bg-emerald-600/20 transition-all">
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="font-heading font-bold text-lg text-slate-800 tracking-tight hidden md:block">ShopsReady</span>
        </Link>
      </div>

      <header className="mb-4 text-center max-w-4xl mx-auto pt-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4 flex items-center justify-center gap-3">
          <span className="text-green-600">Shopify</span> Product Importer
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Transform messy supplier data into perfect Shopify CSV files in 3 simple steps.
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
          <div className="bg-white rounded-3xl p-6 md:p-6 shadow-sm border border-slate-200 space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Upload Supplier Data</h2>
              <p className="text-slate-600">
                Paste text from your supplier&apos;s PDF, email, or spreadsheet. We will format it for Shopify.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-sm font-medium text-slate-500">Choose an option</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="file"
                    accept=".txt,.csv,.pdf,image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="file-upload"
                  />
                  <label 
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-green-300 rounded-xl bg-green-50/50 hover:bg-green-50 hover:border-green-400 transition-all cursor-pointer group h-48"
                  >
                    <Upload className="w-10 h-10 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-slate-900 mb-1">Upload File</span>
                    <span className="text-sm text-slate-500 text-center">PDF, Image, TXT, or CSV</span>
                    {fileName && (
                      <div className="mt-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium truncate max-w-full">
                        {fileName}
                      </div>
                    )}
                  </label>
                </div>

                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400 transition-all h-48 group">
                  <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-3 group-hover:text-slate-600 transition-colors" />
                  <span className="font-bold text-slate-900 mb-1">Or Paste Below</span>
                  <span className="text-sm text-slate-500 text-center">Type or copy your data</span>
                </div>
              </div>
            </div>


            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Example: Blue Shirt, Size M, SKU: 123, Price: $15.00&#10;Red Jacket, Size L, SKU: 456, Price: $45.00&#10;White Sneakers, Size 10, SKU: 789, Price: $89.99"
                className="w-full min-h-[280px] p-6 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-green-400 focus:outline-none focus:bg-white transition-all resize-none font-mono text-sm text-slate-700"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleAnalyze}
                disabled={isLoading || (!inputText.trim() && !fileName)}
                className="w-full py-5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xl group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" /> Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" /> Analyze & Convert
                  </>
                )}
              </button>
              <div className="text-center">
                <span className="text-sm text-slate-500 font-medium">Daily Usages Left: {Math.max(0, 10 - usageCount)}</span>
              </div>
            </div>
          </div>
        )}


        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 space-y-6">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Review Your Products</h2>
              <p className="text-slate-600">
                We detected <span className="font-bold text-green-600">{products.length} products</span>. Please check the details before exporting.
              </p>
            </div>

            <div className="overflow-x-auto -mx-8 md:-mx-12 px-8 md:px-12">
              <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left p-3 font-bold text-slate-700 text-sm">Handle</th>
                    <th className="text-left p-3 font-bold text-slate-700 text-sm">Title</th>
                    <th className="text-left p-3 font-bold text-slate-700 text-sm">Variant Price</th>
                    <th className="text-left p-3 font-bold text-slate-700 text-sm">Variant SKU</th>
                    <th className="text-left p-3 font-bold text-slate-700 text-sm">Inventory Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <input
                          type="text"
                          value={product.handle}
                          onChange={(e) => handleProductChange(idx, 'handle', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-green-500 focus:outline-none text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={product.title}
                          onChange={(e) => handleProductChange(idx, 'title', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-green-500 focus:outline-none text-sm font-medium"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={product.variant_price}
                          onChange={(e) => handleProductChange(idx, 'variant_price', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-green-500 focus:outline-none text-sm"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={product.variant_sku}
                          onChange={(e) => handleProductChange(idx, 'variant_sku', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-green-500 focus:outline-none text-sm font-mono"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={product.variant_inventory_qty}
                          onChange={(e) => handleProductChange(idx, 'variant_inventory_qty', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-green-500 focus:outline-none text-sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2"
              >
                Confirm & Generate CSV <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}


        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 space-y-8 text-center">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in duration-500">
                <Check className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Your File is Ready!</h2>
              <p className="text-slate-600 text-lg">
                Upload this CSV directly to your Shopify Admin panel.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 inline-block mx-auto">
              <div className="flex items-center gap-3 text-slate-700">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <div className="font-bold">shopify_import.csv</div>
                  <div className="text-sm text-slate-500">{products.length} products</div>
                </div>
              </div>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <button
                onClick={generateCSV}
                className="w-full py-5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2 text-xl group"
              >
                <Download className="w-6 h-6 group-hover:translate-y-1 transition-transform" /> Download shopify_import.csv
              </button>

              <button
                onClick={handleStartOver}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
              >
                Start Over
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
