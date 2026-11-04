import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { GROUPS } from "./lib/components";

const prop = z.object({
  name: z.string(),
  type: z.string(),
  default: z.string().optional(),
  description: z.string(),
});

const components = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/components" }),
  schema: z.object({
    title: z.string(),
    group: z.enum(GROUPS),
    /** Position within the group. */
    order: z.number().int(),
    summary: z.string(),
    /** Needs a React island (client:*) in Astro to respond to input. */
    interactive: z.boolean().default(false),
    props: z.array(prop).min(1),
    a11y: z.array(z.string()).min(1),
  }),
});

export const collections = { components };
