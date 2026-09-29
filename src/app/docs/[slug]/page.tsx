import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDocItem, getAdjacentDocs, getDocsCategories, DOCS_MANIFEST } from "@/lib/docs";
import DocsSidebar from "@/components/docs/DocsSidebar";
import DocsHeader from "@/components/docs/DocsHeader";
import DocsTOC from "@/components/docs/DocsTOC";
import DocsPagination from "@/components/docs/DocsPagination";
import MarkdownViewer from "@/components/docs/MarkdownViewer";
import DocsLayoutWrapper from "@/components/docs/DocsLayoutWrapper";

interface DocPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocItem(slug);

  if (!doc) {
    return {
      title: "Document Not Found | Audit Platform Docs",
    };
  }

  return {
    title: `${doc.chapterNumber !== undefined ? `Ch ${doc.chapterNumber}: ` : ""}${doc.title} | Audit Platform Docs`,
    description: doc.description,
  };
}

export async function generateStaticParams() {
  return DOCS_MANIFEST.map((doc) => ({
    slug: doc.slug,
  }));
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const doc = await getDocItem(slug);

  if (!doc) {
    notFound();
  }

  const { prev, next } = getAdjacentDocs(slug);
  const categories = getDocsCategories();

  return (
    <DocsLayoutWrapper>
      <div className="flex min-h-screen bg-[#f8fafc]">
        {/* Left Navigation Sidebar */}
        <DocsSidebar categories={categories} />

        {/* Main Content + Right TOC */}
        <div className="flex flex-1 min-w-0 overflow-y-auto">
          {/* Document Reading Column */}
          <main className="flex-1 min-w-0 px-4 py-8 sm:px-8 md:px-12 max-w-4xl mx-auto">
            {/* Document Header */}
            <DocsHeader meta={doc} />

            {/* Markdown Content */}
            <div className="min-w-0">
              <MarkdownViewer content={doc.content} />
            </div>

            {/* Previous / Next Pagination */}
            <DocsPagination prev={prev} next={next} />

            {/* Document Footer */}
            <div className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400 pb-12">
              <p>
                Audit Platform Documentation • {doc.filename} • Grounded in application implementation.
              </p>
            </div>
          </main>

          {/* Right Sticky Table of Contents */}
          <DocsTOC headings={doc.headings} />
        </div>
      </div>
    </DocsLayoutWrapper>
  );
}
