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
                    return hljs.highlight(code, { language, ignoreIllegals: true }).value;
                } catch (error) {
                    console.error(`Highlighting error for language ${lang}:`, error);
                    return hljs.highlightAuto(code).value; // Fallback to auto-detection
                }
            }
        });

        // Parse Markdown
        const html = marked.parse(markdownText);
        markdownOutput.innerHTML = html;

        // Enhance code blocks after rendering
        enhanceCodeBlocks();
    }

    // --- Enhance Code Blocks (Add Copy Button, Collapse) ---
    function enhanceCodeBlocks() {
        const codeBlocks = markdownOutput.querySelectorAll('pre');

        codeBlocks.forEach((preElement, index) => {
            // Prevent double-enhancing
            if (preElement.parentElement.classList.contains('code-block-wrapper')) {
                return;
            }

            const codeElement = preElement.querySelector('code');
            if (!codeElement) return;

            // 1. Create Wrapper
            const wrapper = document.createElement('div');
            wrapper.classList.add('code-block-wrapper');
            preElement.parentNode.insertBefore(wrapper, preElement);
            wrapper.appendChild(preElement); // Move pre inside wrapper

            // 2. Extract Language
            let language = 'plaintext';
            const langClass = Array.from(codeElement.classList).find(cls => cls.startsWith('language-'));
            if (langClass) {
                language = langClass.replace('language-', '');
            }

            // 3. Create Header
            const header = document.createElement('div');
            header.classList.add('code-block-header');
            header.innerHTML = `
                <span class="language">${language}</span>
                <span class="collapse-icon" title="Toggle Collapse"></span>
            `;
            wrapper.insertBefore(header, preElement); // Insert header before pre

            // 4. Add Copy Button
            const copyButton = document.createElement('button');
            copyButton.classList.add('btn', 'btn-secondary', 'btn-sm', 'copy-code-button');
            copyButton.textContent = 'Copy';
            copyButton.title = 'Copy code to clipboard';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');
            // Insert button inside wrapper, but visually positioned via CSS
            wrapper.appendChild(copyButton);

            // --- Event Listeners ---

            // Copy Button Click
            copyButton.addEventListener('click', () => {
                const codeToCopy = codeElement.innerText; // Get raw text
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    copyButton.textContent = 'Copied!';
                    copyButton.classList.add('copied', 'btn-success'); // Use btn-success for feedback
                    copyButton.classList.remove('btn-secondary');

                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                        copyButton.classList.remove('copied', 'btn-success');
                        copyButton.classList.add('btn-secondary');
                    }, 2000); // Revert after 2 seconds
                }).catch(err => {
                    console.error('Failed to copy code: ', err);
                    copyButton.textContent = 'Error';
                    setTimeout(() => {
                        copyButton.textContent = 'Copy';
                    }, 2000);
                });
            });

            // Collapse/Expand Click
            header.addEventListener('click', () => {
                wrapper.classList.toggle('collapsed');
            });

            // Optional: Default state (e.g., start collapsed if code is long)
            // if (codeElement.innerText.split('\n').length > 15) {
            //     wrapper.classList.add('collapsed');
            // }
        });
    }

    // --- Toggle Input Area ---
    function toggleInputArea() {
        const isInputVisible = toggleInputSwitch.checked;
        if (isInputVisible) {
            inputColumn.classList.remove('hidden');
            outputColumn.classList.remove('full-width', 'col-lg-12');
            outputColumn.classList.add('col-lg-6');
        } else {
            inputColumn.classList.add('hidden');
            outputColumn.classList.remove('col-lg-6');
            outputColumn.classList.add('full-width', 'col-lg-12');
        }
        // Adjust Bootstrap's grid column - this targets the specific class
    }

    // --- Event Listeners ---
    const debouncedRender = debounce(renderMarkdown, 300); // 300ms delay
    markdownInput.addEventListener('input', debouncedRender);
    toggleInputSwitch.addEventListener('change', toggleInputArea);

    // --- Initial Render ---
    renderMarkdown(); // Render initial content (placeholder or saved text)
    // Apply initial toggle state correctly
    toggleInputArea();

    // Initialize highlight.js (though marked integration often handles it)
    // hljs.highlightAll(); // Generally not needed if using marked's highlight option
});