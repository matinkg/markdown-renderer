import { marked } from 'marked';
import hljs from 'highlight.js';
import katex from 'katex';
import renderMathInElement from 'katex/dist/contrib/auto-render';

export function render(markdownText) {
    // --- START: MathJax/KaTeX block processing ---
    const mathBlocks = [];
    let textWithPlaceholders = markdownText.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
        const id = mathBlocks.length;
        mathBlocks.push(match);
        return `<span class="math-placeholder" data-id="${id}"></span>`;
    });

    textWithPlaceholders = textWithPlaceholders.replace(/\$([^$\n]+?)\$/g, (match) => {
        const id = mathBlocks.length;
        mathBlocks.push(match);
        return `<span class="math-placeholder" data-id="${id}"></span>`;
    });
    // --- END: MathJax/KaTeX block processing ---

    // Configure marked
    marked.setOptions({
        breaks: true,
        gfm: true,
    });

    marked.use({
        tokenizer: {
            code(src, tokens) {
                return undefined;
            }
        }
    });

    let html = '';
    try {
        html = marked.parse(textWithPlaceholders);
    } catch (error) {
        console.error("Markdown parsing error:", error);
        return `<div class="alert alert-danger">Error parsing Markdown.</div>`;
    }

    const outputElement = document.createElement('div');
    outputElement.innerHTML = html;

    // --- START: Restore Math Blocks ---
    outputElement.querySelectorAll('span.math-placeholder').forEach(placeholder => {
        const id = parseInt(placeholder.dataset.id, 10);
        if (id >= 0 && id < mathBlocks.length) {
            const mathTextNode = document.createTextNode(mathBlocks[id]);
            placeholder.parentNode.replaceChild(mathTextNode, placeholder);
        }
    });
    // --- END: Restore Math Blocks ---

    // Render LaTeX math using KaTeX
    try {
        renderMathInElement(outputElement, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ],
            throwOnError: false
        });
    } catch (error) {
        console.error("KaTeX rendering error:", error);
    }

    // Apply Syntax Highlighting to BLOCK code
    outputElement.querySelectorAll('pre code').forEach((block) => {
        if (!block.classList.contains('hljs')) {
            try {
                hljs.highlightElement(block);
            } catch (error) {
                console.error("Highlight.js error on block:", error, block);
                block.classList.add('hljs-error');
            }
        }
    });

    return outputElement.innerHTML;
}
