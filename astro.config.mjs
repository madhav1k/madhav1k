import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import alpinejs from '@astrojs/alpinejs';
import { remarkAlert } from "remark-github-blockquote-alert";
import astroExpressiveCode from 'astro-expressive-code'
import mermaid from "astro-mermaid";

export default defineConfig({
  site: 'https://madhav1k.github.io',
  base: '/madhav1k/',  
  integrations: [
    tailwind(),
    alpinejs(),
    astroExpressiveCode({
      shiki: { theme: 'one-dark-pro', wrap: true },
    }),
    mermaid(),
  ],
  markdown: {
    remarkPlugins: [ 
      remarkAlert,
    ],
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true
    }
  }
});