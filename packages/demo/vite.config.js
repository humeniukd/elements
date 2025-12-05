import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [ tailwindcss() ],
    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                accordion: resolve(__dirname, 'accordion.html'),
                autocomplete: resolve(__dirname, 'autocomplete.html'),
                dialog: resolve(__dirname, 'dialog.html'),
                dropdown: resolve(__dirname, 'dropdown.html'),
                popover: resolve(__dirname, 'popover.html'),
                select: resolve(__dirname, 'select.html'),
                spotlight: resolve(__dirname, 'spotlight.html'),
                tabs: resolve(__dirname, 'tabs.html')
            }
        }
    }
})