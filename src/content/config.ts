import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string().or(z.date()).optional(),
    publishDate: z.string().or(z.date()).optional(),
    updatedDate: z.string().or(z.date()).optional(),
    description: z.string().optional().default(''),
    keywords: z.array(z.string()).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
    category: z.string().optional(),
    author: z.string().optional(),
    takeaways: z.array(z.string()).optional().default([]),
    bookTitle: z.string().optional(),
    bookAuthor: z.string().optional(),
    recommendedFor: z.string().optional(),
    rating: z.number().min(0).max(5).optional(),
    sourceUrl: z.string().url().optional(),
  }).refine(data => data.date || data.publishDate, {
    message: "Either 'date' or 'publishDate' is required"
  })
});

export const collections = {
  'posts': postsCollection
};
