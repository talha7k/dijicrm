import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { mdsvex } from "mdsvex";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: [".svelte", ".md"],
  preprocess: [
    vitePreprocess(),
    mdsvex({
      extensions: [".md"],
      smartypants: false,
      layout: false,
      highlight: false,
    }),
  ],

  kit: {
    adapter: adapter({
      runtime: "nodejs20.x",
    }),
  },
  compilerOptions: {
    runes: true,
  },
};

export default config;
