import type { Metadata } from "next";
import { headers } from "next/headers";
import { LegalPageLayout } from "@/components/legal-page-layout";
import { MarkdownContent } from "@/components/markdown-content";
import { loadLegalDocument } from "@/lib/load-legal-document";
import { requestMetadata } from "@/lib/site-metadata";

const doc = loadLegalDocument("terms");

export async function generateMetadata(): Promise<Metadata> {
  return requestMetadata(await headers(), {
    title: doc.pageTitle,
    description: doc.description,
    url: `/${doc.canonicalPath}`,
  });
}

/**
 * 利用規約ページ
 */
export default function TermsPage() {
  return (
    <LegalPageLayout title={doc.title} dateText={doc.lastUpdated}>
      <MarkdownContent content={doc.content} />
    </LegalPageLayout>
  );
}
