// lib/pdf-text-extractor.ts
// Extracts raw text from PDF pages using pdfjs-dist.
// This is MUCH faster than sending full PDF binary to Gemini because:
// - Text is 10-100x smaller than PDF binary
// - Gemini processes text far faster than parsing PDF pages
// - Allows larger batch sizes (50+ pages of text per request)

import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker — use the bundled worker from pdfjs-dist
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  hasContent: boolean; // true if the page has any meaningful text (not blank)
}

/**
 * Extract text from all pages of a PDF file.
 * Returns an array of { pageNumber, text, hasContent } objects.
 * ALL pages with text are included — only truly blank pages are marked.
 */
export async function extractTextFromPDF(file: File): Promise<ExtractedPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const pages: ExtractedPage[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    pages.push({
      pageNumber: i,
      text,
      // Only skip truly blank/empty pages (less than 5 characters)
      hasContent: text.length >= 5,
    });
  }

  return pages;
}

/**
 * Group extracted pages into text chunks for batch processing.
 * Each chunk contains up to `pagesPerChunk` pages of concatenated text.
 * Includes ALL pages that have any text content — no product filtering, no skipping.
 */
export function groupPagesIntoTextChunks(
  pages: ExtractedPage[],
  pagesPerChunk: number = 30
): { chunkText: string; pageRange: string; pageCount: number }[] {
  // Include every page that has content — only skip truly blank pages
  const contentPages = pages.filter(p => p.hasContent);
  const chunks: { chunkText: string; pageRange: string; pageCount: number }[] = [];

  for (let i = 0; i < contentPages.length; i += pagesPerChunk) {
    const batch = contentPages.slice(i, i + pagesPerChunk);
    const chunkText = batch
      .map(p => `--- PAGE ${p.pageNumber} ---\n${p.text}`)
      .join('\n\n');

    const first = batch[0].pageNumber;
    const last = batch[batch.length - 1].pageNumber;

    chunks.push({
      chunkText,
      pageRange: `pages ${first}–${last}`,
      pageCount: batch.length,
    });
  }

  return chunks;
}
