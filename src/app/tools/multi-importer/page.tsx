'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Check, ArrowRight, ArrowLeft, Loader2, FileSpreadsheet, Sparkles, AlertCircle, Package, ShoppingBag, Tag, Settings, X, Globe } from 'lucide-react';
import Link from 'next/link';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { PDFDocument } from 'pdf-lib';

interface MasterArchitectVariant {
  sku: string;
  price: string;
  option1_name: string;
  option1_value: string;
  grams: number;
  inventory_qty: number;
}

interface UnifiedProduct {
  sync_id: string;
  success_feedback: {
    total_variants: number;
    channels_ready: string[];
    summary_message: string;
  };
  shopify_service: {
    handle: string;
    title: string;
    html_description: string;
    tags: string;
    vendor: string;
    product_type: string;
    google_product_category: string;
    seo_title: string;
    seo_description: string;
    variants: MasterArchitectVariant[];
  };
  amazon_fba_service: {
    flat_file_data: {
      item_name: string;
      item_type_keyword: string;
      feed_product_type: string;
      brand_name: string;
      standard_price: string;
      bullets: string[];
    };
    search_terms: string;
    rufus_summary: string;
  };
  aplus_content_service: {
    modules: { header: string; body: string }[];
    image_alt_text: string;
  };
  readiness_report: {
    status: string;
    missing_fields: string[];
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

  // Advanced Configuration State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [userConfig, setUserConfig] = useState({
    defaultQty: 100,
    priceMarkup: 1.0,
    defaultType: 'General Merchandise',
    targetChannels: 'Both' as 'Shopify' | 'Amazon' | 'Both'
  });
  const [isConfigConfirmed, setIsConfigConfirmed] = useState(false);
  const [activeMarketplace, setActiveMarketplace] = useState<'shopify' | 'amazon' | 'both' | null>(null);

  useEffect(() => {
    const savedMarketplace = sessionStorage.getItem('active_marketplace');
    if (savedMarketplace) {
      setActiveMarketplace(savedMarketplace as any);
    }


    return () => {
      sessionStorage.removeItem('active_marketplace');
    };
  }, []);

  const handleMarketplaceSelect = (choice: 'shopify' | 'amazon' | 'both') => {
    setActiveMarketplace(choice);
    sessionStorage.setItem('active_marketplace', choice);
    setUserConfig(prev => ({
      ...prev,
      targetChannels: choice === 'both' ? 'Both' : (choice === 'shopify' ? 'Shopify' : 'Amazon')
    }));
  };

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

  const extractData = async (file: File | Blob, apiKey: string, config: typeof userConfig, isConfigConfirmed: boolean): Promise<UnifiedProduct[]> => {
    const genAI = new GoogleGenerativeAI(apiKey);

    const schema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          sync_id: { type: SchemaType.STRING },
          success_feedback: {
            type: SchemaType.OBJECT,
            properties: {
              total_variants: { type: SchemaType.NUMBER },
              channels_ready: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING }
              },
              summary_message: { type: SchemaType.STRING }
            },
            required: ["total_variants", "channels_ready", "summary_message"]
          },
          shopify_service: {
            type: SchemaType.OBJECT,
            properties: {
              handle: { type: SchemaType.STRING },
              title: { type: SchemaType.STRING },
              html_description: { type: SchemaType.STRING },
              tags: { type: SchemaType.STRING },
              vendor: { type: SchemaType.STRING },
              product_type: { type: SchemaType.STRING },
              google_product_category: { type: SchemaType.STRING },
              seo_title: { type: SchemaType.STRING },
              seo_description: { type: SchemaType.STRING },
              variants: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    sku: { type: SchemaType.STRING },
                    price: { type: SchemaType.STRING },
                    option1_name: { type: SchemaType.STRING },
                    option1_value: { type: SchemaType.STRING },
                    grams: { type: SchemaType.NUMBER },
                    inventory_qty: { type: SchemaType.NUMBER },
                  }
                }
              }
            },
            required: ["handle", "title", "html_description", "tags", "vendor", "product_type", "google_product_category", "seo_title", "seo_description", "variants"]
          },
          amazon_fba_service: {
            type: SchemaType.OBJECT,
            properties: {
              flat_file_data: {
                type: SchemaType.OBJECT,
                properties: {
                  item_name: { type: SchemaType.STRING },
                  item_type_keyword: { type: SchemaType.STRING },
                  feed_product_type: { type: SchemaType.STRING },
                  brand_name: { type: SchemaType.STRING },
                  standard_price: { type: SchemaType.STRING },
                  bullets: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                  }
                }
              },
              search_terms: { type: SchemaType.STRING },
              rufus_summary: { type: SchemaType.STRING }
            },
            required: ["flat_file_data", "search_terms", "rufus_summary"]
          },
          aplus_content_service: {
            type: SchemaType.OBJECT,
            properties: {
              modules: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    header: { type: SchemaType.STRING },
                    body: { type: SchemaType.STRING }
                  }
                }
              },
              image_alt_text: { type: SchemaType.STRING }
            }
          },
          readiness_report: {
            type: SchemaType.OBJECT,
            properties: {
              status: { type: SchemaType.STRING },
              missing_fields: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING }
              }
            }
          }
        },
        required: ["sync_id", "shopify_service", "amazon_fba_service", "aplus_content_service", "readiness_report"]
      }
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
      },
    });

    // Handle File or Blob casting for fileToGenerativePart
    // If it's a Blob, we might need to cast it or wrap it in a File object if possible, 
    // or ensure fileToGenerativePart accepts Blobs. 
    // fileToGenerativePart reads with FileReader which works on Blobs too.
    const imagePart = await fileToGenerativePart(file as File);

    const target_system = config.targetChannels === 'Both' ? ['shopify', 'amazon'] : config.targetChannels.toLowerCase();

    const prompt = `Act as a Senior Marketplace Architect. 

Goal: Process product data from PDF for high-integrity export.
Selected Output Channels: ${config.targetChannels} (Target: ${JSON.stringify(target_system)}).

1. Dynamic Identity & Vendor Detection:
- **Source:** Extract the brand/manufacturer name directly from PDF logos, headers, or "Brand" fields.
- **Strict Rule:** NEVER use 'ShopsReady'. 
- **Vendor Logic:** If a specific brand is not found, identify the **Supplier/Company name** from the PDF header. Only use 'Generic' as an absolute last resort if the field is mandatory; otherwise, leave it blank.

2. Product Titles & Metadata:
- **Titles:** Use the EXACT product titles found in the PDF. Do not rewrite or "optimize" them unless specifically for Amazon formatting (Brand + Title).
- **Amazon Titles:** [Brand] + [Exact PDF Title] + [Model Number].

3. Description Logic (Authentic Extraction):
- **Source:** Use ONLY the descriptions provided in the PDF. Do not add external info or "marketing fluff."
- **Summarization:** If the PDF description is excessively long (over 1000 characters), summarize it while retaining all technical specs and key features.
- **Shopify Formatting:** Convert the PDF description into professional HTML using <strong> and <li> tags.
- **Amazon Formatting:** Convert the PDF description into clean, raw text (no HTML).

4. Amazon-Specific Optimization:
- **Browse Nodes:** Map the product to the most specific Amazon 'Recommended Browse Node' path.
- **Bullet Points (Bold Caps):** Extract 5 key features from the PDF and format them as BOLD CAPS bullets (e.g., 'MATERIAL: 100% Cotton'). Do not invent new features.
- **Search Terms:** Extract 250 characters of keywords based strictly on the PDF content.

5. Inventory & Pricing (Scan-First Logic):
- **Stock:** 1. Scan PDF for "Quantity", "Stock", or "Available". Use exact values found.
    2. IF NO STOCK INFO IN PDF: Use ${config.defaultQty} ONLY IF 'Config Status' is true. 
    3. IF 'Config Status' is false and no PDF stock exists, output '0'. 
- **Cost Detection:** Extract 'Wholesale' or 'Net' price.
- **Markup:** IF 'Config Status' is true, multiply by ${config.priceMarkup}.

6. Shopify 'Full-Auto' Taxonomy:
- **Standard Product Type:** Use the full breadcrumb path based on PDF product category.
- **Handle Logic:** Ensure all color/size variants share a single 'Handle' for grouping.

7. Output formatting:
- Map to ${config.targetChannels} specific headers. Return ONLY a valid JSON object. No generic filler data.`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    const parsedProducts = JSON.parse(text);

    if (!Array.isArray(parsedProducts)) {
        throw new Error("Invalid response format from AI");
    }

    return parsedProducts;
  };

  const handleAnalyze = async () => {
    if (usageCount >= 5) {
      alert("Daily Limit Reached (5/5). Please come back tomorrow!");
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
        throw new Error('API key not configured.');
      }

      if (uploadedFile && uploadedFile.type === 'application/pdf') {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const totalPages = pdfDoc.getPageCount();
        const batchSize = 10;
        
        let hasProcessedAtLeastOne = false;

        for (let i = 0; i < totalPages; i += batchSize) {
          const subDoc = await PDFDocument.create();
          const pageIndices = [];
          for (let j = 0; j < batchSize && (i + j) < totalPages; j++) {
            pageIndices.push(i + j);
          }
          
          const copiedPages = await subDoc.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach((page: any) => subDoc.addPage(page));
          
          const pdfBytes = await subDoc.save();
          const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
          const fileChunk = new File([blob], `chunk_${i}.pdf`, { type: 'application/pdf' });

          try {
            const chunkProducts = await extractData(fileChunk, process.env.NEXT_PUBLIC_GOOGLE_API_KEY, userConfig, isConfigConfirmed);
            setProducts(prev => [...prev, ...chunkProducts]);
            hasProcessedAtLeastOne = true;
          } catch (chunkErr) {
            console.error(`Error processing chunk ${i}-${i+batchSize}:`, chunkErr);
          }

          await new Promise(r => setTimeout(r, 200));
        }
        
        if (hasProcessedAtLeastOne) {
          const newCount = usageCount + 1;
          setUsageCount(newCount);
          localStorage.setItem('import_count', newCount.toString());
          setCurrentStep(2);
        } else {
           throw new Error("Failed to process any pages in the PDF.");
        }

      } else if (uploadedFile && uploadedFile.type.includes('image')) {
        
        const products = await extractData(uploadedFile, process.env.NEXT_PUBLIC_GOOGLE_API_KEY, userConfig, isConfigConfirmed);

        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('import_count', newCount.toString());

        setProducts(products);
        setCurrentStep(2);

      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockProducts: UnifiedProduct[] = [
          {
            sync_id: 'URB-DENIM-NAVY-M',
            success_feedback: {
              total_variants: 1,
              channels_ready: ['Shopify', 'Amazon FBA'],
              summary_message: 'Your Urban Threads denim jacket has been successfully transformed into a multi-channel launch package. We\'ve synchronized your SKUs and optimized your content for Amazon\'s Rufus AI.'
            },
            shopify_service: {
              handle: 'urban-rugged-denim-jacket-navy',
              title: 'Urban Threads Rugged Denim Jacket - Navy',
              html_description: '<strong>The Ultimate Rugged Denim Jacket</strong><ul><li>Reinforced 14oz Denim</li><li>Double-stitched seams</li><li>Eco-friendly dyes</li></ul>',
              tags: 'denim, jacket, men fashion, rugged',
              vendor: 'Urban Threads',
              product_type: 'Outerwear',
              google_product_category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
              seo_title: 'Urban Threads Rugged Denim Jacket - Premium Navy Outerwear',
              seo_description: 'Upgrade your style with the Urban Threads Rugged Denim Jacket. Featuring 14oz reinforced denim and double-stitched seams for maximum durability.',
              variants: [
                {
                  sku: 'URB-DENIM-NAVY-M',
                  price: '129.99',
                  option1_name: 'Size',
                  option1_value: 'Medium',
                  grams: 850,
                  inventory_qty: 150
                }
              ]
            },
            amazon_fba_service: {
              flat_file_data: {
                item_name: 'Urban Threads Classic Denim Jacket - Mobile Optimized Rugged Outerwear - Men\'s Medium Navy - 100% Durable Cotton',
                item_type_keyword: 'jackets',
                feed_product_type: 'outerwear',
                brand_name: 'Urban Threads',
                standard_price: '129.99',
                bullets: [
                  'IMMEDIATE SOLUTION: Provides instant warmth and a timeless rugged aesthetic for shifting seasons.',
                  'TECHNICAL SUPERIORITY: Reinforced with 14oz heavy-duty denim and double-stitched seams for maximum durability.',
                  'USER EXPERIENCE: Designed for a relaxed fit that feels broken-in from Day 1, ideal for layering.',
                  'SPECIFICATIONS: 100% Cotton construction; Lead-free buttons; Machine washable. Back length measures 28 inches.',
                  'TRUST: We stand by our craftsmanship with a 5-year guarantee on all stitching and fabric.'
                ]
              },
              search_terms: 'denim jacket blue outerwear men fashion rugged classic gift daily wear worker style',
              rufus_summary: 'This Urban Threads denim jacket is the ideal blend of durability and comfort for craftsmen and urban explorers. It features reinforced denim perfect for spring or autumn layering, answering the need for a long-lasting, stylish outer layer.'
            },
            aplus_content_service: {
              modules: [
                { header: 'Engineered for the Elements', body: 'Our denim is woven with a high-density technique that resists abrasions.' },
                { header: 'Artisanal Craftsmanship', body: 'Every seam is double-locked to ensure durability across a lifetime.' },
                { header: 'The Urban Threads Promise', body: 'We guarantee the quality of every stitch for five years.' }
              ],
              image_alt_text: 'Model wearing a navy denim jacket in an urban environment'
            },
            readiness_report: {
              status: '90% Ready',
              missing_fields: ['UPC/EAN Barcode']
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
    (product.shopify_service as any)[field] = value;
    setProducts(updated);
  };

  const handleVariantChange = (pIdx: number, vIdx: number, field: keyof MasterArchitectVariant, value: string | number) => {
    const updated = [...products];
    const variant = updated[pIdx].shopify_service.variants[vIdx];
    if (field === 'grams' || field === 'inventory_qty') {
      (variant[field] as number) = Number(value);
    } else {
      (variant[field] as string) = value as string;
    }
    setProducts(updated);
  };

  const generateCSV = () => {
    const headers = [
      'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Google Product Category', 'Tags', 'Published',
      'Option1 Name', 'Option1 Value', 'Variant Price', 'Variant Grams', 
      'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant SKU', 'SEO Title', 'SEO Description'
    ];
    
    const rows: any[] = [];
    products.forEach(p => {
      p.shopify_service.variants.forEach(v => {
        rows.push([
          p.shopify_service.handle,
          p.shopify_service.title,
          p.shopify_service.html_description,
          p.shopify_service.vendor,
          p.shopify_service.product_type, // Exact category name from PDF
          p.shopify_service.google_product_category, // Standard Category
          p.shopify_service.tags,
          'TRUE', 
          v.option1_name,
          v.option1_value,
          v.price,
          v.grams,
          'shopify',
          v.inventory_qty,
          v.sku,
          p.shopify_service.seo_title,
          p.shopify_service.seo_description
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

  const generateAmazonFlatFile = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');
    
    // Simulating Amazon Flat File Headers
    worksheet.columns = [
      { header: 'item_name', key: 'item_name', width: 40 },
      { header: 'brand_name', key: 'brand_name', width: 20 },
      { header: 'external_product_id', key: 'external_product_id', width: 20 },
      { header: 'external_product_id_type', key: 'external_product_id_type', width: 10 },
      { header: 'standard_price', key: 'standard_price', width: 10 },
      { header: 'item_type_keyword', key: 'item_type_keyword', width: 20 },
      { header: 'feed_product_type', key: 'feed_product_type', width: 20 },
      { header: 'seller_sku', key: 'seller_sku', width: 20 },
      { header: 'bullet_point1', key: 'bullet_point1', width: 40 },
      { header: 'bullet_point2', key: 'bullet_point2', width: 40 },
      { header: 'bullet_point3', key: 'bullet_point3', width: 40 },
      { header: 'bullet_point4', key: 'bullet_point4', width: 40 },
      { header: 'bullet_point5', key: 'bullet_point5', width: 40 },
      { header: 'generic_keywords', key: 'generic_keywords', width: 40 },
    ];

    products.forEach(p => {
      worksheet.addRow({
        item_name: p.amazon_fba_service.flat_file_data.item_name,
        brand_name: p.amazon_fba_service.flat_file_data.brand_name,
        external_product_id: '', // To be filled by user
        external_product_id_type: 'UPC',
        standard_price: p.amazon_fba_service.flat_file_data.standard_price,
        item_type_keyword: p.amazon_fba_service.flat_file_data.item_type_keyword,
        feed_product_type: p.amazon_fba_service.flat_file_data.feed_product_type,
        seller_sku: p.sync_id,
        bullet_point1: p.amazon_fba_service.flat_file_data.bullets[0] || '',
        bullet_point2: p.amazon_fba_service.flat_file_data.bullets[1] || '',
        bullet_point3: p.amazon_fba_service.flat_file_data.bullets[2] || '',
        bullet_point4: p.amazon_fba_service.flat_file_data.bullets[3] || '',
        bullet_point5: p.amazon_fba_service.flat_file_data.bullets[4] || '',
        generic_keywords: p.amazon_fba_service.search_terms
      });
    });

    return await workbook.xlsx.writeBuffer();
  };

  const downloadMultiChannelPackage = async () => {
    const zip = new JSZip();
    

    zip.file('shopify_import.csv', generateCSV());
    

    let amazonContent = "SHOPSREADY ARCHITECT - AMAZON FBA SYNC\n======================================\n\n";
    products.forEach(p => {
      amazonContent += `Product: ${p.shopify_service.title}\n`;
      amazonContent += `Sync ID (SKU): ${p.sync_id}\n`;
      amazonContent += `Amazon Optimized Title: ${p.amazon_fba_service.flat_file_data.item_name}\n`;
      amazonContent += `Feed Product Type: ${p.amazon_fba_service.flat_file_data.feed_product_type}\n`;
      amazonContent += `Item Type Keyword: ${p.amazon_fba_service.flat_file_data.item_type_keyword}\n`;
      amazonContent += `Backend Search Terms: ${p.amazon_fba_service.search_terms}\n`;
      amazonContent += `Rufus AI Semantic Context: ${p.amazon_fba_service.rufus_summary}\n\n`;
      amazonContent += `Power Bullets:\n`;
      p.amazon_fba_service.flat_file_data.bullets.forEach((bp, i) => {
        amazonContent += `${i+1}. ${bp}\n`;
      });
      amazonContent += `\nA+ CONTENT STRATEGY:\n`;
      p.aplus_content_service.modules.forEach((mod, i) => {
        amazonContent += `Module ${i+1}: ${mod.header} - ${mod.body}\n`;
      });
      amazonContent += `\nREADINESS REPORT:\n`;
      amazonContent += `Status: ${p.readiness_report.status}\n`;
      amazonContent += `Missing Data: ${p.readiness_report.missing_fields.join(', ')}\n`;
      amazonContent += "\n-----------------------\n\n";
    });
    zip.file('amazon_listings.txt', amazonContent);

    const excelBuffer = await generateAmazonFlatFile();
    zip.file('amazon_fba_flat_file.xlsx', excelBuffer);
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'ShopsReady_Architect_Package.zip');
  };

  const handleConfirm = () => {
    setCurrentStep(3);
    setTimeout(() => {
      const downloadSection = document.getElementById('download-section');
      if (downloadSection) {
        downloadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setInputText('');
    setProducts([]);
    setFileName('');
  };

  return (
    <div className="min-h-0 bg-slate-50 p-6 md:p-10 font-sans pb-10 relative">

      <div className="flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto mb-8 px-4 gap-6 border-b border-slate-100 pb-8">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer order-1 md:order-none">
          <div className="bg-emerald-600/10 p-2.5 rounded-2xl backdrop-blur-md border border-emerald-600/20 group-hover:bg-emerald-600/20 transition-all shadow-sm">
            <Package className="w-6 h-6 text-emerald-600" />
          </div>
          <span className="font-heading font-black text-2xl text-slate-900 tracking-tighter">ShopsReady</span>
        </Link>
        
        {activeMarketplace && (
          <div className="flex items-center gap-3 order-3 md:order-none animate-in fade-in zoom-in duration-500">
            <div className={`pl-1.5 pr-4 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3 border shadow-sm transition-all ${
              activeMarketplace === 'shopify' ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-200' :
              activeMarketplace === 'amazon' ? 'bg-[#FF9900] text-white border-[#FF8800] shadow-orange-200' :
              'bg-blue-600 text-white border-blue-500 shadow-blue-200'
            }`}>
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                {activeMarketplace === 'shopify' && <ShoppingBag className="w-4 h-4" />}
                {activeMarketplace === 'amazon' && <Package className="w-4 h-4" />}
                {activeMarketplace === 'both' && <Globe className="w-4 h-4" />}
              </div>
              Architect Active: {activeMarketplace.toUpperCase()}
            </div>
            
            <button 
              onClick={() => {
                setActiveMarketplace(null);
                sessionStorage.removeItem('active_marketplace');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 hover:text-red-600 hover:border-red-200 hover:shadow-lg hover:shadow-red-500/10 transition-all cursor-pointer shadow-sm group"
            >
              <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
              RESET
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm order-2 md:order-none">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[12px] font-black text-slate-700 uppercase tracking-widest">
            {5 - usageCount} Architectures Ready
          </span>
        </div>
      </div>

      <header className="mb-4 text-center max-w-4xl mx-auto relative px-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
          <span className="text-emerald-600">PDF</span> to {
            activeMarketplace === 'shopify' ? 'Shopify CSV' :
            activeMarketplace === 'amazon' ? 'Amazon Listing' :
            'Marketplace'
          } Generator
        </h1>
        
        <p className="text-xl text-slate-500 max-w-5xl mx-auto font-medium leading-relaxed">
          {activeMarketplace === 'shopify' && <>Transform messy supplier data into high-converting <span className="text-emerald-600 font-bold">Shopify CSVs</span> with taxonomy mapping.</>}
          {activeMarketplace === 'amazon' && <>Transform messy supplier data into high-converting <span className="text-orange-500 font-bold">Amazon Listings</span> with SEO bullets.</>}
          {activeMarketplace === 'both' && <>Transform messy supplier data into high-converting <span className="text-emerald-600 font-bold">Shopify CSVs</span> and <span className="text-orange-500 font-bold">Amazon Listings</span>.</>}
          {!activeMarketplace && <>Select a destination to start transforming your supplier data into retail-ready assets.</>}
        </p>
      </header>


      <div className="max-w-5xl mx-auto mb-3">
        <div className="flex items-center justify-between relative">
          {[
            { num: 1, label: 'Input Data' },
            { num: 2, label: 'Review & Edit' },
            { num: 3, label: 'Download CSV' }
          ].map((step, idx) => (
            <div key={step.num} className="flex-1 flex flex-col items-center relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
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
            <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-4">
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
                  <div className={`relative w-full ${!activeMarketplace ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="file"
                      accept=".txt,.csv,.pdf,image/*"
                      onChange={handleFileUpload}
                      disabled={!activeMarketplace}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                      id="file-upload"
                    />
                    <label 
                      htmlFor="file-upload"
                      className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-3xl bg-emerald-50/20 hover:bg-emerald-50/50 transition-all cursor-pointer group h-56 shadow-inner ${
                        activeMarketplace 
                        ? 'border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.1)] ring-2 ring-emerald-500/10' 
                        : 'border-slate-200'
                      }`}
                    >
                      <div className={`w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform ${activeMarketplace ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <Upload className="w-8 h-8" />
                      </div>
                      <span className="font-bold text-slate-900 text-xl mb-1">
                        {activeMarketplace ? 'Click to Upload' : 'Marketplace Required'}
                      </span>
                      <span className="text-sm text-slate-500 text-center max-w-xs">
                        {activeMarketplace 
                          ? `Attach a PDF or Image for ${activeMarketplace === 'both' ? 'Multichannel' : activeMarketplace.toUpperCase()}.`
                          : 'Please select your marketplace destination above to enable uploading.'}
                      </span>
                      {fileName && (
                        <div className="mt-4 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold ring-2 ring-emerald-200 animate-bounce">
                          {fileName}
                        </div>
                      )}
                    </label>
                  </div>
              ) : (
                <div className="space-y-4">
                  <div className={`relative group ${!activeMarketplace ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={!activeMarketplace}
                      placeholder={activeMarketplace ? "Example: Blue Shirt, Size M, SKU: 123, Price: $15.00\nRed Jacket, Size L, SKU: 456, Price: $45.00" : "Please select a marketplace destination first."}
                      className="w-full min-h-[220px] p-6 rounded-3xl bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:outline-none focus:bg-white transition-all resize-none font-mono text-sm text-slate-700 shadow-inner group-hover:border-slate-300 disabled:cursor-not-allowed"
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

            <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="px-4 cursor-pointer bg-white border-2 border-slate-200 text-slate-600 rounded-2xl hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center group relative overflow-hidden "
                  title="Advanced Configurations"
                >
                  <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || (inputTab === 'upload' ? !fileName : !inputText.trim())}
                  className="flex-1 cursor-pointer py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-3xl shadow-2xl shadow-slate-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-4 text-xl group"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" /> Architecting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" /> Generate Listing Files
                    </>
                  )}
                </button>
              </div>
              
              {/* Count moved to top nav for better visibility */}
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
                  <span className="text-green-600 font-black">{products.length} Products</span> • {products.reduce((acc, p) => acc + p.shopify_service.variants.length, 0)} Global Variants Synchronized
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
                  onClick={() => handleConfirm()}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Confirm & Sync <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {products.map((product, pIdx) => (
                <div key={product.sync_id || pIdx} className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden animate-in fade-in duration-300">
                  <div className="p-4 md:p-6 space-y-6">
                    {/* Header Row */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                          {pIdx + 1}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">Sync ID: <span className="text-emerald-600">{product.sync_id}</span></h3>
                          <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Multi-Channel Synchronization Active</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className={`px-2 py-0.5 ${product.readiness_report.status.includes('100') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-orange-50 text-orange-700 border-orange-100'} text-[9px] font-bold rounded-full border uppercase tracking-tight`}>
                            Architect Audit: {product.readiness_report.status}
                        </div>
                        <div className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-full border border-blue-100 uppercase tracking-tight">Sync Active</div>
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
                              value={product.shopify_service.title}
                              onChange={(e) => handleShopifyChange(pIdx, 'title', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-semibold text-slate-900 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Brand / Vendor</label>
                            <input
                              type="text"
                              value={product.shopify_service.vendor}
                              onChange={(e) => handleShopifyChange(pIdx, 'vendor', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-semibold text-slate-700 outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Shopify Handle</label>
                            <input
                              type="text"
                              value={product.shopify_service.handle}
                              onChange={(e) => handleShopifyChange(pIdx, 'handle', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-400 text-xs font-mono text-slate-600 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Category / Type</label>
                            <input
                              type="text"
                              value={product.shopify_service.product_type}
                              onChange={(e) => handleShopifyChange(pIdx, 'product_type', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-400 text-sm font-semibold text-slate-700 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">SEO Title</label>
                            <input
                              type="text"
                              value={product.shopify_service.seo_title}
                              onChange={(e) => handleShopifyChange(pIdx, 'seo_title', e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-400 text-sm font-semibold text-slate-700 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">SEO Description</label>
                            <input
                              type="text"
                              value={product.shopify_service.seo_description}
                              onChange={(e) => handleShopifyChange(pIdx, 'seo_description', e.target.value)}
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
                            onClick={() => setActiveAmazonToolId(activeAmazonToolId === product.sync_id ? null : product.sync_id)}
                            className="text-[9px] font-bold text-orange-600 hover:text-orange-700 underline flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            {activeAmazonToolId === product.sync_id ? 'Hide Strategy' : 'View Full Architect View'}
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">FBA Item Type Keyword</span>
                            <p className="text-xs font-bold text-slate-700 truncate">{product.amazon_fba_service.flat_file_data.item_type_keyword}</p>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">FBA Feed Product Type</span>
                            <p className="text-[10px] text-slate-600 font-mono">{product.amazon_fba_service.flat_file_data.feed_product_type}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-emerald-600">Architect Optimized Title</span>
                            <div className="group/copy relative">
                                <p className="text-[10px] font-medium text-slate-800 line-clamp-2 bg-white p-2 rounded border border-emerald-500/20 leading-tight">
                                    {product.amazon_fba_service.flat_file_data.item_name}
                                </p>
                                <button 
                                    onClick={() => navigator.clipboard.writeText(product.amazon_fba_service.flat_file_data.item_name)}
                                    className="absolute right-1 top-1 p-1 bg-emerald-50 rounded opacity-0 group-hover/copy:opacity-100 transition-opacity"
                                    title="Copy Title"
                                >
                                    <Download className="w-3 h-3 text-emerald-600" />
                                </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Preview Section */}
                    {activeAmazonToolId === product.sync_id && (
                      <div className="p-4 bg-slate-900 rounded-xl text-white animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                            <div>
                                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Master Architect Strategy</h4>
                                <p className="text-[9px] text-slate-400 mt-1">Operational • Marketing • Branding • SEO • Validation</p>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium text-right">
                                <span className="block italic text-orange-400">Sync Master SKU: {product.sync_id}</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">High-Conversion Power Bullets</h5>
                                <div className="grid grid-cols-1 gap-2">
                                {product.amazon_fba_service.flat_file_data.bullets.map((bp, i) => (
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

                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-widest">Rufus Semantic Summary (SEO Layer 4)</span>
                                            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                                        "{product.amazon_fba_service.rufus_summary}"
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">A+ Storytelling & Readiness (Layer 3 & 5)</h5>
                                <div className="grid grid-cols-1 gap-3">
                                    {product.aplus_content_service.modules.map((mod, i) => (
                                        <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/10">
                                            <span className="text-[8px] font-bold text-orange-400 uppercase mb-1 block">Module {i+1}: {mod.header}</span>
                                            <p className="text-[10px] text-slate-400 leading-tight">{mod.body}</p>
                                        </div>
                                    ))}
                                    
                                    <div className="bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20">
                                        <span className="text-[8px] font-bold text-emerald-400 uppercase mb-1 block">SEO Image Alt Text</span>
                                        <p className="text-[10px] text-slate-300 italic">{product.aplus_content_service.image_alt_text}</p>
                                    </div>
                                    
                                    <div className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                                        <span className="text-[8px] font-bold text-red-400 uppercase mb-1 block">Readiness Audit - Missing Fields</span>
                                        <div className="flex flex-wrap gap-2">
                                            {product.readiness_report.missing_fields.map((field, i) => (
                                                <span key={i} className="text-[9px] px-2 py-0.5 bg-red-500/10 text-red-300 rounded-full border border-red-500/20 font-bold">
                                                    {field}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">FBA Master Search Terms</span>
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(product.amazon_fba_service.search_terms)}
                                            className="text-[9px] text-emerald-400 hover:underline"
                                        >
                                            Copy All
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-mono text-slate-500 bg-black/30 p-2 rounded break-words">
                                        {product.amazon_fba_service.search_terms}
                                    </p>
                                </div>
                            </div>
                        </div>
                      </div>
                    )}

                    {/* Variants Table */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">Synchronized Variant Matrix</h4>
                      <div className="border border-slate-300 rounded-lg overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300">
                              <th className="p-2 font-bold text-slate-600 uppercase tracking-tighter">Variant Property</th>
                              <th className="p-2 font-bold text-slate-600 text-center uppercase tracking-tighter">Sync Price</th>
                              <th className="p-2 font-bold text-slate-600 uppercase tracking-tighter">Global SKU (Link)</th>
                              <th className="p-2 font-bold text-slate-600 text-center uppercase tracking-tighter">Sync Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {product.shopify_service.variants.map((v, vIdx) => (
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
                                      value={v.price}
                                      onChange={(e) => handleVariantChange(pIdx, vIdx, 'price', e.target.value)}
                                      className="w-12 bg-transparent font-bold text-slate-700 outline-none text-center"
                                    />
                                  </div>
                                </td>
                                <td className="p-2 border-r border-slate-200">
                                  <input
                                    type="text"
                                    value={v.sku}
                                    onChange={(e) => handleVariantChange(pIdx, vIdx, 'sku', e.target.value)}
                                    className="w-full bg-transparent font-mono text-[10px] text-emerald-600 font-bold outline-none"
                                  />
                                </td>
                                <td className="p-2 w-20 text-center">
                                  <input
                                    type="number"
                                    value={v.inventory_qty}
                                    onChange={(e) => handleVariantChange(pIdx, vIdx, 'inventory_qty', e.target.value)}
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
                  onClick={() => handleConfirm()}
                  className="flex-1 md:flex-none px-12 py-5 bg-emerald-600 text-white font-black rounded-[1.5rem] hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-3 text-lg ring-4 ring-white"
                >
                  Confirm & Sync All <ArrowRight className="w-6 h-6 animate-pulse" />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div id="download-section" className="bg-white rounded-[2.5rem] p-4 md:p-6 shadow-2xl border border-slate-100 text-center max-w-4xl mx-auto relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
            
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner group transition-transform hover:rotate-6 duration-500">
              <Sparkles className="w-6 h-6" />
            </div>
            
            <div className="space-y-4 mb-6 text-center">
              <h2 className="text-4xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none">
                Experience the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600">Elite Sync.</span>
              </h2>
              {products.length > 0 && (
                <p className="text-md w-full text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
                  {products[0].success_feedback.summary_message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-left">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group">
                    <span className="text-[8px] font-black text-emerald-600 uppercase mb-2 block tracking-widest">Digital Operational Layer</span>
                    <h5 className="text-[10px] font-bold text-slate-900 mb-1">Amazon FBA Flat File</h5>
                    <p className="text-[9px] text-slate-500 leading-tight">Ready-to-upload .txt with mapped Browse Nodes and 5-point Power Bullets.</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group">
                    <span className="text-[8px] font-black text-blue-600 uppercase mb-2 block tracking-widest">Marketing Layer</span>
                    <h5 className="text-[10px] font-bold text-slate-900 mb-1">Shopify Multi-Sync</h5>
                    <p className="text-[9px] text-slate-500 leading-tight">Synchronized SKUs and HTML descriptions with mobile-optimized titles.</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative group">
                    <span className="text-[8px] font-black text-orange-600 uppercase mb-2 block tracking-widest">Branding Layer</span>
                    <h5 className="text-[10px] font-bold text-slate-900 mb-1">A+ Storytelling</h5>
                    <p className="text-[9px] text-slate-500 leading-tight">Storytelling modules and SEO image alt-text for Amazon Brand Registry.</p>
                </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 mb-6 text-left relative group hover:border-emerald-500/30 transition-all">
                <div className="absolute -top-3 -left-3 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">ShopsReady Architect Active</div>
                <p className="text-sm text-slate-700 leading-relaxed italic">
                    "From Mobile-First Amazon Titles to A+ Storytelling, ShopsReady.com ensures your products are not just listed, but optimized for the modern buyer and Amazon&apos;s Rufus AI."
                </p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                    <Check className="w-3 h-3" /> Rufus Indexing Pre-Checked
                    <span className="mx-2 text-slate-300">•</span>
                    <Check className="w-3 h-3" /> A+ Storytelling Rendered
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mb-10 text-center">
              <button
                onClick={() => downloadMultiChannelPackage()}
                className="w-full cursor-pointer py-4 bg-slate-900 text-white font-black rounded-3xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-4 text-xl group ring-8 ring-slate-50"
              >
                <Download className="w-7 h-7 group-hover:translate-y-1 transition-transform" /> Download Elite Package
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => downloadShopifyCSV()}
                  className="py-4 cursor-pointer bg-white border-2 border-slate-100 text-slate-700 font-black rounded-2xl hover:border-emerald-500 hover:text-emerald-700 transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
                >
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Shopify CSV
                </button>
                <button
                   onClick={() => downloadMultiChannelPackage()} 
                   className="py-4 bg-white cursor-pointer border-2 border-slate-100 text-slate-700 font-black rounded-2xl hover:border-orange-500 hover:text-orange-700 transition-all flex items-center justify-center gap-3 text-sm shadow-sm"
                >
                  <Package className="w-5 h-5 text-orange-500" /> Amazon Pro Package
                </button>
              </div>
            </div>

            <button
                onClick={handleStartOver}
                className="text-slate-400 cursor-pointer font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-600 transition-all"
            >
                ← Start New Architectural Sync
            </button>
          </div>
        )}

      </main>

      {/* Advanced Config Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsConfigModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden transform animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-tight">Safety Net Settings</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Fallbacks & AI Rules</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsConfigModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase ml-1 flex items-center gap-2">
                    Default Inventory Level <Tag className="w-3 h-3" />
                  </label>
                  <input
                    type="number"
                    value={userConfig.defaultQty}
                    onChange={(e) => setUserConfig(prev => ({ ...prev, defaultQty: Number(e.target.value) }))}
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white text-sm font-bold text-slate-900 outline-none transition-all shadow-inner"
                    placeholder="e.g. 100"
                  />
                  <p className="text-[9px] text-slate-400 ml-1 italic">Used if stock detection fails in PDF</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase ml-1 flex items-center gap-2">
                    Bulk Price Markup <Sparkles className="w-3 h-3" />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={userConfig.priceMarkup}
                    onChange={(e) => setUserConfig(prev => ({ ...prev, priceMarkup: Number(e.target.value) }))}
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white text-sm font-bold text-slate-900 outline-none transition-all shadow-inner"
                    placeholder="e.g. 1.2 for 20% markup"
                  />
                  <p className="text-[9px] text-slate-400 ml-1 italic">Source Price * Markup (1.0 = 1:1 Mirror)</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase ml-1 flex items-center gap-2">
                    Standard Fallback Type <ShoppingBag className="w-3 h-3" />
                  </label>
                  <input
                    type="text"
                    value={userConfig.defaultType}
                    onChange={(e) => setUserConfig(prev => ({ ...prev, defaultType: e.target.value }))}
                    className="w-full px-5 py-3 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 focus:bg-white text-sm font-bold text-slate-900 outline-none transition-all shadow-inner"
                    placeholder="e.g. General Merchandise"
                  />
                  <p className="text-[12px] text-[red] ml-1 italic">Classification used if PDF is generic</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 uppercase ml-1 flex items-center gap-2">
                    Target Export Channels <Settings className="w-3 h-3" />
                  </label>
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    {['Shopify', 'Amazon', 'Both'].map((channel) => (
                      <button
                        key={channel}
                        onClick={() => setUserConfig(prev => ({ ...prev, targetChannels: channel as any }))}
                        className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${
                          userConfig.targetChannels === channel 
                          ? 'bg-white text-emerald-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {channel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsConfigConfirmed(true);
                  setIsConfigModalOpen(false);
                }}
                className="w-full cursor-pointer mt-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> Apply Fallbacks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marketplace Selector Overlay */}
      <AnimatePresence>
        {!activeMarketplace && currentStep === 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl"
          >
            {/* Top Logo Link */}
            <div className="absolute top-8 left-8 z-10 animate-in fade-in duration-700">
              <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                <div className="bg-emerald-500 p-2.5 rounded-2xl shadow-xl shadow-emerald-500/20 group-hover:bg-emerald-400 transition-all">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <span className="font-heading font-black text-2xl text-white tracking-tighter">ShopsReady</span>
              </Link>
            </div>

            <div className="max-w-5xl w-full">
              <div className="text-center mb-16 flex flex-col items-center">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h1 className="text-xl font-black text-white/20 uppercase tracking-[0.5em] mb-4">Marketplace Architect</h1>
                  <h2 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-[0.9]">
                    Where is your data <span className="text-emerald-400 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">headed?</span>
                  </h2>
                  <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">Select your destination to initialize the high-integrity product sync engine.</p>
                </motion.div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    id: 'shopify',
                    name: 'Shopify Store',
                    description: 'Optimized for Standard Product Taxonomy and HTML formatting.',
                    icon: ShoppingBag,
                    color: 'emerald'
                  },
                  {
                    id: 'amazon',
                    name: 'Amazon Marketplace',
                    description: 'Optimized for Bold-Caps Bullets and Browse Node mapping.',
                    icon: Package,
                    color: 'orange'
                  },
                  {
                    id: 'both',
                    name: 'Multi-Channel',
                    description: 'Generate both Shopify and Amazon files simultaneously.',
                    icon: Globe,
                    color: 'blue'
                  }
                ].map((choice, idx) => (
                  <motion.button
                    key={choice.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    whileHover={{ scale: 1.02, translateY: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleMarketplaceSelect(choice.id as any)}
                    className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] text-left hover:bg-white/10 hover:border-emerald-500/50 transition-all group flex flex-col h-full cursor-pointer"
                  >
                    <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center bg-${choice.color}-500/10 text-${choice.color}-400 group-hover:scale-110 transition-transform`}>
                      <choice.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{choice.name}</h3>
                    <p className="text-slate-500 leading-relaxed font-medium mb-8 flex-grow">{choice.description}</p>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Select Destination <ArrowRight className="w-4 h-4" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
