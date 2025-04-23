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
        // Configure marked
        marked.setOptions({
            breaks: true, // Convert single line breaks to <br>
            gfm: true,    // Enable GitHub Flavored Markdown
            highlight: function (code, lang) {
                // Use highlight.js for syntax highlighting
                // Check if the language is supported, otherwise use auto-detection
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                try {
                    // Highlight with the specified or detected language
                    return hljs.highlight(code, { language, ignoreIllegals: true }).value;
                } catch (error) {
                    console.error(`Highlighting error for language ${lang}:`, error);
                    // Fallback to auto-detection on error
                    return hljs.highlightAuto(code).value;
                }
            }
        });

        // Parse Markdown
        try {
            const html = marked.parse(markdownText);
            markdownOutput.innerHTML = html;
        } catch (error) {
            console.error("Markdown parsing error:", error);
            markdownOutput.innerHTML = `<div class="alert alert-danger">Error parsing Markdown. Please check your input.</div>`;
        }


        // Enhance code blocks after rendering
        enhanceCodeBlocks();
    }

    // --- Enhance Code Blocks (Add Copy Button, Collapse) ---
    function enhanceCodeBlocks() {
        const codeBlocks = markdownOutput.querySelectorAll('pre');

        codeBlocks.forEach((preElement) => {
            // Prevent double-enhancing if script reruns or elements persist
            if (preElement.parentElement.classList.contains('code-block-wrapper')) {
                return;
            }

            const codeElement = preElement.querySelector('code');
            // If no <code> tag found inside <pre>, skip
            if (!codeElement) return;

            // 1. Create Wrapper Div
            const wrapper = document.createElement('div');
            wrapper.classList.add('code-block-wrapper');
            // Insert wrapper before the <pre> element and move <pre> inside it
            preElement.parentNode.insertBefore(wrapper, preElement);
            wrapper.appendChild(preElement);

            // 2. Extract Language
            let language = 'plaintext'; // Default language
            // Find a class starting with "language-" on the <code> element
            const langClass = Array.from(codeElement.classList).find(cls => cls.startsWith('language-'));
            if (langClass) {
                language = langClass.replace('language-', '');
            } else if (codeElement.className) {
                // Sometimes highlight.js adds just the language name as a class if no language- prefix
                // Check if the class name is a valid language
                if (hljs.getLanguage(codeElement.className)) {
                    language = codeElement.className;
                }
            }


            // 3. Create Header
            const header = document.createElement('div');
            header.classList.add('code-block-header');
            // Use textContent for security against XSS in language name if it were dynamic
            const langSpan = document.createElement('span');
            langSpan.classList.add('language');
            langSpan.textContent = language;
            const iconSpan = document.createElement('span');
            iconSpan.classList.add('collapse-icon');
            iconSpan.title = 'Toggle Collapse';

            header.appendChild(langSpan);
            header.appendChild(iconSpan);

            wrapper.insertBefore(header, preElement); // Insert header before <pre>

            // 4. Add Copy Button
            const copyButton = document.createElement('button');
            copyButton.classList.add('btn', 'btn-secondary', 'btn-sm', 'copy-code-button');
            copyButton.textContent = 'Copy';
            copyButton.title = 'Copy code to clipboard';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');
            // Append button to wrapper (positioned absolutely via CSS)
            wrapper.appendChild(copyButton);

            // --- Event Listeners ---

            // Copy Button Click
            copyButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent header click event when clicking button
                const codeToCopy = codeElement.innerText; // Get raw text content
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    // Success feedback
                    copyButton.textContent = 'Copied!';
                    copyButton.classList.add('copied', 'btn-success');
                    copyButton.classList.remove('btn-secondary');

                    // Revert button state after 2 seconds
                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                        copyButton.classList.remove('copied', 'btn-success');
                        copyButton.classList.add('btn-secondary');
                    }, 2000);
                }).catch(err => {
                    // Error feedback
                    console.error('Failed to copy code: ', err);
                    copyButton.textContent = 'Error';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 2000);
                });
            });

            // Collapse/Expand Click on Header
            header.addEventListener('click', () => {
                wrapper.classList.toggle('collapsed');
            });

            // Optional: Default collapsed state for long code blocks
            // const lineCount = codeElement.innerText.split('\n').length;
            // if (lineCount > 15) { // Example threshold: 15 lines
            //     wrapper.classList.add('collapsed');
            // }
        });
    }

    // --- Toggle Input Area Visibility ---
    function toggleInputArea() {
        const isInputVisible = toggleInputSwitch.checked;
        if (isInputVisible) {
            inputColumn.classList.remove('hidden');
            // Restore Bootstrap columns for split view
            outputColumn.classList.remove('full-width', 'col-lg-12');
            outputColumn.classList.add('col-lg-6');
            inputColumn.classList.add('col-lg-6'); // Ensure input also gets size class back if needed

        } else {
            inputColumn.classList.add('hidden');
            // Make output column take full width
            inputColumn.classList.remove('col-lg-6'); // Remove size class from input
            outputColumn.classList.remove('col-lg-6');
            outputColumn.classList.add('full-width', 'col-lg-12');
        }
    }

    // --- Event Listeners Setup ---
    const debouncedRender = debounce(renderMarkdown, 300); // 300ms debounce delay
    markdownInput.addEventListener('input', debouncedRender);
    toggleInputSwitch.addEventListener('change', toggleInputArea);

    // --- Initial Setup on Load ---
    renderMarkdown(); // Render any initial content in the textarea (e.g., placeholder)
    toggleInputArea(); // Set the initial layout based on the switch's default state

});
