/**
 * Markdown Renderer Module
 * 
 * This module provides a comprehensive markdown rendering function that:
 * - Parses markdown using the 'marked' library
 * - Handles LaTeX math expressions using KaTeX
 * - Applies syntax highlighting to code blocks using highlight.js
 * - Preserves math expressions during markdown processing to avoid conflicts
 * 
 * The rendering process protects math expressions by temporarily replacing them
 * with placeholders, processing the markdown, then restoring and rendering the math.
 * 
 * @module markdown-renderer
 * @author Matin KG
 * @version 1.0.0
 */

// Core markdown parsing library
import { marked } from 'marked';
// Syntax highlighting for code blocks
import hljs from 'highlight.js';
// LaTeX math rendering
import katex from 'katex';
// Auto-render extension for KaTeX to find and render math in DOM
import renderMathInElement from 'katex/dist/contrib/auto-render';

/**
 * Renders markdown text to HTML with math support and syntax highlighting
 * 
 * @param {string} markdownText - The raw markdown text to render
 * @param {boolean} [isMathEnabled=true] - Whether to render LaTeX math expressions
 * @returns {string} The rendered HTML string
 * 
 * @example
 * const html = render('# Hello World\n\nThis is **bold** text with $x^2$ math.');
 * console.log(html); // Returns HTML with rendered markdown and math
 */
export function render(markdownText, isMathEnabled = true) {
    // Array to store math expressions temporarily during markdown processing
    const mathBlocks = [];
    let textWithPlaceholders = markdownText;

    if (isMathEnabled) {
        // Convert LaTeX-style delimiters to dollar-sign delimiters for broader compatibility
        // Escaped delimiters: \(...\) and \[...\]
        markdownText = markdownText.replace(/\\\((.*?)\\\)/gs, (match, mathContent) => {
            return `$${mathContent}$`;
        });
        markdownText = markdownText.replace(/\\\[(.*?)\\\]/gs, (match, mathContent) => {
            return `$$${mathContent}$$`;
        });

        /**
         * STEP 1: Protect mathexpressions from markdown processing
         * 
         * We need to extract math expressions before markdown processing because:
         * 1. Markdown might interfere with LaTeX syntax (underscores, asterisks, etc.)
         * 2. We want to render math after HTML structure is ready
         * 3. This ensures math expressions are preserved exactly as written
         */
        
        // Replace display math blocks ($$...$$) with placeholders
        textWithPlaceholders = markdownText.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
            const id = mathBlocks.length;
            mathBlocks.push(match);
            return `<span class="math-placeholder" data-id="${id}"></span>`;
        });

        // Replace inline math expressions ($...$) with placeholders
        textWithPlaceholders = textWithPlaceholders.replace(/\$([^$\n]+?)\$/g, (match) => {
            const id = mathBlocks.length;
            mathBlocks.push(match);
            return `<span class="math-placeholder" data-id="${id}"></span>`;
        });
    }

    /**
     * STEP 2: Configure markdown parser
     * 
     * Configuration options:
     * - breaks: true - Convert line breaks to <br> tags (GitHub-style)
     * - gfm: true - Enable GitHub Flavored Markdown features
     */
    marked.setOptions({
        breaks: true,  // Convert single line breaks to <br>
        gfm: true,     // Enable GitHub Flavored Markdown (tables, task lists, etc.)
    });

    // Custom tokenizer to handle specific cases if needed
    marked.use({
        tokenizer: {
            // Custom code block handling (currently returns undefined to use default)
            code(src, tokens) {
                return undefined;
            }
        }
    });

    /**
     * STEP 3: Parse markdown to HTML
     * 
     * Convert the markdown text (with math placeholders) to HTML.
     * If parsing fails, return an error message in a Bootstrap alert.
     */
    let html = '';
    try {
        html = marked.parse(textWithPlaceholders);
    } catch (error) {
        console.error("Markdown parsing error:", error);
        return `<div class="alert alert-danger">Error parsing Markdown.</div>`;
    }

    /**
     * STEP 4: Create DOM element and restore math expressions
     * 
     * We create a temporary DOM element to:
     * 1. Parse the HTML safely
     * 2. Restore math expressions from placeholders
     * 3. Apply KaTeX rendering to math expressions
     * 4. Apply syntax highlighting to code blocks
     */
    const outputElement = document.createElement('div');
    outputElement.innerHTML = html;

    if (isMathEnabled) {
        // Restore math expressions by replacing placeholders with original math text
        outputElement.querySelectorAll('span.math-placeholder').forEach(placeholder => {
            const id = parseInt(placeholder.dataset.id, 10);
            if (id >= 0 && id < mathBlocks.length) {
                // Replace placeholder with text node containing original math expression
                const mathTextNode = document.createTextNode(mathBlocks[id]);
                placeholder.parentNode.replaceChild(mathTextNode, placeholder);
            }
        });

        /**
         * STEP 5: Render LaTeX math expressions using KaTeX
         * 
         * KaTeX configuration:
         * - Display math: $$...$$ (block-level, centered)
         * - Inline math: $...$ (inline, within text flow)
         * - throwOnError: false (show error message instead of throwing)
         */
        try {
            renderMathInElement(outputElement, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },   // Block math
                    { left: '$', right: '$', display: false }     // Inline math
                ],
                throwOnError: false  // Show error in place instead of breaking
            });
        } catch (error) {
            console.error("KaTeX rendering error:", error);
        }
    }

    /**
     * STEP 6: Apply syntax highlighting to code blocks
     * 
     * Process all <pre><code> elements (code blocks) with highlight.js:
     * - Skip blocks already processed (have 'hljs' class)
     * - Auto-detect language or use specified language
     * - Add error class if highlighting fails
     * - Only highlights BLOCK code, not inline code elements
     */
    outputElement.querySelectorAll('pre code').forEach((block) => {
        // Skip already highlighted blocks to avoid double processing
        if (!block.classList.contains('hljs')) {
            try {
                hljs.highlightElement(block);
            } catch (error) {
                console.error("Highlight.js error on block:", error, block);
                // Add error class to indicate highlighting failed
                block.classList.add('hljs-error');
            }
        }
    });

    /**
     * STEP 7: Return the final HTML
     * 
     * The outputElement now contains:
     * - Properly rendered markdown structure
     * - Rendered LaTeX math expressions
     * - Syntax-highlighted code blocks
     * - Preserved HTML structure and attributes
     */
    return outputElement.innerHTML;
}
