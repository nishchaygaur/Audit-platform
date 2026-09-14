import fs from "fs/promises";
import path from "path";
import {
  type DocItem,
  type DocCategory,
  DOCS_MANIFEST,
  getDocMetadataBySlug,
  extractHeadings,
  calculateReadingTime,
} from "./docs-manifest";

export * from "./docs-manifest";

export async function getDocItem(slug: string): Promise<DocItem | null> {
  const meta = getDocMetadataBySlug(slug);
  if (!meta) return null;

  try {
    const docsDir = path.join(process.cwd(), "docs");
    const filePath = path.join(docsDir, meta.filename);
    const content = await fs.readFile(filePath, "utf-8");
    const headings = extractHeadings(content);
    const readingTimeMinutes = calculateReadingTime(content);

    return {
      ...meta,
      content,
      headings,
      readingTimeMinutes,
    };
  } catch (error) {
    console.error(`Error loading documentation file for slug ${slug}:`, error);
    return null;
  }
}

export interface SearchDocResult {
  slug: string;
  title: string;
  category: DocCategory;
  chapterNumber?: number;
  snippet: string;
  matchScore: number;
}

export async function searchDocs(query: string): Promise<SearchDocResult[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.toLowerCase().trim();
  const queryTerms = cleanQuery.split(/\s+/);
  const results: SearchDocResult[] = [];
  const docsDir = path.join(process.cwd(), "docs");

  for (const doc of DOCS_MANIFEST) {
    let matchScore = 0;
    const titleLower = doc.title.toLowerCase();
    const descLower = doc.description.toLowerCase();
    const categoryLower = doc.category.toLowerCase();

    if (titleLower.includes(cleanQuery)) matchScore += 100;
    if (descLower.includes(cleanQuery)) matchScore += 40;
    if (categoryLower.includes(cleanQuery)) matchScore += 20;

    for (const term of queryTerms) {
      if (titleLower.includes(term)) matchScore += 25;
      if (descLower.includes(term)) matchScore += 10;
    }

    let snippet = doc.description;

    try {
      const filePath = path.join(docsDir, doc.filename);
      const content = await fs.readFile(filePath, "utf-8");
      const contentLower = content.toLowerCase();

      const matchIndex = contentLower.indexOf(cleanQuery);
      if (matchIndex !== -1) {
        matchScore += 30;
        const start = Math.max(0, matchIndex - 60);
        const end = Math.min(content.length, matchIndex + cleanQuery.length + 80);
        snippet = "..." + content.slice(start, end).replace(/\n/g, " ").replace(/[#*`_]/g, "") + "...";
      } else {
        // test term matches
        for (const term of queryTerms) {
          const tIdx = contentLower.indexOf(term);
          if (tIdx !== -1) {
            matchScore += 5;
            const start = Math.max(0, tIdx - 40);
            const end = Math.min(content.length, tIdx + term.length + 60);
            snippet = "..." + content.slice(start, end).replace(/\n/g, " ").replace(/[#*`_]/g, "") + "...";
            break;
          }
        }
      }
    } catch {
      // Use fallback snippet from description
    }

    if (matchScore > 0) {
      results.push({
        slug: doc.slug,
        title: doc.title,
        category: doc.category,
        chapterNumber: doc.chapterNumber,
        snippet,
        matchScore,
      });
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}
