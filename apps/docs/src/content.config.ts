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

const avoidItem = z.object({
  text: z.string(),
  /** A component id ("select") or a pattern ("patterns/forms") to use instead. */
  instead: z.string().optional(),
});

const components = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/components" }),
  schema: z.object({
    title: z.string(),
    group: z.enum(GROUPS),
    /** Position within the group. */
    order: z.number().int(),
    summary: z.string(),
    /** What the component is for. Required from Task 7. */
    use: z.array(z.string()).min(1).optional(),
    /** What it is not for, and what to use instead. Required from Task 7. */
    avoid: z.array(avoidItem).min(1).optional(),
    /** Needs a React island (client:*) in Astro to respond to input. */
    interactive: z.boolean().default(false),
    props: z.array(prop).min(1),
    a11y: z.array(z.string()).min(1),
  }),
});

const patterns = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/patterns" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    /** Numbered rules, shown before the examples. */
    rules: z.array(z.string()).min(1),
    /** Component ids the pattern uses, linked at the foot of the page. */
    components: z.array(z.string()).min(1),
  }),
});

export const collections = { components, patterns };
