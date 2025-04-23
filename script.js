document.addEventListener('DOMContentLoaded', () => {
    // --- Selectors ---
    const markdownInput = document.getElementById('markdown-input');
    const markdownOutput = document.getElementById('markdown-output');
    const toggleInputSwitch = document.getElementById('toggleInputSwitch');
    const inputColumn = document.getElementById('input-column');
    const outputColumn = document.getElementById('output-column');
    const themeSwitch = document.getElementById('themeSwitch');
    const themeSwitchLabel = document.querySelector('label[for="themeSwitch"]');
    const autoRenderSwitch = document.getElementById('autoRenderSwitch');
    const manualRenderButton = document.getElementById('manualRenderButton');
    const hljsThemeLightLink = document.getElementById('hljs-theme-light');
    const hljsThemeDarkLink = document.getElementById('hljs-theme-dark');
    const rootElement = document.documentElement; // Get the <html> element

    // --- State Variables ---
    let isAutoRenderEnabled = true; // Default state

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
        });

        // Parse Markdown
        try {
            const html = marked.parse(markdownText);
            markdownOutput.innerHTML = html; // Add the generated HTML to the output area

            // Apply Syntax Highlighting AFTER content is in DOM
            markdownOutput.querySelectorAll('pre code').forEach((block) => {
                if (!block.classList.contains('hljs')) {
                    try {
                        hljs.highlightElement(block);
                    } catch (error) {
                        console.error("Highlight.js error on block:", error, block);
                        block.classList.add('hljs-error');
                    }
                }
            });

            // Enhance Code Blocks (Add Copy Button, Collapse, etc.)
            enhanceCodeBlocks();

        } catch (error) {
            console.error("Markdown parsing error:", error);
            markdownOutput.innerHTML = `<div class="alert alert-danger">Error parsing Markdown. Please check your input.</div>`;
        }
    }

    // --- Enhance Code Blocks (Add Copy Button, Collapse) ---
    // (Keep the existing enhanceCodeBlocks function as it is)
    function enhanceCodeBlocks() {
        const processedPres = new Set();
        markdownOutput.querySelectorAll('pre').forEach((preElement) => {
            if (processedPres.has(preElement) || preElement.parentElement.classList.contains('code-block-wrapper')) {
                processedPres.add(preElement);
                return;
            }
            const codeElement = preElement.querySelector('code');
            if (!codeElement) return;

            const wrapper = document.createElement('div');
            wrapper.classList.add('code-block-wrapper');
            preElement.parentNode.insertBefore(wrapper, preElement);
            wrapper.appendChild(preElement);
            processedPres.add(preElement);

            let language = 'plaintext';
            const langClass = Array.from(codeElement.classList).find(cls => cls.startsWith('language-'));
            if (langClass) {
                language = langClass.replace('language-', '');
            } else {
                const potentialLangClass = Array.from(codeElement.classList).find(cls => hljs.getLanguage(cls));
                if (potentialLangClass) language = potentialLangClass;
                else if (!codeElement.className.includes('language-')) codeElement.classList.add('language-plaintext');
            }

            const header = document.createElement('div');
            header.classList.add('code-block-header');
            const langSpan = document.createElement('span');
            langSpan.classList.add('language');
            langSpan.textContent = language;
            const iconSpan = document.createElement('span');
            iconSpan.classList.add('collapse-icon');
            iconSpan.title = 'Toggle Collapse';
            header.appendChild(langSpan);
            header.appendChild(iconSpan);
            wrapper.insertBefore(header, preElement);

            const copyButton = document.createElement('button');
            copyButton.classList.add('btn', 'btn-secondary', 'btn-sm', 'copy-code-button');
            copyButton.innerHTML = '<i class="bi bi-clipboard"></i>'; // Use icon
            copyButton.title = 'Copy code to clipboard';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');
            wrapper.appendChild(copyButton);

            copyButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const codeToCopy = codeElement.innerText;
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    copyButton.innerHTML = '<i class="bi bi-check-lg"></i>'; // Check icon
                    copyButton.classList.add('copied', 'btn-success');
                    copyButton.classList.remove('btn-secondary');
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="bi bi-clipboard"></i>'; // Restore icon
                        copyButton.classList.remove('copied', 'btn-success');
                        copyButton.classList.add('btn-secondary');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy code: ', err);
                    copyButton.textContent = 'Error';
                    setTimeout(() => { copyButton.innerHTML = '<i class="bi bi-clipboard"></i>'; }, 2000);
                });
            });

            header.addEventListener('click', () => {
                wrapper.classList.toggle('collapsed');
            });
        });
    }


    // --- Toggle Input Area Visibility ---
    function toggleInputArea() {
        const isInputVisible = toggleInputSwitch.checked;
        if (isInputVisible) {
            inputColumn.classList.remove('hidden');
            outputColumn.classList.remove('full-width', 'col-lg-12');
            outputColumn.classList.add('col-lg-6');
            inputColumn.classList.add('col-lg-6');
        } else {
            inputColumn.classList.add('hidden');
            inputColumn.classList.remove('col-lg-6');
            outputColumn.classList.remove('col-lg-6');
            outputColumn.classList.add('full-width', 'col-lg-12');
        }
    }

    // --- Theme Switching ---
    function applyTheme(theme) { // theme = 'light' or 'dark'
        rootElement.setAttribute('data-bs-theme', theme);
        if (theme === 'dark') {
            themeSwitchLabel.innerHTML = '<i class="bi bi-sun-fill"></i>'; // Sun icon for dark mode
            hljsThemeDarkLink.removeAttribute('disabled');
            hljsThemeLightLink.setAttribute('disabled', 'true');
        } else {
            themeSwitchLabel.innerHTML = '<i class="bi bi-moon-stars-fill"></i>'; // Moon icon for light mode
            hljsThemeLightLink.removeAttribute('disabled');
            hljsThemeDarkLink.setAttribute('disabled', 'true');
        }
        localStorage.setItem('markdownRendererTheme', theme); // Save preference

        // Re-render to apply potential theme-specific code block styles if necessary
        // (Though highlight.js themes handle most of it)
        renderMarkdown();
    }

    function toggleTheme() {
        const currentTheme = rootElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    }

    // --- Auto Render Control ---
    function updateAutoRenderState() {
        isAutoRenderEnabled = autoRenderSwitch.checked;
        manualRenderButton.disabled = isAutoRenderEnabled; // Disable button if auto is on
        localStorage.setItem('markdownRendererAutoRender', isAutoRenderEnabled); // Save preference
    }

    // --- Event Listeners Setup ---
    const debouncedRender = debounce(renderMarkdown, 300); // Debounced render

    // Markdown Input Event
    markdownInput.addEventListener('input', () => {
        if (isAutoRenderEnabled) {
            debouncedRender();
        }
    });

    // Toggle Input Area Switch
    toggleInputSwitch.addEventListener('change', toggleInputArea);

    // Theme Switch
    themeSwitch.addEventListener('change', toggleTheme);

    // Auto Render Switch
    autoRenderSwitch.addEventListener('change', updateAutoRenderState);

    // Manual Render Button
    manualRenderButton.addEventListener('click', renderMarkdown); // Call directly, no debounce

    // --- Initial Setup on Load ---

    // Set initial theme based on localStorage or system preference (optional)
    const savedTheme = localStorage.getItem('markdownRendererTheme');
    // const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; // Optional: Detect system preference
    const initialTheme = savedTheme || 'dark'; // Default to dark if no preference saved
    applyTheme(initialTheme);
    themeSwitch.checked = (initialTheme === 'dark'); // Set switch state

    // Set initial auto-render state
    const savedAutoRender = localStorage.getItem('markdownRendererAutoRender');
    isAutoRenderEnabled = savedAutoRender !== null ? (savedAutoRender === 'true') : true; // Default true
    autoRenderSwitch.checked = isAutoRenderEnabled;
    updateAutoRenderState(); // Update button state based on loaded preference

    // Initial Render
    renderMarkdown();

    // Initial Layout
    toggleInputArea();

});
