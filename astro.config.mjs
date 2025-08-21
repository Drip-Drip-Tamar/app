import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
    site: 'https://dripdrip.tamar.org.uk',
    vite: {
        plugins: [tailwindcss()]
    },
    integrations: [react()],
    adapter: netlify({
        edgeMiddleware: false,
        functionPerRoute: false
    }),
    output: 'server',
    image: {
        service: {
            entrypoint: 'astro/assets/services/sharp'
        }
    },
    build: {
        inlineStylesheets: 'auto'
    }
});
