import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";
import { MarkdownContent } from "@/components/markdown-content";
import { loadLegalDocument } from "@/lib/load-legal-document";

const doc = loadLegalDocument("terms");

export const metadata: Metadata = {
  title: doc.pageTitle,
  description: doc.description,
  alternates: { canonical: `/${doc.canonicalPath}` },
};

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
