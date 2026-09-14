"use server";

import { searchDocs, type SearchDocResult } from "@/lib/docs";

export async function searchDocumentation(query: string): Promise<{ success: boolean; data: SearchDocResult[] }> {
  try {
    const results = await searchDocs(query);
    return { success: true, data: results };
  } catch (error) {
    console.error("Error searching documentation:", error);
    return { success: false, data: [] };
  }
}
