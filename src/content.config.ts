import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'astro/zod';

const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema({
    extend: z.object({
      lastVerified: z.string().optional(),
      sourcePaths: z.array(z.string()).default([]),
      officialDocs: z.array(z.url()).default([]),
    }),
  }),
});

export const collections = { docs };
