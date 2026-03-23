import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import AboutContent from './AboutContent';
import { mdToHtml } from '@/utils/mdToHtml';

export const metadata: Metadata = {
  title: 'About — OpenTax',
  description:
    'Learn about OpenTax — its architecture, contribution guidelines, target users, and license.',
};

const DOCS = [
  { id: 'readme', label: 'README', filename: 'README.md' },
  { id: 'contributing', label: 'Contributing', filename: 'CONTRIBUTING.md' },
  { id: 'target-users', label: 'Target Users', filename: 'TARGETUSERS.md' },
  { id: 'technical', label: 'Technical', filename: 'TECHNICAL.md' },
  { id: 'license', label: 'License', filename: 'LICENSE' },
];

/**
 * The Apache LICENSE file uses large leading-space indentation to visually
 * centre the header, which markdown treats as code blocks (4-space rule).
 * We convert the three header lines into centred markdown headings and
 * strip remaining per-line leading whitespace for the rest of the body.
 */
function normaliseLicense(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let headerDone = false;

  // The first non-empty lines before the blank separator are the centred header.
  // Convert them: line 0 → h1, line 1 → h2 (version), line 2 → URL link.
  let headerLines: string[] = [];
  let i = 0;
  for (; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!headerDone && trimmed === '' && headerLines.length > 0) {
      headerDone = true;
      break;
    }
    if (trimmed) headerLines.push(trimmed);
  }

  if (headerLines.length >= 1) {
    out.push(`<h1 style="text-align:center">${headerLines[0]}</h1>`);
  }
  if (headerLines.length >= 2) {
    out.push(`<h2 style="text-align:center">${headerLines[1]}</h2>`);
  }
  if (headerLines.length >= 3) {
    const url = headerLines[2];
    out.push(`<p style="text-align:center"><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></p>`);
  }

  out.push(''); // blank line after header block

  // Rest of the body — just strip leading indent to avoid code-block treatment
  for (let j = i + 1; j < lines.length; j++) {
    out.push(lines[j].trimStart());
  }

  return out.join('\n');
}

export default async function AboutPage() {
  const projectRoot = path.resolve(process.cwd(), '..');
  const docs = await Promise.all(
    DOCS.map(async ({ id, label, filename }) => {
      const filePath = path.join(projectRoot, filename);
      let markdown = fs.readFileSync(filePath, 'utf-8');
      if (id === 'license') markdown = normaliseLicense(markdown);
      const html = await mdToHtml(markdown);
      return { id, label, html };
    }),
  );

  return <AboutContent docs={docs} />;
}
