import Link from "next/link";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

type MarkdownContentProps = {
  content: string;
};

const LINK_CLASS = "font-medium text-primary underline-offset-2 hover:underline";

const components: Components = {
  h2: ({ children }) => (
    <h2 className="mt-8 mb-3 text-base font-semibold text-foreground first:mt-0">{children}</h2>
  ),
  p: ({ children }) => <p className="mb-4 text-pretty text-secondary last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-4 list-disc space-y-1.5 pl-5 text-secondary last:mb-0">{children}</ul>
  ),
  li: ({ children }) => <li className="text-pretty">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  a: ({ href, children }) => {
    if (href?.startsWith("/") && !href.startsWith("//")) {
      return (
        <Link href={href} className={LINK_CLASS}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={LINK_CLASS} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
};

/**
 * 法務ページ向けの Markdown 本文レンダラ。
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
}
