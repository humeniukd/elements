import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    build: {
        sourcemap: true,
        minify: "terser",
        terserOptions: {
            toplevel: true,
            mangle: {
                properties: {
                    regex: /^_/,
                }
            },
            compress: true
        },
        target: ['chrome111', 'firefox128', 'safari16.4'],
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'src/index.ts'),
                react: resolve(__dirname, 'src/react.ts')
            },
            output: {
                entryFileNames: `[name].js`,
                chunkFileNames: `[name].js`
            },
            external: ['react', '@loudyo/elements']
        }
    }
})