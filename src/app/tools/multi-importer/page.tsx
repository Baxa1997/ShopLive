'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Check, ArrowRight, ArrowLeft, Loader2, FileSpreadsheet, Sparkles, AlertCircle, Package, ShoppingBag, Tag, Settings, X, History, Zap } from 'lucide-react';
import Link from 'next/link';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { saveToHistory } from '@/lib/history';

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
    category: string;
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

const FREE_LIMIT = 2; // Free generations per day

export default function ShopifyImporterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [inputText, setInputText] = useState('');
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [activeAmazonToolId, setActiveAmazonToolId] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [usageCount, setUsageCount] = useState(0);
  const [inputTab, setInputTab] = useState<'upload' | 'manual'>('upload');
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pay-per-use' | 'monthly' | null>(null);

  // Advanced Configuration State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [userConfig, setUserConfig] = useState({
    defaultQty: 100,
    priceMarkup: 1.0,
    defaultType: 'General Merchandise',
    targetChannels: 'Both' as 'Shopify' | 'Amazon' | 'Both'
  });
  const [isConfigConfirmed, setIsConfigConfirmed] = useState(false);
  const [activeMarketplace, setActiveMarketplace] = useState<'shopify' | 'amazon' | null>(null);

  useEffect(() => {
    const savedMarketplace = sessionStorage.getItem('target_system');
    if (savedMarketplace) {
      setActiveMarketplace(savedMarketplace as any);
      setUserConfig(prev => ({
        ...prev,
        targetChannels: savedMarketplace === 'shopify' ? 'Shopify' : 'Amazon'
      }));
    }

    return () => {
      sessionStorage.removeItem('target_system');
    };
  }, []);

  const handleMarketplaceSelect = (choice: 'shopify' | 'amazon') => {
    setActiveMarketplace(choice);
    sessionStorage.setItem('target_system', choice);
    setUserConfig(prev => ({
      ...prev,
      targetChannels: choice === 'shopify' ? 'Shopify' : 'Amazon'
    }));
    setCurrentStep(2);
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

  // Sends one PDF chunk to Gemini and returns the parsed products.
  // expectedCount is an estimate used to tell the model how many products to find.
  const extractData = async (
    file: File | Blob,
    apiKey: string,
    config: typeof userConfig,
    isConfigConfirmed: boolean,
    expectedCount?: number
  ): Promise<UnifiedProduct[]> => {
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

    const imagePart = await fileToGenerativePart(file as File);

    const target_system = config.targetChannels === 'Both' ? ['shopify', 'amazon'] : config.targetChannels.toLowerCase();
    const countHint = expectedCount ? `\n\nCRITICAL: This chunk is expected to contain approximately ${expectedCount} distinct product(s). You MUST extract ALL of them — do not skip any product, even if the data is sparse. Every unique product name/SKU row in the PDF is a separate product entry.` : '';

    const prompt = `Act as a Senior Marketplace Architect. 

Goal: Process product data from PDF for high-integrity export.
Selected Output Channels: ${config.targetChannels} (Target: ${JSON.stringify(target_system)}).${countHint}

1. Dynamic Identity & Vendor Detection:
- **Source:** Extract brand/manufacturer from PDF logos, headers, or "Brand" fields.
- **Strict Rule:** NEVER use 'ShopsReady'. 
- **Vendor Logic:** If brand is missing, use the **Supplier/Company name** from the header. Leave blank if no supplier info exists.

2. Product Titles & Metadata (1:1 Extraction):
- **COMPLETENESS RULE:** You MUST output one JSON object for EVERY distinct product found in the PDF pages. Missing a product is not acceptable.
- **Titles:** Use the EXACT product titles found in the PDF. No optimization or rewriting. 
- **B2B Variant Grouping:** If the PDF lists multiple rows for the same product (e.g., different sizes/colors), group them into ONE master product object with a 'variants' array.

3. Description Logic:
- **Rule:** Use ONLY technical descriptions provided in the PDF.
- **Formatting:** HTML (<strong>, <li>) for Shopify; Raw Text (no HTML) for Amazon.

4. Smart Marketplace Category:
- **Task:** Automatically detect and map the product to the most specific **Shopify Category (2026)** or **Amazon Browse Node**.
- **Visual Breadcrumb:** Provide the deepest possible breadcrumb (e.g., 'Home & Garden > Kitchen > Tools').

5. Technical Sync:
- **Match Score:** Assign a confidence score: 'High' (Exact Match) or 'Medium' (Review Needed).

6. Amazon-Specific Extraction:
- **Bullet Points (Bold Caps):** Extract 5 key features from the PDF and format as BOLD CAPS bullets (e.g., 'DURABLE BUILD: ...'). Do not invent new features.
- **Search Terms:** Extract 250 characters of keywords based strictly on PDF content.

7. Inventory & Pricing (Scan-First Logic):
- **Stock:** 1. Use exact 'Quantity' or 'Stock' values from PDF if found.
    2. IF MISSING: Use ${config.defaultQty} ONLY IF 'Config Status' is true. 
    3. Otherwise, output '0'. NEVER use placeholder numbers like '100'.
- **Cost/Markup:** Extract 'Wholesale' price. Multiply by ${config.priceMarkup} ONLY IF 'Config Status' is true.

8. Technical Synchronization:
- **Category Sync:** Apply the detected breadcrumb to the 'Standard Product Type' (Shopify) and 'Category/Browse Node' (Amazon) fields.
- **Handle Logic:** Ensure variants share a single 'Handle' for correct grouping.

9. Output Formatting:
- Map to ${config.targetChannels} headers. Return ONLY a valid JSON array. No filler data. Include every product.`;

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
    if (usageCount >= FREE_LIMIT) {
      setShowPaywall(true);
      return;
    }

    setIsLoading(true);
    setError('');
    setLoadingStatus('Initializing...');
    setLoadingProgress(0);
    
    // Clear previous products before starting a new analysis
    setProducts([]);
    let allProducts: UnifiedProduct[] = [];

    // Helper: sleep between API calls to avoid rate limits
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    // Helper: extract with up to maxRetries attempts on failure
    const extractWithRetry = async (
      fileChunk: File,
      apiKey: string,
      config: typeof userConfig,
      isConfigConfirmed: boolean,
      expectedCount: number,
      chunkLabel: string,
      maxRetries = 2
    ): Promise<UnifiedProduct[]> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await extractData(fileChunk, apiKey, config, isConfigConfirmed, expectedCount);
          return result;
        } catch (err) {
          console.warn(`Chunk ${chunkLabel} attempt ${attempt} failed:`, err);
          if (attempt < maxRetries) {
            await sleep(2000 * attempt); // back-off: 2s, 4s
          }
        }
      }
      console.error(`Chunk ${chunkLabel} failed after ${maxRetries} attempts. Skipping.`);
      return [];
    };

    try {
      if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
        throw new Error('API key not configured.');
      }

      if (uploadedFile && uploadedFile.type === 'application/pdf') {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const totalPages = pdfDoc.getPageCount();

        // Use a smaller batch size (5 pages) so the model stays well within
        // its structured-output token budget and returns ALL products.
        const batchSize = 5;
        const totalBatches = Math.ceil(totalPages / batchSize);
        
        let hasProcessedAtLeastOne = false;
        const seenTitles = new Set<string>(); // deduplication guard

        for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
          const startPage = batchIdx * batchSize;
          const pageIndices: number[] = [];
          for (let j = 0; j < batchSize && (startPage + j) < totalPages; j++) {
            pageIndices.push(startPage + j);
          }

          setLoadingStatus(
            `Scanning pages ${startPage + 1}–${Math.min(startPage + batchSize, totalPages)} of ${totalPages} (batch ${batchIdx + 1}/${totalBatches})…`
          );
          setLoadingProgress(Math.round(((batchIdx) / totalBatches) * 80));

          const subDoc = await PDFDocument.create();
          const copiedPages = await subDoc.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach((page: any) => subDoc.addPage(page));
          const pdfBytes = await subDoc.save();
          const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
          const fileChunk = new File([blob], `chunk_${startPage}.pdf`, { type: 'application/pdf' });

          const chunkLabel = `pages ${startPage + 1}-${Math.min(startPage + batchSize, totalPages)}`;
          const chunkProducts = await extractWithRetry(
            fileChunk,
            process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
            userConfig,
            isConfigConfirmed,
            pageIndices.length * 3, // rough upper bound: ~3 products per page
            chunkLabel
          );

          if (chunkProducts.length > 0) {
            // Deduplicate by title to prevent duplicates across chunks
            const uniqueChunk = chunkProducts.filter(p => {
              const key = p.shopify_service?.title?.trim().toLowerCase();
              if (!key || seenTitles.has(key)) return false;
              seenTitles.add(key);
              return true;
            });

            allProducts = [...allProducts, ...uniqueChunk];
            // Update UI progressively so user sees results arriving
            setProducts([...allProducts]);
            hasProcessedAtLeastOne = true;
          }

          // Respectful delay between batches to avoid rate-limiting
          if (batchIdx < totalBatches - 1) {
            await sleep(1500);
          }
        }
        
        if (!hasProcessedAtLeastOne) {
          throw new Error("Failed to extract any products from the PDF. Please check that the file contains product data.");
        }

      } else if (uploadedFile && uploadedFile.type.includes('image')) {
        setLoadingStatus('Analyzing image...');
        const extracted = await extractData(uploadedFile, process.env.NEXT_PUBLIC_GOOGLE_API_KEY, userConfig, isConfigConfirmed);
        allProducts = extracted;
        setProducts(extracted);

      } else {
        setLoadingStatus('Generating sample data...');
        await sleep(2000);
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
              category: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
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
              rufus_summary: 'This Urban Threads denim jacket is the ideal blend of durability and comfort for craftsmen and urban explorers. It features reinforced denim perfect for spring or autumn lastspring layering, answering the need for a long-lasting, stylish outer layer.'
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
        setProducts(mockProducts);
        allProducts = mockProducts;
      }

      if (allProducts.length > 0) {
        const newCount = usageCount + 1;
        setUsageCount(newCount);
        localStorage.setItem('import_count', newCount.toString());

        setLoadingStatus(`Categorizing ${allProducts.length} products with AI…`);
        setLoadingProgress(85);
        // Run smart categorization BEFORE showing the review page
        const categorizedProducts = await handleSmartCategorization(allProducts);
        
        // Save to history
        setLoadingProgress(95);
        saveToHistory({
          fileName: fileName || 'Manual Entry',
          marketplace: (activeMarketplace as any) || 'shopify',
          productCount: categorizedProducts.length,
          products: categorizedProducts,
        });

        setProducts(categorizedProducts);
        setCurrentStep(3);
        setLoadingProgress(100);
        setLoadingStatus('');
        setIsLoading(false);
      } else {
        throw new Error('No products were extracted. Please try a different file.');
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      if (err.response) {
        console.error('API Error Response:', err.response);
      }
      setError(err.message || 'Failed to analyze. Please try again.');
      setLoadingStatus('');
      setLoadingProgress(0);
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
      'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Product Category', 'Google Product Category', 'Tags', 'Published',
      'Option1 Name', 'Option1 Value', 'Variant Price', 'Variant Grams', 
      'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant SKU', 'SEO Title', 'SEO Description'
    ];
    
    const rows: any[] = [];
    products.forEach(p => {

      const cleanGoogleCategory = p.shopify_service.google_product_category?.replace(/^gid:\/\/shopify\/TaxonomyCategory\//, '') || '';
      
      p.shopify_service.variants.forEach(v => {
        rows.push([
          p.shopify_service.handle,
          p.shopify_service.title,
          p.shopify_service.html_description,
          p.shopify_service.vendor,
          p.shopify_service.product_type,
          p.shopify_service.category,
          cleanGoogleCategory,
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
    setCurrentStep(4);
    setTimeout(() => {
      const downloadSection = document.getElementById('download-section');
      if (downloadSection) {
        downloadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };



  const handleSmartCategorization = async (productsToRefine: UnifiedProduct[]): Promise<UnifiedProduct[]> => {
    setIsCategorizing(true);
    try {
      const payload = {
        shopId: "extreme-test-lab",
        products: productsToRefine.map(p => ({
          title: p.shopify_service.title,
          sku: p.sync_id,
          price: p.shopify_service.variants[0]?.price || "0.00"
        }))
      };

      const res = await fetch('https://api.shopsready.com/api/v1/categories/group-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Categorization service failed');
      
      const responseData = await res.json();
      
      if (!responseData.success || !Array.isArray(responseData.data)) {
        throw new Error('Invalid response from categorization service');
      }

      // Merge Logic
      const updatedProducts = productsToRefine.map(p => {
        const match = responseData.data.find((r: any) => r.sku === p.sync_id);
        if (match) {
          const newDescription = match.description 
            ? `<p>${match.description}</p>` 
            : p.shopify_service.html_description;

          return {
            ...p,
            shopify_service: {
              ...p.shopify_service,
              title: match.refined_title || p.shopify_service.title,
              product_type: match.category || p.shopify_service.product_type,
              category: match.category || p.shopify_service.category || '',
              google_product_category: match.google_product_category || p.shopify_service.google_product_category,
              html_description: newDescription,
            },
            amazon_fba_service: {
               ...p.amazon_fba_service,
               flat_file_data: {
                 ...p.amazon_fba_service.flat_file_data,
                 item_name: match.refined_title || p.amazon_fba_service.flat_file_data.item_name,
                 item_type_keyword: match.category ? match.category.split(' > ').pop() || '' : p.amazon_fba_service.flat_file_data.item_type_keyword,
                 feed_product_type: match.category ? match.category.split(' > ').pop() || '' : p.amazon_fba_service.flat_file_data.feed_product_type,
                 bullets: match.description ? [match.description] : p.amazon_fba_service.flat_file_data.bullets
               }
            },
             readiness_report: {
                ...p.readiness_report,
                status: 'Categorized by AI'
             }
          } as UnifiedProduct; 
        }
        return p;
      });

      setIsCategorizing(false);
      return updatedProducts;

    } catch (err) {
      console.error('Categorization error:', err);
      setIsCategorizing(false);
      // Return original products if categorization fails
      return productsToRefine;
    }
  };

  const handleStartOver = () => {
    setActiveMarketplace(null);
    setCurrentStep(1);
    setInputText('');
    setProducts([]);
    setFileName('');
    sessionStorage.removeItem('target_system');
  };

  // ─── Paywall Modal ────────────────────────────────────────────────────────────
  // Inline paywall JSX (not a component) to prevent re-mounting on plan selection
  const paywallJsx = (
    <AnimatePresence>
      {showPaywall && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPaywall(false); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 24 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 p-7 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/4" />
              <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                <X className="w-4 h-4" />
              </button>
              <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Zap className="w-6 h-6 text-amber-900" />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-1">Free limit reached</h2>
              <p className="text-white/60 text-sm">You've used your {FREE_LIMIT} free generations today. Choose a plan to keep going.</p>
            </div>

            {/* Plans */}
            <div className="p-6 space-y-3">
              {/* Pay-per-use */}
              <button
                onClick={() => setSelectedPlan('pay-per-use')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all group ${
                  selectedPlan === 'pay-per-use'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                      selectedPlan === 'pay-per-use' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>⚡</div>
                    <span className="font-bold text-slate-900">Pay Per Generation</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">$1</span>
                    <span className="text-xs text-slate-400 ml-1">/ run</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 pl-10">One-time payment. Process any PDF once (no page limit), download immediately.</p>
              </button>

              {/* Monthly */}
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                  selectedPlan === 'monthly'
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="absolute top-3 right-3">
                  <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">Best Value</span>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                      selectedPlan === 'monthly' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>👑</div>
                    <span className="font-bold text-slate-900">Monthly Pro</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">$9.99</span>
                    <span className="text-xs text-slate-400 ml-1">/ month</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 pl-10">Unlimited generations (no limit) · Priority AI · Full history · Bulk exports</p>
              </button>

              {/* CTA */}
              <button
                disabled={!selectedPlan}
                onClick={() => {
                  // In a real app, integrate Stripe here
                  setShowPaywall(false);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {selectedPlan === 'monthly' ? 'Subscribe for $9.99/mo' : selectedPlan === 'pay-per-use' ? 'Pay $1 & Continue' : 'Select a Plan'}
              </button>

              <p className="text-center text-xs text-slate-400">Secure checkout · Cancel anytime · Instant access</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className=" min-h-screen flex flex-col bg-slate-50 font-sans pt-24">
      {paywallJsx}

      <header className="mb-2 text-center max-w-4xl mx-auto relative px-6 pt-2">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter mb-0.5">
          <span className="text-emerald-600">PDF</span> to {
            activeMarketplace === 'shopify' ? 'Shopify CSV' :
            activeMarketplace === 'amazon' ? 'Amazon Listing' :
            'Marketplace'
          } Generator
        </h1>
        
        <p className="text-base text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          {activeMarketplace === 'shopify' && <>Transform messy supplier data into high-converting <span className="text-emerald-600 font-bold">Shopify CSVs</span> with taxonomy mapping.</>}
          {activeMarketplace === 'amazon' && <>Transform messy supplier data into high-converting <span className="text-orange-500 font-bold">Amazon Listings</span> with SEO bullets.</>}
          {!activeMarketplace && <>Select a destination to start transforming your supplier data into retail-ready assets.</>}
        </p>
      </header>


      <div className=" max-w-xl mx-auto mb-5 flex-shrink-0 mt-1 px-6">
        <div className="relative">
          {/* Progress Line Background */}
          <div className="absolute top-5 left-[12.5%] w-[75%] h-0.5 bg-slate-100 rounded-full" />
          {/* Active Progress Line */}
          <div
            className="absolute top-5 left-[12.5%] h-0.5 bg-emerald-600 transition-all duration-700 ease-out rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
            style={{ width: `${Math.min(((currentStep - 1) / 3) * 75, 75)}%` }}
          />

          <div className="flex justify-between items-start w-full">
            {[
              { num: 1, label: 'Target Platform' },
              { num: 2, label: 'Upload Catalog' },
              { num: 3, label: 'Smart Processing' },
              { num: 4, label: 'Export Ready' }
            ].map((step) => (
              <div key={step.num} className="flex-1 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all duration-500 z-10 ${
                  currentStep > step.num ? 'bg-emerald-600 text-white shadow-lg scale-105' :
                  currentStep === step.num ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-lg shadow-emerald-100' :
                  'bg-white text-slate-300 border-2 border-slate-100'
                }`}>
                  {currentStep > step.num ? <Check className="w-5 h-5" strokeWidth={3} /> : step.num}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest text-center leading-tight transition-all duration-300 ${
                  currentStep >= step.num ? 'text-emerald-800 opacity-100' : 'text-slate-400 opacity-60'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>


      <main className=" flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-8 pb-6 scroll-smooth">
        <div className="max-w-6xl mx-auto">
        

        {currentStep === 2 && (
          <div className="flex flex-col lg:flex-row gap-5 w-full transition-all">

            {/* ─── LEFT SIDEBAR: Filters & Status ─────────────────────────────── */}
            <div className="lg:w-64 flex-shrink-0 space-y-2.5">

              {/* Active Platform Card */}
              <div className={`rounded-2xl p-5 border text-white relative overflow-hidden ${
                activeMarketplace === 'shopify'
                  ? 'bg-gradient-to-br from-[#5a8a1f] to-[#95BF47] border-[#84ab3c]'
                  : activeMarketplace === 'amazon'
                  ? 'bg-gradient-to-br from-[#c47800] to-[#FF9900] border-[#e68a00]'
                  : 'bg-gradient-to-br from-slate-700 to-slate-600 border-slate-500'
              }`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
                <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-2">Active Platform</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {activeMarketplace === 'shopify' && <img src="/shopifyLogo.png" className="w-6 h-6 object-contain brightness-0 invert" alt="" />}
                    {activeMarketplace === 'amazon' && <img src="/amazonLogo.png" className="w-6 h-6 object-contain brightness-0 invert" alt="" />}
                    {!activeMarketplace && <Package className="w-5 h-5 text-white/70" />}
                  </div>
                  <div>
                    <p className="font-black text-base leading-tight">
                      {activeMarketplace === 'shopify' ? 'Shopify Architect' : activeMarketplace === 'amazon' ? 'Amazon Architect' : 'No Platform'}
                    </p>
                    <p className="text-white/60 text-xs">{activeMarketplace ? 'Ready to process' : 'Select below'}</p>
                  </div>
                </div>
                {activeMarketplace && (
                  <button
                    onClick={handleStartOver}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white/80 hover:text-white text-xs font-bold transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                    Switch Platform
                  </button>
                )}
              </div>

              {/* Usage Quota Meter */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily Quota</p>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    usageCount >= FREE_LIMIT ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {usageCount >= FREE_LIMIT ? 'Limit Reached' : `${FREE_LIMIT - usageCount} Left`}
                  </span>
                </div>
                {/* Segmented bar */}
                <div className="flex gap-1.5 mb-3">
                  {Array.from({ length: FREE_LIMIT }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2.5 flex-1 rounded-full transition-all ${
                        i < usageCount ? 'bg-emerald-500' : 'bg-slate-100 border border-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  {usageCount} of {FREE_LIMIT} free generations used today.
                </p>
                {usageCount >= FREE_LIMIT ? (
                  <button
                    onClick={() => setShowPaywall(true)}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-black rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Unlock More · from $1
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPaywall(true)}
                    className="w-full py-2 border border-dashed border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 text-xs font-bold rounded-xl transition-all"
                  >
                    Upgrade for Unlimited
                  </button>
                )}
              </div>


              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Configuration</p>
                  <button
                    onClick={() => setIsConfigModalOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all group"
                    title="Edit Configuration"
                  >
                    <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Output Channel', value: userConfig.targetChannels },
                    { label: 'Default Qty', value: userConfig.defaultQty },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">{item.label}</span>
                      <span className="text-xs text-slate-900 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 max-w-[120px] truncate text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
                {isConfigConfirmed && (
                  <div className="mt-3 flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                    <Check className="w-3.5 h-3.5" />
                    Config confirmed
                  </div>
                )}
              </div>

            </div>

            {/* ─── RIGHT PANEL: Upload & Process ──────────────────────────────── */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-[1.75rem] p-6 shadow-2xl border border-slate-100 h-full">

                {/* Input tabs */}
                <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-6">
                  <button
                    onClick={() => setInputTab('upload')}
                    className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      inputTab === 'upload'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Upload className="w-4 h-4" /> Upload Catalog
                  </button>
                  <button
                    onClick={() => setInputTab('manual')}
                    className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                      inputTab === 'manual'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Manual Entry
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
                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[1.75rem] bg-emerald-50/10 hover:bg-emerald-50/20 transition-all cursor-pointer group h-[260px] ${
                          activeMarketplace
                          ? 'border-emerald-500/30 ring-4 ring-emerald-500/5'
                          : 'border-slate-100'
                        }`}
                      >
                        <div className={`w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg border border-slate-100 mb-4 group-hover:scale-110 transition-transform ${activeMarketplace ? 'text-emerald-600' : 'text-slate-400'}`}>
                          <Upload className="w-6 h-6" />
                        </div>
                        <h3 className="font-heading font-black text-slate-900 text-xl mb-1">
                          {activeMarketplace ? 'Click to Upload' : 'Platform Required'}
                        </h3>
                        <p className="text-[13px] text-slate-500 text-center max-w-[280px] font-medium">
                          {activeMarketplace
                            ? `PDF, Images or Spreadsheets — we'll extract every product automatically using 2026 AI models.`
                            : 'Select your target platform on the left to enable architecture processing.'}
                        </p>
                        {fileName && (
                          <div className="mt-4 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest ring-2 ring-emerald-200 flex items-center gap-2">
                            <Check className="w-3.5 h-3.5" />
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
                          placeholder={activeMarketplace ? "Example: Blue Shirt, Size M, SKU: 123, Price: $15.00\nRed Jacket, Size L, SKU: 456, Price: $45.00" : "Please select a target platform first."}
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

                {/* Process Button */}
                <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-4">
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading || (inputTab === 'upload' ? !fileName : !inputText.trim())}
                    className={`w-full cursor-pointer py-4 font-black rounded-3xl shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1.5 text-xl relative overflow-hidden ${
                      usageCount >= FREE_LIMIT
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-orange-100 hover:from-amber-600 hover:to-orange-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isLoading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="truncate max-w-[280px] text-base font-bold">{loadingStatus || (isCategorizing ? 'AI Categorizing Products...' : 'Processing Catalog...')}</span>
                        </>
                      ) : usageCount >= FREE_LIMIT ? (
                        <>
                          <Zap className="w-6 h-6" />
                          Unlock & Process ($1 or $9.99/mo)
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6" />
                          Start Processing
                        </>
                      )}
                    </div>
                    {isLoading && loadingProgress > 0 && (
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mt-1">
                        <motion.div
                          className="h-full bg-white rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${loadingProgress}%` }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                      </div>
                    )}
                  </button>

                  {usageCount < FREE_LIMIT && (
                    <p className="text-center text-xs text-slate-400 font-medium">
                      {FREE_LIMIT - usageCount} free {FREE_LIMIT - usageCount === 1 ? 'generation' : 'generations'} remaining today
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}





        {currentStep === 3 && (
          <div className="space-y-10">
            {/* Sticky Header */}
            <div className="sticky top-4 z-40 bg-white/80 backdrop-blur-md rounded-2xl p-3 md:p-4 shadow-lg border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-3 transition-all">
              <div className="text-center md:text-left">
                <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-none mb-1">Review Your Products</h2>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                  <span className="text-emerald-600 font-black">{products.length} Products</span> • {products.reduce((acc, p) => acc + p.shopify_service.variants.length, 0)} Global Variants Synchronized
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                {/* Button Removed */}
                <button
                  onClick={() => downloadMultiChannelPackage()}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-900 text-white text-sm font-bold rounded-xl hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-xl group"
                >
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" /> Sync Package
                </button>
                <button
                  onClick={() => handleConfirm()}
                  className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Confirm & Sync <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-8">#</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Master Product</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Smart Marketplace Category</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Variants</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Match</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((product, pIdx) => (
                      <React.Fragment key={product.sync_id || pIdx}>
                        <tr className="hover:bg-emerald-50/30 transition-colors group cursor-pointer" onClick={() => setActiveAmazonToolId(activeAmazonToolId === product.sync_id ? null : product.sync_id)}>
                          <td className="px-4 py-2 text-[11px] font-bold text-slate-400">{pIdx + 1}</td>
                          <td className="px-4 py-2">
                             <div className="flex flex-col">
                               <span className="text-[13px] font-bold text-slate-900 leading-tight truncate max-w-[250px]">{product.shopify_service.title}</span>
                               <span className="text-[10px] text-slate-400 font-medium">SKU: {product.sync_id}</span>
                             </div>
                          </td>
                          <td className="px-4 py-2">
                             <div className="flex flex-col gap-1.5 min-w-[200px]">
                               <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border w-fit ${
                                   activeMarketplace === 'shopify' 
                                   ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                   : 'bg-orange-50 text-orange-700 border-orange-100'
                               }`}>
                                  {activeMarketplace === 'shopify' ? <img src="/shopifyLogo.png" className="w-3 h-3 object-contain" alt="" /> : <img src="/amazonLogo.png" className="w-3 h-3 object-contain" alt="" />}
                                  {/* Show Leaf Category */}
                                  {(activeMarketplace === 'shopify' 
                                     ? product.shopify_service.product_type 
                                     : product.amazon_fba_service.flat_file_data.feed_product_type
                                  ).split('>').pop()?.trim() || 'Pending...'}
                               </div>
                               
                               {/* Full Breadcrumb */}
                               <span className="text-[10px] text-slate-500 font-medium leading-relaxed break-words whitespace-normal">
                                 {activeMarketplace === 'shopify' 
                                    ? product.shopify_service.product_type 
                                    : product.amazon_fba_service.flat_file_data.item_type_keyword}
                               </span>
                             </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                              {product.shopify_service.variants.length} SKU
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex items-center justify-center">
                              <div className={`w-2 h-2 rounded-full ${product.readiness_report.status.includes('100') ? 'bg-emerald-500' : 'bg-orange-400'} shadow-sm`} />
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right">
                            <button 
                              className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                              title="Edit Details"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                        
                        {/* Expandable Technical View */}
                        {activeAmazonToolId === product.sync_id && (
                          <tr>
                            <td colSpan={6} className="bg-slate-50/80 px-8 py-4 border-y border-slate-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                  <div>
                                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">Technical Variants Matrix</h5>
                                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                      <table className="w-full text-[11px]">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                          <tr>
                                            <th className="px-3 py-2 font-black text-slate-500 uppercase">Option</th>
                                            <th className="px-3 py-2 font-black text-slate-500 uppercase text-center">Price</th>
                                            <th className="px-3 py-2 font-black text-slate-500 uppercase">SKU</th>
                                            <th className="px-3 py-2 font-black text-slate-500 uppercase text-right">Qty</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {product.shopify_service.variants.map((v, vIdx) => (
                                            <tr key={vIdx}>
                                              <td className="px-3 py-1.5 font-bold text-slate-700">{v.option1_value}</td>
                                              <td className="px-3 py-1.5 text-center text-slate-900 font-bold">${v.price}</td>
                                              <td className="px-3 py-1.5 font-mono text-emerald-600 font-medium">{v.sku}</td>
                                              <td className="px-3 py-1.5 text-right font-black text-emerald-600">{v.inventory_qty}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                   <div>
                                     <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3">Architect Context</h5>
                                     <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                                        <div>
                                          <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Rufus SEO Summary</span>
                                          <p className="text-[12px] text-slate-600 italic leading-relaxed">"{product.amazon_fba_service.rufus_summary}"</p>
                                        </div>
                                        <div className="pt-3 border-t border-slate-100">
                                          <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">A+ Storytelling Module</span>
                                          <p className="text-[11px] text-slate-900 font-medium">{product.aplus_content_service.modules[0]?.body || 'No A+ content detected.'}</p>
                                        </div>
                                         <div className="flex gap-2 pt-2">
                                           <button onClick={() => downloadShopifyCSV()} className="flex-1 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all">Export Shopify</button>
                                           <button onClick={() => downloadMultiChannelPackage()} className="flex-1 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all">Export Amazon</button>
                                        </div>
                                     </div>
                                   </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Back & Next Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-10">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 text-slate-400 font-bold hover:text-slate-900 transition-all flex items-center gap-2 group/back text-[11px] uppercase tracking-widest"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Upload
              </button>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => handleConfirm()}
                  className="flex-1 md:flex-none px-10 py-4 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                >
                  Finalize & Sync <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div id="download-section" className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-2xl border border-slate-100 text-center max-w-4xl mx-auto relative overflow-hidden animate-in fade-in zoom-in duration-500">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-600" />
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl" />
            
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner group transition-transform hover:rotate-6 duration-500">
              <Check className="w-8 h-8" />
            </div>
            
            <div className="space-y-4 mb-8 text-center">
              <h2 className="text-4xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight">
                Export <span className="text-emerald-600">Complete.</span>
              </h2>
              {/* <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
                Your catalog has been synchronized with **Official 2026 Marketplace Taxonomies**. Direct-upload files are ready below.
              </p> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl relative group hover:border-emerald-200 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                        <img src="/shopifyLogo.png" className="w-6 h-6 object-contain" alt="" />
                      </div>
                      <h5 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Shopify Storefront</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4">Full product catalog with high-fidelity B2B variants and Smart Category mapping.</p>
                    <button onClick={() => downloadShopifyCSV()} className="w-full py-2.5 bg-white border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                      <Download className="w-3.5 h-3.5" /> Download CSV
                    </button>
                </div>
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl relative group hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                        <img src="/amazonLogo.png" className="w-6 h-6 object-contain" alt="" />
                      </div>
                      <h5 className="text-[12px] font-black text-slate-900 uppercase tracking-widest">Amazon Marketplace</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-4">Search-optimized listings with Rufus AI semantic layers and A+ Storytelling modules.</p>
                    <button onClick={() => downloadMultiChannelPackage()} className="w-full py-2.5 bg-white border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                      <Download className="w-3.5 h-3.5" /> Download Pro Package
                    </button>
                </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 mb-10 text-left relative group">
                <div className="flex items-center gap-2 text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-3">
                  <Sparkles className="w-4 h-4" /> ShopsReady Architect Verdict
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic border-l-2 border-emerald-200 pl-4">
                  "Architecture verified. All 2026 category breadcrumbs injected. B2B Variant grouping synchronized. Your data is 100% market-ready."
                </p>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <button
                onClick={handleStartOver}
                className="px-10 py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
              >
                Start New Project
              </button>
              <Link
                href="/"
                className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-500 font-bold rounded-2xl hover:border-slate-300 transition-all text-sm"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

        </div>
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
        {currentStep === 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-100 p-10 max-w-4xl w-full relative overflow-hidden"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -ml-32 -mb-32 opacity-50" />

              <div className="relative z-10 text-center mb-12">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">
                  <Sparkles className="w-3 h-3 text-emerald-500" /> Platform Selection
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">
                  Where are you selling?
                </h2>
                <p className="text-slate-500 text-lg font-medium">Select your platform. We&apos;ll automatically organize your products into official 2026 categories.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {[
                  {
                    id: 'shopify',
                    name: 'Shopify Store',
                    tagline: 'Standard Marketplace Category Synced',
                    description: 'Direct mapping to Official Shopify 2026 Category Trees.',
                    logo: '/shopifyLogo.png',
                    color: 'emerald'
                  },
                  {
                    id: 'amazon',
                    name: 'Amazon Marketplace',
                    tagline: 'Browse Node Optimized',
                    description: 'High-precision mapping to Amazon Service Browse Nodes.',
                    logo: '/amazonLogo.png',
                    color: 'orange'
                  }
                ].map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleMarketplaceSelect(choice.id as any)}
                    className="group p-8 bg-white border-2 border-slate-50 rounded-[2.5rem] text-left hover:border-slate-900 transition-all duration-300 flex flex-col h-full cursor-pointer shadow-sm hover:shadow-2xl"
                  >
                    <div className="w-16 h-16 rounded-2xl mb-6 flex items-center justify-center bg-white shadow-sm overflow-hidden p-2 group-hover:scale-110 transition-transform duration-300">
                      <img 
                        src={choice.logo} 
                        alt={choice.name} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="mb-4">
                      <h3 className="text-2xl font-black text-slate-900 mb-1">{choice.name}</h3>
                      <span className={`text-[10px] font-black uppercase tracking-widest text-${choice.color}-600 bg-${choice.color}-50 px-2 py-0.5 rounded-md border border-${choice.color}-100`}>
                        {choice.tagline}
                      </span>
                    </div>
                    <p className="text-slate-500 leading-relaxed font-medium text-sm flex-grow mb-6">{choice.description}</p>
                    <div className="flex items-center gap-2 text-slate-900 font-black text-[10px] uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                      Initialize Architect <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-slate-50 text-center">
                <Link href="/" className="text-slate-400 hover:text-slate-900 text-sm font-bold transition-colors">
                  Return to Dashboard
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
