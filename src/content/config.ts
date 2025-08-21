import { defineCollection, z } from 'astro:content';

const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    summary: z.string(),
    image: z.string().optional(),
    featured: z.boolean().default(false),
    author: z.string().default('Drip Drip Tamar'),
    tags: z.array(z.string()).default([]),
  }),
});

const pagesCollection = defineCollection({
  type: 'content', 
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    lastUpdated: z.date().optional(),
  }),
});

export const collections = {
  'news': newsCollection,
  'pages': pagesCollection,
};