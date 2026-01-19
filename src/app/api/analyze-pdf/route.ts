import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    // Debug logging
    console.log('API Key exists:', !!process.env.GOOGLE_API_KEY);
    console.log('Image received:', !!image);

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Initialize Gemini 1.5 Flash model with versioned name
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",  
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    console.log('Model initialized successfully');

    // Construct the prompt
    const prompt = `You are an expert data extraction assistant for e-commerce product management. Analyze this image of a supplier document (PDF, spreadsheet, or email) and extract ALL product information.

Your task:
1. Identify every product listed in the document
2. Extract the following fields for EACH product:
   - Product Name/Title
   - Price/Cost (remove currency symbols)
   - SKU/Product Code
   - Stock/Quantity (if available, otherwise use 0)
   - Brand/Vendor (if available, otherwise use "Unknown")
   - Product Type/Category (if available, otherwise use "General")

3. Return ONLY a JSON array with this exact structure:
{
  "products": [
    {
      "handle": "product-name-lowercase-with-dashes",
      "title": "Exact Product Name",
      "body": "<p>Product description if available, otherwise generic text</p>",
      "vendor": "Brand or Vendor name",
      "type": "Product Category",
      "tags": "comma, separated, relevant, tags",
      "variantPrice": "price without currency symbol",
      "variantSKU": "SKU or product code",
      "inventoryQty": "stock quantity as number or 0"
    }
  ]
}

Rules:
- For "handle": convert title to lowercase, replace spaces with hyphens, remove special characters
- For "variantPrice": remove $, €, or other currency symbols, keep only numbers and decimal point
- For "inventoryQty": use "0" if stock is not mentioned
- For "body": create a simple HTML paragraph with available description or use "<p>Product item</p>"
- For "tags": extract relevant keywords from the product name and type
- Extract ALL products visible in the image
- Return valid JSON only, no additional text or markdown`;


    const imageParts = [
      {
        inlineData: {
          data: image.split(',')[1] || image, 
          mimeType: 'image/jpeg'
        }
      }
    ];


    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: text },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!parsedData.products || !Array.isArray(parsedData.products)) {
      return NextResponse.json(
        { error: 'Invalid response structure', details: parsedData },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      products: parsedData.products,
      count: parsedData.products.length
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze document',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
