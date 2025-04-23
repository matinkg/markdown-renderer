document.addEventListener('DOMContentLoaded', () => {
    const markdownInput = document.getElementById('markdown-input');
    const markdownOutput = document.getElementById('markdown-output');
    const toggleInputSwitch = document.getElementById('toggleInputSwitch');
    const inputColumn = document.getElementById('input-column');
    const outputColumn = document.getElementById('output-column');

    // --- Debounce function ---
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    // --- Render Markdown ---
    function renderMarkdown() {
        const markdownText = markdownInput.value;

        // Configure marked (WITHOUT the highlight option)
        marked.setOptions({
            breaks: true, // Convert single line breaks to <br>
            gfm: true,    // Enable GitHub Flavored Markdown
            // REMOVED: highlight function - highlight.js will be called after rendering
        });

        // Parse Markdown
        try {
            const html = marked.parse(markdownText);
            markdownOutput.innerHTML = html; // Add the generated HTML to the output area

            // --- Apply Syntax Highlighting AFTER content is in DOM ---
            // Find all 'pre code' blocks within the output area just rendered
            markdownOutput.querySelectorAll('pre code').forEach((block) => {
                // Check if already highlighted to prevent potential issues on re-renders
                // highlightElement adds the 'hljs' class, so we check for its absence
                if (!block.classList.contains('hljs')) {
                    try {
                        // Tell highlight.js to process this specific block
                        hljs.highlightElement(block);
                    } catch (error) {
                        console.error("Highlight.js error on block:", error, block);
                        // Optionally apply a fallback class or style to indicate an error
                        block.classList.add('hljs-error');
                    }
                }
            });

            // --- Enhance Code Blocks (Add Copy Button, Collapse, etc.) ---
            // Run this AFTER highlighting has been applied by hljs.highlightElement
            enhanceCodeBlocks();

        } catch (error) {
            console.error("Markdown parsing error:", error);
            markdownOutput.innerHTML = `<div class="alert alert-danger">Error parsing Markdown. Please check your input.</div>`;
        }
    }

    // --- Enhance Code Blocks (Add Copy Button, Collapse) ---
    function enhanceCodeBlocks() {
        // Keep track of processed pre elements to avoid double wrapping if renderMarkdown runs multiple times quickly
        const processedPres = new Set();

        markdownOutput.querySelectorAll('pre').forEach((preElement) => {
            // Check if this pre element has already been processed in this enhancement pass
            if (processedPres.has(preElement)) {
                return;
            }
            // Check if it's already wrapped (e.g., from a previous render that wasn't fully cleared)
            if (preElement.parentElement.classList.contains('code-block-wrapper')) {
                // It's already enhanced, maybe just update language if needed? Or skip.
                // For simplicity, we can skip re-enhancing fully wrapped blocks.
                processedPres.add(preElement); // Mark its original pre as processed anyway
                return;
            }

            const codeElement = preElement.querySelector('code');
            // If no <code> tag found inside <pre>, skip
            if (!codeElement) return;

            // --- Proceed with enhancement ---

            // 1. Create Wrapper Div
            const wrapper = document.createElement('div');
            wrapper.classList.add('code-block-wrapper');
            // Insert the wrapper right before the pre element in the DOM
            preElement.parentNode.insertBefore(wrapper, preElement);
            // Move the pre element inside the newly created wrapper
            wrapper.appendChild(preElement);
            processedPres.add(preElement); // Mark this <pre> as processed for this run

            // 2. Extract Language (from class added by marked or highlight.js)
            let language = 'plaintext'; // Default language
            // Look for a class starting with 'language-' (marked.js standard)
            const langClass = Array.from(codeElement.classList).find(cls => cls.startsWith('language-'));
            if (langClass) {
                language = langClass.replace('language-', '');
            } else {
                // Fallback: Check if hljs added a language class directly (without prefix)
                // This might happen depending on highlightElement behavior or if no language was specified in markdown
                const potentialLangClass = Array.from(codeElement.classList).find(cls => hljs.getLanguage(cls));
                if (potentialLangClass) {
                    language = potentialLangClass;
                }
                // If no language class found at all, add 'language-plaintext' for consistency
                else if (!codeElement.className.includes('language-')) {
                    codeElement.classList.add('language-plaintext');
                }
            }

            // 3. Create Header Div
            const header = document.createElement('div');
            header.classList.add('code-block-header');

            const langSpan = document.createElement('span');
            langSpan.classList.add('language');
            langSpan.textContent = language; // Use textContent for security against potential XSS in language name

            const iconSpan = document.createElement('span');
            iconSpan.classList.add('collapse-icon');
            iconSpan.title = 'Toggle Collapse';

            header.appendChild(langSpan);
            header.appendChild(iconSpan);

            // Insert the header inside the wrapper, before the <pre> element
            wrapper.insertBefore(header, preElement);

            // 4. Add Copy Button
            const copyButton = document.createElement('button');
            copyButton.classList.add('btn', 'btn-secondary', 'btn-sm', 'copy-code-button');
            copyButton.textContent = 'Copy';
            copyButton.title = 'Copy code to clipboard';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');
            // Append button directly to the wrapper (CSS will position it absolutely)
            wrapper.appendChild(copyButton);

            // --- Event Listeners for the new elements ---

            // Copy Button Click Event
            copyButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent the click from bubbling up to the header (which toggles collapse)
                // Use innerText to get the visually rendered text content, respecting line breaks correctly
                const codeToCopy = codeElement.innerText;
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    // Visual feedback for successful copy
                    copyButton.textContent = 'Copied!';
                    copyButton.classList.add('copied', 'btn-success'); // Use Bootstrap success class
                    copyButton.classList.remove('btn-secondary');

                    // Reset the button text and style after a short delay
                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                        copyButton.classList.remove('copied', 'btn-success');
                        copyButton.classList.add('btn-secondary');
                    }, 2000); // Revert after 2 seconds
                }).catch(err => {
                    // Handle potential errors during copy (e.g., browser permission issues)
                    console.error('Failed to copy code: ', err);
                    copyButton.textContent = 'Error';
                    // Reset button text after delay even on error
                    setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
                });
            });

            // Collapse/Expand Click Event on Header
            header.addEventListener('click', () => {
                // Toggle the 'collapsed' class on the wrapper element
                wrapper.classList.toggle('collapsed');
            });

            // Optional: Add logic to default to collapsed state for very long code blocks
            // const lineCount = codeElement.innerText.split('\n').length;
            // if (lineCount > 15) { // Example threshold: collapse if more than 15 lines
            //     wrapper.classList.add('collapsed');
            // }
        });
    }


    // --- Toggle Input Area Visibility ---
    function toggleInputArea() {
        const isInputVisible = toggleInputSwitch.checked;
        if (isInputVisible) {
            // Show input column
            inputColumn.classList.remove('hidden');
            // Restore Bootstrap grid classes for split view
            outputColumn.classList.remove('full-width', 'col-lg-12');
            outputColumn.classList.add('col-lg-6');
            inputColumn.classList.add('col-lg-6');

        } else {
            // Hide input column
            inputColumn.classList.add('hidden');
            // Make output column take full width
            inputColumn.classList.remove('col-lg-6'); // Remove size class from hidden input
            outputColumn.classList.remove('col-lg-6');
            outputColumn.classList.add('full-width', 'col-lg-12');
        }
        // Note: Toggling visibility might affect layout, but usually doesn't require
        // a full re-render unless content size changes dramatically based on layout.
    }

    // --- Event Listeners Setup ---
    // Create a debounced version of renderMarkdown to avoid excessive processing during typing
    const debouncedRender = debounce(renderMarkdown, 300); // 300ms delay

    // Call the debounced render function whenever the input textarea content changes
    markdownInput.addEventListener('input', debouncedRender);

    // Call toggleInputArea whenever the switch state changes
    toggleInputSwitch.addEventListener('change', toggleInputArea);

    // --- Initial Setup on Load ---
    renderMarkdown(); // Render any initial content present in the textarea (like the placeholder)
    toggleInputArea(); // Set the initial layout based on the switch's default state (checked)

});