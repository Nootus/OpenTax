import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import AboutContent from './AboutContent';

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

export default function AboutPage() {
  const projectRoot = path.resolve(process.cwd(), '..');
  const docs = DOCS.map(({ id, label, filename }) => {
    const filePath = path.join(projectRoot, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    return { id, label, content };
  });

  return <AboutContent docs={docs} />;
}
