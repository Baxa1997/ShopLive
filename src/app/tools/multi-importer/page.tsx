'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Check, ArrowRight, ArrowLeft, Loader2, FileSpreadsheet, Sparkles, AlertCircle, Package, ShoppingBag, Tag, Settings, X, History, Zap, Crown, LogIn } from 'lucide-react';
import Link from 'next/link';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { saveProject } from '@/lib/projects';
import { getUsageStatus, incrementUsage, ANON_FREE_LIMIT, LOGGED_IN_FREE_LIMIT } from '@/lib/limits';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/utils/supabase/client';
import { redirectToCheckout, type StripePlan } from '@/lib/stripe';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { PDFDocument } from 'pdf-lib';
import { extractTextFromPDF, groupPagesIntoTextChunks } from '@/lib/pdf-text-extractor';

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


export default function ShopifyImporterPage() {
  const { user, isPro } = useAuth();
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
  const [usageLimit, setUsageLimit] = useState(ANON_FREE_LIMIT);
  const [inputTab, setInputTab] = useState<'upload' | 'manual'>('upload');
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallGate, setPaywallGate] = useState<'signup' | 'payment'>('signup');
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro' | 'ultra' | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<StripePlan | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

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
  const [showEnrichmentModal, setShowEnrichmentModal] = useState(false);
  const [pendingCoreProducts, setPendingCoreProducts] = useState<any[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);

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

  // Load usage status from Supabase on mount and whenever user changes
  useEffect(() => {
    getUsageStatus().then(status => {
      setUsageCount(status.count);
      setUsageLimit(status.limit === Infinity ? Infinity : status.limit);
    });
  }, [user]);

  // Google sign-in handler (for the paywall sign-up gate)
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Google login error:', error.message);
      setIsSigningIn(false);
    }
  };

  // Stripe checkout handler for the paywall
  const handlePaywallCheckout = async (plan: StripePlan) => {
    setCheckoutError('');
    setIsCheckoutLoading(plan);
    try {
      await redirectToCheckout(plan, user?.email ?? undefined);
    } catch (err: any) {
      setCheckoutError(err.message || 'Something went wrong. Please try again.');
      setIsCheckoutLoading(null);
    }
  };

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

  // ═══════════════════════════════════════════════════════════
  // PASS 1: Lightweight extraction — binary PDF, small output
  // Only extracts: product name, SKU, vendor, variants, category, price
  // ~150 chars per product (vs ~800 before) → 3x more products per call
  // ═══════════════════════════════════════════════════════════
  interface CoreProduct {
    title: string;
    vendor: string;
    product_type: string;
    google_product_category: string;
    variants: { sku: string; size: string; price: string; }[];
  }

  const extractCoreData = async (
    file: File | Blob,
    apiKey: string,
    config: typeof userConfig,
    isConfigConfirmed: boolean,
    expectedCount?: number,
    structureContext?: string
  ): Promise<CoreProduct[]> => {
    const genAI = new GoogleGenerativeAI(apiKey);

    const schema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          vendor: { type: SchemaType.STRING },
          product_type: { type: SchemaType.STRING },
          google_product_category: { type: SchemaType.STRING },
          variants: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                sku: { type: SchemaType.STRING },
                size: { type: SchemaType.STRING },
                price: { type: SchemaType.STRING },
              }
            }
          }
        },
        required: ["title", "vendor", "product_type", "google_product_category", "variants"]
      }
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
      },
    });

    const imagePart = await fileToGenerativePart(file as File);
    const countHint = expectedCount ? `\nThis chunk has approximately ${expectedCount} products. Extract ALL of them.` : '';
    const structureHint = structureContext ? `\n\nDOCUMENT STRUCTURE:\n${structureContext}\n` : '';

    const prompt = `Extract ALL products from these PDF pages.${countHint}${structureHint}

RULES:
- Use EXACT product names from the PDF. NEVER invent or rephrase names.
- Use EXACT Item#/SKU from the PDF tables. NEVER generate fake codes.
- Each size/color row is a VARIANT under one product. Use Item# as sku, Size as size.
- vendor: Extract from PDF header/logo. NEVER use "ShopsReady".
- product_type: Best category for the product (e.g., "Terracotta Pots", "Planters").
- google_product_category: Most specific Google Product Category breadcrumb (e.g., "Home & Garden > Lawn & Garden > Gardening > Pots & Planters").
- price: Use exact price from PDF. If missing, use "".
- Include EVERY product. Missing a product is not acceptable.`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("Invalid response format");
    return parsed;
  };

  // ═══════════════════════════════════════════════════════════
  // PASS 2: Enrichment — text-only, generates marketplace fields
  // Takes extracted core data → produces full UnifiedProduct[]
  // No PDF needed, just product names and categories
  // ═══════════════════════════════════════════════════════════
  const enrichProducts = async (
    coreProducts: CoreProduct[],
    apiKey: string,
    config: typeof userConfig,
    isConfigConfirmed: boolean
  ): Promise<UnifiedProduct[]> => {
    const genAI = new GoogleGenerativeAI(apiKey);

    const needsShopify = config.targetChannels === 'Shopify' || config.targetChannels === 'Both';
    const needsAmazon = config.targetChannels === 'Amazon' || config.targetChannels === 'Both';

    // Build schema dynamically based on selected channels
    const schemaProps: any = {
      index: { type: SchemaType.NUMBER },
      google_product_category: { type: SchemaType.STRING },
    };
    const requiredFields = ["index", "google_product_category"];

    if (needsShopify) {
      schemaProps.html_description = { type: SchemaType.STRING };
      schemaProps.tags = { type: SchemaType.STRING };
      schemaProps.seo_title = { type: SchemaType.STRING };
      schemaProps.seo_description = { type: SchemaType.STRING };
      requiredFields.push("html_description", "tags", "seo_title", "seo_description");
    }
    if (needsAmazon) {
      schemaProps.amazon_bullets = { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } };
      schemaProps.search_terms = { type: SchemaType.STRING };
      requiredFields.push("amazon_bullets", "search_terms");
    }

    const schema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: schemaProps,
        required: requiredFields
      }
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
      },
    });

    const productList = coreProducts.map((p, i) =>
      `[${i}] "${p.title}" by ${p.vendor} | Type: ${p.product_type} | Variants: ${p.variants.map(v => `${v.sku} (${v.size})`).join(', ')}`
    ).join('\n');

    // Build prompt only for selected channels
    let fieldInstructions = '- index: the product index number [0], [1], etc.\n- google_product_category: Most specific Google Product Category breadcrumb\n';
    if (needsShopify) {
      fieldInstructions += `- html_description: Professional HTML description (<strong>, <li> tags). Keep concise.
- tags: Comma-separated SEO tags
- seo_title: SEO title (max 60 chars)
- seo_description: SEO meta description (max 155 chars)\n`;
    }
    if (needsAmazon) {
      fieldInstructions += `- amazon_bullets: 5 BOLD CAPS bullet points for Amazon
- search_terms: 250 chars of Amazon search terms\n`;
    }

    const prompt = `Generate ${needsShopify && needsAmazon ? 'marketplace' : needsShopify ? 'Shopify' : 'Amazon'} content for these products.

Products:
${productList}

For EACH product, generate:
${fieldInstructions}
Return a JSON array with one object per product, in the same order.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const enrichments = JSON.parse(text);

    // Merge core data + enrichment
    return coreProducts.map((core, i) => {
      const enrichment = Array.isArray(enrichments) ? enrichments.find((e: any) => e.index === i) || enrichments[i] : null;
      const handle = core.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      return {
        sync_id: core.variants[0]?.sku || `PROD-${i + 1}`,
        success_feedback: {
          total_variants: core.variants.length,
          channels_ready: config.targetChannels === 'Both' ? ['Shopify', 'Amazon FBA'] : [config.targetChannels],
          summary_message: `${core.title} with ${core.variants.length} variant(s) ready for export.`
        },
        shopify_service: {
          handle,
          title: core.title,
          html_description: needsShopify ? (enrichment?.html_description || '') : '',
          tags: needsShopify ? (enrichment?.tags || core.product_type) : core.product_type,
          vendor: core.vendor,
          product_type: core.product_type,
          category: core.google_product_category || enrichment?.google_product_category || core.product_type,
          google_product_category: core.google_product_category || enrichment?.google_product_category || '',
          seo_title: needsShopify ? (enrichment?.seo_title || core.title) : core.title,
          seo_description: needsShopify ? (enrichment?.seo_description || '') : '',
          variants: core.variants.map(v => ({
            sku: v.sku,
            price: v.price || (isConfigConfirmed ? '' : '0'),
            option1_name: 'Size',
            option1_value: v.size,
            grams: 0,
            inventory_qty: isConfigConfirmed ? (config.defaultQty || 0) : 0,
          }))
        },
        amazon_fba_service: {
          flat_file_data: {
            item_name: core.title,
            item_type_keyword: core.product_type,
            feed_product_type: core.product_type,
            brand_name: core.vendor,
            standard_price: core.variants[0]?.price || '',
            bullets: needsAmazon ? (enrichment?.amazon_bullets || []) : []
          },
          search_terms: needsAmazon ? (enrichment?.search_terms || '') : '',
          rufus_summary: needsAmazon ? `${core.title} by ${core.vendor}. Available in ${core.variants.length} size(s).` : ''
        },
        aplus_content_service: {
          modules: needsShopify ? [{ header: core.title, body: enrichment?.html_description || '' }] : [],
          image_alt_text: core.title
        },
        readiness_report: {
          status: 'High',
          missing_fields: []
        }
      } as UnifiedProduct;
    });
  };

  // ── Text-mode extraction (sends pre-extracted text, much faster) ──
  const extractDataFromText = async (
    textContent: string,
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
              channels_ready: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
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
                  bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
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
                  properties: { header: { type: SchemaType.STRING }, body: { type: SchemaType.STRING } }
                }
              },
              image_alt_text: { type: SchemaType.STRING }
            }
          },
          readiness_report: {
            type: SchemaType.OBJECT,
            properties: {
              status: { type: SchemaType.STRING },
              missing_fields: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            }
          }
        },
        required: ["sync_id", "shopify_service", "amazon_fba_service", "aplus_content_service", "readiness_report"]
      }
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
      },
    });

    const target_system = config.targetChannels === 'Both' ? ['shopify', 'amazon'] : config.targetChannels.toLowerCase();
    const countHint = expectedCount ? `\n\nCRITICAL: This data contains approximately ${expectedCount} distinct product(s). You MUST extract ALL of them.` : '';

    const prompt = `Act as a Senior Marketplace Architect.

Goal: Process product data for high-integrity export.
Selected Output Channels: ${config.targetChannels} (Target: ${JSON.stringify(target_system)}).${countHint}

Rules:
1. Extract brand/manufacturer from data. NEVER use 'ShopsReady'.
2. COMPLETENESS: Output one JSON object for EVERY distinct product. Missing a product is not acceptable.
3. Use EXACT product titles. Group variants (sizes/colors) into ONE product with a 'variants' array.
4. Descriptions: HTML for Shopify, Raw Text for Amazon. Use ONLY data from the source.
5. Map to the most specific Shopify Category or Amazon Browse Node.
6. Amazon: 5 BOLD CAPS bullet points + 250-char search terms.
7. Stock: Use exact values if found. If missing: use ${config.defaultQty} if Config confirmed, else '0'.
8. Pricing: Extract wholesale price. Multiply by ${config.priceMarkup} if Config confirmed.
9. Return ONLY a valid JSON array. No filler data.

--- PRODUCT DATA (extracted from PDF pages) ---

${textContent}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) throw new Error("Invalid response format from AI");
    return parsed;
  };

  // Helper: convert CoreProduct[] to basic UnifiedProduct[] (no enrichment)
  const coreToBasicProducts = (coreProducts: CoreProduct[]): UnifiedProduct[] => {
    return coreProducts.map((core, i) => {
      const handle = core.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return {
        sync_id: core.variants[0]?.sku || `PROD-${i + 1}`,
        success_feedback: {
          total_variants: core.variants.length,
          channels_ready: userConfig.targetChannels === 'Both' ? ['Shopify', 'Amazon FBA'] : [userConfig.targetChannels],
          summary_message: `${core.title} with ${core.variants.length} variant(s) ready for export.`
        },
        shopify_service: {
          handle,
          title: core.title,
          html_description: '',
          tags: core.product_type,
          vendor: core.vendor,
          product_type: core.product_type,
          category: core.google_product_category || core.product_type,
          google_product_category: core.google_product_category || '',
          seo_title: core.title,
          seo_description: '',
          variants: core.variants.map(v => ({
            sku: v.sku,
            price: v.price || '0',
            option1_name: 'Size',
            option1_value: v.size,
            grams: 0,
            inventory_qty: isConfigConfirmed ? (userConfig.defaultQty || 0) : 0,
          }))
        },
        amazon_fba_service: {
          flat_file_data: {
            item_name: core.title,
            item_type_keyword: core.product_type,
            feed_product_type: core.product_type,
            brand_name: core.vendor,
            standard_price: core.variants[0]?.price || '',
            bullets: []
          },
          search_terms: '',
          rufus_summary: `${core.title} by ${core.vendor}. Available in ${core.variants.length} size(s).`
        },
        aplus_content_service: { modules: [], image_alt_text: core.title },
        readiness_report: { status: 'High', missing_fields: [] }
      } as UnifiedProduct;
    });
  };

  // Finalize: categorize, save, and show review page
  const finalizeProcessing = async (productsToFinalize: UnifiedProduct[]) => {
    try {
      setIsLoading(true);
      setLoadingStatus(`Categorizing ${productsToFinalize.length} products with AI…`);
      setLoadingProgress(85);

      // Increment usage counter
      await incrementUsage();
      setUsageCount(prev => prev + 1);

      // Run smart categorization
      const categorizedProducts = await handleSmartCategorization(productsToFinalize);

      // Save to Supabase (async — don't block UI)
      setLoadingProgress(95);
      saveProject({
        fileName: fileName || 'Manual Entry',
        marketplace: (activeMarketplace as any) || 'shopify',
        productCount: categorizedProducts.length,
        products: categorizedProducts,
      }).catch(err => console.warn('saveProject failed:', err));

      setProducts(categorizedProducts);
      setCurrentStep(3);
      setLoadingProgress(100);
      setLoadingStatus('');
      setIsLoading(false);
    } catch (err: any) {
      console.error('Finalization error:', err);
      setError(err.message || 'Failed to categorize products.');
      setIsLoading(false);
    }
  };

  // Skip enrichment — go straight to categorization
  const handleSkipEnrichment = async () => {
    setShowEnrichmentModal(false);
    setPendingCoreProducts([]);
    await finalizeProcessing(products);
  };

  // Enrichment handler (called from modal)
  const handleEnrichment = async () => {
    if (pendingCoreProducts.length === 0) return;
    setIsEnriching(true);
    setShowEnrichmentModal(false);
    setLoadingStatus(`Enriching ${pendingCoreProducts.length} products with descriptions, SEO & Amazon data…`);
    setIsLoading(true);
    setLoadingProgress(70);

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    const ENRICH_BATCH = 30;
    const enrichBatches = Math.ceil(pendingCoreProducts.length / ENRICH_BATCH);
    let enrichedProducts: UnifiedProduct[] = [];

    for (let i = 0; i < pendingCoreProducts.length; i += ENRICH_BATCH) {
      const batch = pendingCoreProducts.slice(i, i + ENRICH_BATCH);
      const batchNum = Math.floor(i / ENRICH_BATCH) + 1;
      setLoadingStatus(`Enriching batch ${batchNum}/${enrichBatches} (${batch.length} products)…`);

      try {
        const enriched = await enrichProducts(
          batch,
          process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
          userConfig,
          isConfigConfirmed
        );
        enrichedProducts = [...enrichedProducts, ...enriched];
        setProducts([...enrichedProducts]);
      } catch (err) {
        console.warn(`Enrichment batch ${batchNum} failed:`, err);
        const basic = coreToBasicProducts(batch);
        enrichedProducts = [...enrichedProducts, ...basic];
        setProducts([...enrichedProducts]);
      }

      setLoadingProgress(70 + Math.round(((i + batch.length) / pendingCoreProducts.length) * 28));
    }

    setPendingCoreProducts([]);
    setIsEnriching(false);

    // Now finalize: categorize and show review page
    await finalizeProcessing(enrichedProducts);
  };

  const handleAnalyze = async () => {
    // Pro users skip all limit checks
    if (!isPro) {
      // Check limit from Supabase before starting
      const status = await getUsageStatus();
      if (!status.canGenerate) {
        setPaywallGate(status.gate === 'none' ? 'signup' : status.gate);
        setShowPaywall(true);
        return;
      }
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



    try {
      if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
        throw new Error('API key not configured.');
      }
      if (uploadedFile && uploadedFile.type === 'application/pdf') {
        // ═══════════════════════════════════════════════════
        // SMART ENGINE: Two-phase PDF processing
        // Phase 1: Learn structure from first few pages (binary, 1 call)
        // Phase 2: Bulk-process extracted text with learned structure
        // ═══════════════════════════════════════════════════
        const CONCURRENCY = 5; // 5 parallel API calls
        let hasProcessedAtLeastOne = false;
        const seenTitles = new Set<string>();

        const arrayBuffer = await uploadedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const totalPages = pdfDoc.getPageCount();

        // ── PHASE 1: Structure Learning (~10s, 1 API call) ──
        setLoadingStatus(`Phase 1: Learning document structure from first pages…`);
        setLoadingProgress(5);

        let learnedStructure = '';
        try {
          // Send first 3 pages as binary so Gemini can SEE the layout
          const samplePages = Math.min(3, totalPages);
          const sampleDoc = await PDFDocument.create();
          const sampleIndices = Array.from({ length: samplePages }, (_, i) => i);
          const copiedSample = await sampleDoc.copyPages(pdfDoc, sampleIndices);
          copiedSample.forEach((page: any) => sampleDoc.addPage(page));
          const sampleBytes = await sampleDoc.save();
          const sampleBlob = new Blob([sampleBytes as any], { type: 'application/pdf' });
          const sampleFile = new File([sampleBlob], 'sample.pdf', { type: 'application/pdf' });
          const samplePart = await fileToGenerativePart(sampleFile);

          const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY!);
          const structureModel = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

          const structureResult = await structureModel.generateContent([
            `Analyze this product catalog PDF and describe EXACTLY the column structure and data layout.

Your response must include:
1. COLUMNS: List every column header you see (e.g., "Product Name", "SKU", "Size", "Color", "Price", "Qty", "UPC", etc.)
2. DATA FORMAT: How is each field formatted? (e.g., "Price is in USD with dollar sign", "SKU format: ABC-123")
3. VARIANT PATTERN: How are product variants shown? (e.g., "Same product in multiple rows with different sizes", "Sizes listed as comma-separated in one cell")
4. BRAND/VENDOR: Where is the brand or vendor name shown? (header, per-row, etc.)
5. GROUPING: Are products grouped by category, or is it a flat list?

Be precise and concise. This structure description will be used to parse extracted text from ALL pages.`,
            samplePart
          ]);

          learnedStructure = structureResult.response.text();
          console.log('Learned PDF structure:', learnedStructure.substring(0, 200));
        } catch (err) {
          console.warn('Structure learning failed, will use generic prompts:', err);
        }

        setLoadingProgress(15);

        // ── PASS 1: Lightweight core extraction (binary PDF, small output) ──
        setLoadingStatus(`Pass 1: Extracting products from ${totalPages} pages…`);
        setLoadingProgress(20);

        const batchSize = 10; // 10 pages per chunk (lightweight schema fits easily)
        const totalBatches = Math.ceil(totalPages / batchSize);
        let completedBatches = 0;
        let allCoreProducts: CoreProduct[] = [];
        const seenCoreTitles = new Set<string>();

        interface ChunkInfo { batchIdx: number; file: File; pageCount: number; label: string; }
        const chunks: ChunkInfo[] = [];

        for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
          const startPage = batchIdx * batchSize;
          const pageIndices: number[] = [];
          for (let j = 0; j < batchSize && (startPage + j) < totalPages; j++) {
            pageIndices.push(startPage + j);
          }
          const subDoc = await PDFDocument.create();
          const copiedPages = await subDoc.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach((page: any) => subDoc.addPage(page));
          const pdfBytes = await subDoc.save();
          const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
          const fileChunk = new File([blob], `chunk_${startPage}.pdf`, { type: 'application/pdf' });
          chunks.push({
            batchIdx,
            file: fileChunk,
            pageCount: pageIndices.length,
            label: `pages ${startPage + 1}–${Math.min(startPage + batchSize, totalPages)}`,
          });
        }

        // Process chunks in parallel waves
        for (let waveStart = 0; waveStart < chunks.length; waveStart += CONCURRENCY) {
          const wave = chunks.slice(waveStart, waveStart + CONCURRENCY);
          const waveNum = Math.floor(waveStart / CONCURRENCY) + 1;
          const totalWaves = Math.ceil(chunks.length / CONCURRENCY);

          setLoadingStatus(
            `Pass 1 — wave ${waveNum}/${totalWaves}: ${wave.map(c => c.label).join(', ')}…`
          );

          const waveResults = await Promise.allSettled(
            wave.map(async chunk => {
              for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                  return await extractCoreData(
                    chunk.file,
                    process.env.NEXT_PUBLIC_GOOGLE_API_KEY!,
                    userConfig,
                    isConfigConfirmed,
                    chunk.pageCount * 3,
                    learnedStructure || undefined
                  );
                } catch (err) {
                  console.warn(`Chunk ${chunk.label} attempt ${attempt} failed:`, err);
                  if (attempt < 2) await sleep(2000);
                }
              }
              return [] as CoreProduct[];
            })
          );

          for (const result of waveResults) {
            completedBatches++;
            if (result.status === 'fulfilled' && result.value.length > 0) {
              const uniqueChunk = result.value.filter(p => {
                const key = p.title?.trim().toLowerCase();
                if (!key || seenCoreTitles.has(key)) return false;
                seenCoreTitles.add(key);
                return true;
              });
              allCoreProducts = [...allCoreProducts, ...uniqueChunk];
              hasProcessedAtLeastOne = true;
            }
          }

          setLoadingProgress(20 + Math.round((completedBatches / totalBatches) * 40));
          if (waveStart + CONCURRENCY < chunks.length) await sleep(500);
        }

        if (!hasProcessedAtLeastOne || allCoreProducts.length === 0) {
          throw new Error("Failed to extract any products from the PDF.");
        }

        // ── Convert to basic products & show immediately ──
        allProducts = coreToBasicProducts(allCoreProducts);
        setProducts([...allProducts]);
        setLoadingProgress(90);

        // Store core products for optional enrichment
        setPendingCoreProducts(allCoreProducts);
        
        // Show enrichment modal — user can choose to enrich or skip
        setLoadingStatus(`✅ Extracted ${allCoreProducts.length} products! You can now enrich or proceed.`);
        setLoadingProgress(100);
        setIsLoading(false);
        setCurrentStep(2);
        setShowEnrichmentModal(true);
        return; // Exit — enrichment handled by modal callback

      } else if (uploadedFile && uploadedFile.type.includes('image')) {
        setLoadingStatus('Analyzing image...');
        const coreResult = await extractCoreData(uploadedFile, process.env.NEXT_PUBLIC_GOOGLE_API_KEY!, userConfig, isConfigConfirmed);
        if (coreResult.length > 0) {
          const enriched = await enrichProducts(coreResult, process.env.NEXT_PUBLIC_GOOGLE_API_KEY!, userConfig, isConfigConfirmed);
          allProducts = enriched;
          setProducts(enriched);
        }

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
        // Increment usage counter in Supabase
        await incrementUsage();
        setUsageCount(prev => prev + 1);

        setLoadingStatus(`Categorizing ${allProducts.length} products with AI…`);
        setLoadingProgress(85);
        // Run smart categorization BEFORE showing the review page
        const categorizedProducts = await handleSmartCategorization(allProducts);
        
        // Save to Supabase (async — don't block the UI)
        setLoadingProgress(95);
        saveProject({
          fileName: fileName || 'Manual Entry',
          marketplace: (activeMarketplace as any) || 'shopify',
          productCount: categorizedProducts.length,
          products: categorizedProducts,
        }).catch(err => console.warn('saveProject failed (user may not be logged in):', err));

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
    // Official Shopify CSV headers
    const headers = [
      'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags', 'Published',
      'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value', 'Option3 Name', 'Option3 Value',
      'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker', 'Variant Inventory Qty', 
      'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price', 
      'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable', 'Variant Barcode',
      'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card', 'SEO Title', 'SEO Description',
      'Google Product Category', 'Variant Image', 'Variant Weight Unit', 'Variant Tax Code', 'Cost per item', 'Status'
    ];
    
    const rows: any[] = [];
    products.forEach(p => {
      const cleanGoogleCategory = p.shopify_service.google_product_category?.replace(/^gid:\/\/shopify\/TaxonomyCategory\//, '') || '';
      
      p.shopify_service.variants.forEach((v, vIdx) => {
        rows.push([
          p.shopify_service.handle,
          vIdx === 0 ? p.shopify_service.title : '',
          vIdx === 0 ? p.shopify_service.html_description : '',
          p.shopify_service.vendor,
          p.shopify_service.category,
          p.shopify_service.product_type,
          p.shopify_service.tags,
          'TRUE', 
          v.option1_name || 'Title',
          v.option1_value || 'Default Title',
          '',
          '', 
          '',
          '',
          v.sku,
          v.grams || 0,
          'shopify', // Inventory Tracker
          v.inventory_qty || 0,
          'deny', // Inventory Policy
          'manual', // Fulfillment Service
          v.price,
          '', // Compare At Price
          'TRUE', // Requires Shipping
          'TRUE', // Taxable
          '', // Barcode
          '', // Image Src (Placeholder)
          '', // Image Position
          '', // Image Alt Text
          'FALSE', // Gift Card
          p.shopify_service.seo_title,
          p.shopify_service.seo_description,
          cleanGoogleCategory,
          '', // Variant Image
          'g', // Weight Unit
          '', // Tax Code
          '', // Cost per item
          'active' // Status
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

  // ─── Paywall Modal (two modes: signup vs payment) ──────────────────────────
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
            {/* ── GATE 1: Sign Up with Google ─────────────────────── */}
            {paywallGate === 'signup' && (
              <>
                {/* Header */}
                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-7 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
                  <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <LogIn className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight mb-1">You&apos;re doing great!</h2>
                  <p className="text-white/70 text-sm">You&apos;ve used your {ANON_FREE_LIMIT} free generations. Sign up to unlock {LOGGED_IN_FREE_LIMIT - ANON_FREE_LIMIT} more — completely free!</p>
                </div>

                {/* Benefits */}
                <div className="p-6 space-y-4">
                  <div className="space-y-2.5">
                    {[
                      { icon: Sparkles, text: `${LOGGED_IN_FREE_LIMIT - ANON_FREE_LIMIT} more free generations`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                      { icon: History, text: 'Save & access your generation history', color: 'text-blue-600', bg: 'bg-blue-50' },
                      { icon: Zap, text: 'Unlock pay-per-use & Pro plans', color: 'text-amber-600', bg: 'bg-amber-50' },
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div className={`w-8 h-8 ${benefit.bg} ${benefit.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <benefit.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{benefit.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Google Sign In Button */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
                  >
                    <AnimatePresence>
                      {isSigningIn && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-slate-900 flex items-center justify-center z-10"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Signing in...</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".8"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".8"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".8"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <p className="text-center text-[10px] text-slate-400">By joining, you agree to our Terms of Use and Privacy Policy.</p>
                </div>
              </>
            )}

            {/* ── GATE 2: Payment (Pay $1 or Go Pro) ─────────────── */}
            {paywallGate === 'payment' && (
              <>
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
                  <h2 className="text-2xl font-black tracking-tight mb-1">All free generations used</h2>
                  <p className="text-white/60 text-sm">You&apos;ve used all {LOGGED_IN_FREE_LIMIT} free generations today. Choose how to continue.</p>
                </div>

                {/* Plans */}
                <div className="p-6 space-y-3">
                  {/* Standard */}
                  <button
                    onClick={() => setSelectedPlan('standard')}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all group ${
                      selectedPlan === 'standard'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                          selectedPlan === 'standard' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>⚡</div>
                        <span className="font-bold text-slate-900">Standard</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900">$1.25</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 pl-10">3 generations. Process PDFs, download CSVs instantly.</p>
                  </button>

                  {/* Pro */}
                  <button
                    onClick={() => setSelectedPlan('pro')}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                      selectedPlan === 'pro'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="absolute top-3 right-3">
                      <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">Popular</span>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                          selectedPlan === 'pro' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>⭐</div>
                        <span className="font-bold text-slate-900">Pro</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900">$5.25</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 pl-10">15 generations · Priority AI · Full history</p>
                  </button>

                  {/* Ultra */}
                  <button
                    onClick={() => setSelectedPlan('ultra')}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${
                      selectedPlan === 'ultra'
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="absolute top-3 right-3">
                      <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">Best Value</span>
                    </div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                          selectedPlan === 'ultra' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>👑</div>
                        <span className="font-bold text-slate-900">Ultra</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900">$14.25</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 pl-10">Unlimited generations · Unlimited PDF pages · Monthly subscription</p>
                  </button>

                  {/* Checkout error */}
                  {checkoutError && (
                    <p className="text-sm text-red-500 font-semibold text-center">{checkoutError}</p>
                  )}

                  {/* CTA — Stripe checkout */}
                  <button
                    disabled={!selectedPlan || !!isCheckoutLoading}
                    onClick={() => {
                      if (selectedPlan === 'standard') handlePaywallCheckout('standard');
                      if (selectedPlan === 'pro') handlePaywallCheckout('pro');
                      if (selectedPlan === 'ultra') handlePaywallCheckout('ultra');
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCheckoutLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Checkout...</>
                    ) : (
                      <><Zap className="w-4 h-4" />
                      {selectedPlan === 'ultra' ? 'Subscribe Ultra — $14.25/mo' : selectedPlan === 'pro' ? 'Get Pro — $5.25' : selectedPlan === 'standard' ? 'Get Standard — $1.25' : 'Select a Plan'}
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-slate-400">Secure checkout · Instant access · One-time payment</p>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className=" min-h-screen flex flex-col bg-slate-50 font-sans pt-24">
      {paywallJsx}

      {/* Enrichment Modal */}
      <AnimatePresence>
        {showEnrichmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowEnrichmentModal(false); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {pendingCoreProducts.length} Products Extracted!
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    All product names, SKUs, variants, and categories are ready.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                  <p className="text-sm font-semibold text-amber-800 mb-1">
                    ✨ Optional: AI Enrichment
                  </p>
                  <p className="text-xs text-amber-700">
                    Add AI-generated descriptions, SEO titles, Amazon bullet points, and search terms. 
                    This takes approximately <strong>5–10 extra minutes</strong>.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={handleEnrichment}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
                  >
                    ✨ Yes, Enrich Products
                  </button>
                  <button
                    onClick={handleSkipEnrichment}
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition-all"
                  >
                    Skip — Proceed to Export
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

              {/* Usage Quota Meter — hidden for Pro users */}
              {isPro ? (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-emerald-600" />
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Pro Plan</p>
                  </div>
                  <p className="text-xs text-emerald-600 font-bold">Unlimited generations — no limits!</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily Quota</p>
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      usageCount >= (usageLimit === Infinity ? 9999 : usageLimit) ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {usageCount >= (usageLimit === Infinity ? 9999 : usageLimit)
                        ? 'Limit Reached'
                        : `${(usageLimit === Infinity ? '∞' : usageLimit - usageCount)} Left`}
                    </span>
                  </div>
                  {/* Segmented bar */}
                  <div className="flex gap-1.5 mb-3">
                    {Array.from({ length: usageLimit === Infinity ? 4 : (usageLimit as number) }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2.5 flex-1 rounded-full transition-all ${
                          i < usageCount ? 'bg-emerald-500' : 'bg-slate-100 border border-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    {usageCount} of {usageLimit === Infinity ? '∞' : usageLimit} free generations used today.
                    {!user && <span className="text-blue-500 font-bold"> Sign up for {LOGGED_IN_FREE_LIMIT - ANON_FREE_LIMIT} more!</span>}
                  </p>
                  {usageCount >= (usageLimit === Infinity ? 9999 : usageLimit) ? (
                    <button
                      onClick={() => {
                        setPaywallGate(user ? 'payment' : 'signup');
                        setShowPaywall(true);
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs font-black rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {user ? 'Unlock More · from $1' : 'Sign Up for Free Uses'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setPaywallGate('payment');
                        setShowPaywall(true);
                      }}
                      className="w-full py-2 border border-dashed border-slate-200 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 text-xs font-bold rounded-xl transition-all"
                    >
                      Upgrade for Unlimited
                    </button>
                  )}
                </div>
              )}


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
                      isPro
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-emerald-200 hover:from-emerald-700 hover:to-emerald-600 text-white'
                        : !user && usageCount >= ANON_FREE_LIMIT
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-indigo-100 hover:from-blue-600 hover:to-indigo-700 text-white'
                        : user && usageCount >= LOGGED_IN_FREE_LIMIT
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
                      ) : isPro ? (
                        <>
                          <Crown className="w-6 h-6" />
                          Start Processing
                          <span className="text-xs font-medium opacity-70 ml-1">(Pro — Unlimited)</span>
                        </>
                      ) : !user && usageCount >= ANON_FREE_LIMIT ? (
                        <>
                          <LogIn className="w-6 h-6" />
                          Sign Up to Continue (Free)
                        </>
                      ) : user && usageCount >= LOGGED_IN_FREE_LIMIT ? (
                        <>
                          <Zap className="w-6 h-6" />
                          Pay $1 to Process
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
