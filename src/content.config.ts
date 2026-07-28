import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const shownotes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/shownotes" }),
  schema: z.object({}).optional(),
});

export const collections = {
  shownotes,
};
