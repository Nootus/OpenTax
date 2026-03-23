import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import type { Root, Element, Parent } from 'hast';

/**
 * Rehype plugin that:
 * - Rewrites `web/public/<file>` image srcs to `/<file>` (Next.js public root)
 * - Removes images whose src is a relative path that can't be resolved
 * - Opens external anchor links in a new tab
 */
function rehypeFixAssets() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName === 'img') {
        const src = node.properties?.src as string | undefined;
        if (!src) return;
        if (src.startsWith('web/public/')) {
          node.properties!.src = '/' + src.slice('web/public/'.length);
        } else if (!src.startsWith('http')) {
          (parent as Parent).children.splice(index as number, 1);
          return index as number;
        }
        // Convert height/width HTML attributes to inline styles so Tailwind
        // prose rules (which set height:auto) don't override them.
        const h = node.properties?.height;
        const w = node.properties?.width;
        if (h || w) {
          const parts: string[] = [];
          if (h) parts.push(`height:${h}px`);
          if (w) parts.push(`width:${w}px`);
          if (h && !w) parts.push('width:auto');
          const existing = (node.properties?.style as string) ?? '';
          node.properties!.style = existing ? `${existing};${parts.join(';')}` : parts.join(';');
          delete node.properties!.height;
          delete node.properties!.width;
        }
      }

      // Convert legacy align="center" attribute to inline style.
      // If the element (or any direct <a> child) contains an <img>, use flexbox
      // so that prose's "img { display:block }" rule doesn't break inline layout.
      if (node.properties?.align) {
        const align = node.properties.align as string;
        const children = (node.children ?? []) as Element[];
        const hasImgDescendant = children.some(
          (c) =>
            c.tagName === 'img' ||
            // <a><img/></a> pattern
            (c.tagName === 'a' &&
              ((c.children ?? []) as Element[]).some((g) => g.tagName === 'img')),
        );
        const centerStyle =
          align === 'center' && hasImgDescendant
            ? 'display:flex;align-items:center;justify-content:center;gap:0.5rem;flex-wrap:wrap'
            : `text-align:${align}`;
        const existing = (node.properties?.style as string) ?? '';
        node.properties!.style = existing ? `${existing};${centerStyle}` : centerStyle;
        delete node.properties!.align;
      }

      if (node.tagName === 'a') {
        const href = node.properties?.href as string | undefined;
        if (href?.startsWith('http')) {
          node.properties!.target = '_blank';
          node.properties!.rel = 'noopener noreferrer';
        }
      }
    });
  };
}

/**
 * Converts a Markdown string to an HTML string.
 * Runs entirely on the server — safe to call in Server Components or route handlers.
 * Supports GitHub-Flavoured Markdown (tables, strikethrough, task lists, etc.)
 * and passes through raw HTML blocks embedded in the source.
 */
export async function mdToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeFixAssets)
    .use(rehypeStringify)
    .process(markdown);

  return String(file);
}
