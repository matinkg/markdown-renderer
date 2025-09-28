/**
 * Vite Configuration for Markdown Renderer
 * 
 * This configuration sets up the build process for the markdown renderer application.
 * 
 * Key configurations:
 * - base: Sets the public path for GitHub Pages deployment
 * - The base path should match the repository name for proper asset loading
 * 
 * For local development: The base path is ignored by the dev server
 * For production build: Assets will be referenced relative to /markdown-renderer/
 * 
 * @see https://vitejs.dev/config/
 */
import { defineConfig } from 'vite'

export default defineConfig({
  // Base public path for GitHub Pages deployment
  // Change this if deploying to a different subdirectory
  base: '/markdown-renderer/',
})