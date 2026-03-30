import type { MetadataRoute } from 'next';
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: 'https://opentax.indiatax.ai',
      lastModified,
      priority: 1.0,
    },
    {
      url: 'https://opentax.indiatax.ai/about',
      lastModified,
      priority: 0.8,
    },
  ];
}
