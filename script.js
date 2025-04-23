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
    // Direction Selectors
    const textDirLtrBtn = document.getElementById('textDirLtrBtn');
    const textDirRtlBtn = document.getElementById('textDirRtlBtn');
    const codeDirLtrBtn = document.getElementById('codeDirLtrBtn');
    const codeDirRtlBtn = document.getElementById('codeDirRtlBtn');
    const markdownToolbar = document.getElementById('markdown-toolbar');
    // Count Display Selectors (New)
    const charCountSpan = document.getElementById('char-count');
    const wordCountSpan = document.getElementById('word-count');


    // --- State Variables ---
    let isAutoRenderEnabled = true; // Default state
    let currentTextDirection = 'ltr'; // Default
    let currentCodeDirection = 'ltr'; // Default

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

    // --- Update Character/Word Counts --- (New Function)
    function updateCounts() {
        const text = markdownInput.value;
        const charCount = text.length;
        // Simple word count: split by whitespace, filter empty strings
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        // Handle case where input is only whitespace (trim results in empty string)
        const wordCount = text.trim() === '' ? 0 : words.length;

        if (charCountSpan) { // Check if element exists
            charCountSpan.textContent = `Chars: ${charCount}`;
        }
        if (wordCountSpan) { // Check if element exists
            wordCountSpan.textContent = `Words: ${wordCount}`;
        }
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

            // Ensure code blocks have the correct direction attribute after rendering
            applyCodeDirectionToBlocks(currentCodeDirection);


        } catch (error) {
            console.error("Markdown parsing error:", error);
            markdownOutput.innerHTML = `<div class="alert alert-danger">Error parsing Markdown. Please check your input.</div>`;
        }
    }

    // --- Enhance Code Blocks (Add Copy Button, Collapse) ---
    function enhanceCodeBlocks() {
        const processedPres = new Set();
        markdownOutput.querySelectorAll('pre').forEach((preElement) => {
            // Keep the initial checks the same...
            if (processedPres.has(preElement) || preElement.parentElement.classList.contains('code-block-wrapper')) {
                processedPres.add(preElement);
                return;
            }
            const codeElement = preElement.querySelector('code');
            if (!codeElement) return;

            const wrapper = document.createElement('div');
            wrapper.classList.add('code-block-wrapper');
            // Apply current code direction when creating the wrapper
            wrapper.dataset.codeDirection = currentCodeDirection;
            preElement.parentNode.insertBefore(wrapper, preElement);
            wrapper.appendChild(preElement);
            processedPres.add(preElement);

            // Determine language (keep this logic the same)
            let language = 'plaintext';
            const langClass = Array.from(codeElement.classList).find(cls => cls.startsWith('language-'));
            if (langClass) {
                language = langClass.replace('language-', '');
            } else {
                const potentialLangClass = Array.from(codeElement.classList).find(cls => hljs.getLanguage(cls));
                if (potentialLangClass) language = potentialLangClass;
                else if (!codeElement.className.includes('language-')) codeElement.classList.add('language-plaintext');
            }

            // --- Create Header ---
            const header = document.createElement('div');
            header.classList.add('code-block-header');

            // Language Span (left in LTR, right in RTL due to flex reverse)
            const langSpan = document.createElement('span');
            langSpan.classList.add('language');
            langSpan.textContent = language;

            // --- Create Copy Button ---
            const copyButton = document.createElement('button');
            copyButton.classList.add('btn', 'btn-secondary', 'btn-sm', 'copy-code-button');
            copyButton.innerHTML = '<i class="bi bi-clipboard"></i>'; // Use icon
            copyButton.title = 'Copy code to clipboard';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');

            // Collapse Icon (rightmost in LTR, leftmost in RTL)
            const iconSpan = document.createElement('span');
            iconSpan.classList.add('collapse-icon');
            iconSpan.title = 'Toggle Collapse';

            // --- Append elements to header ---
            header.appendChild(langSpan);
            header.appendChild(copyButton);
            header.appendChild(iconSpan);

            // Insert header before the <pre> element
            wrapper.insertBefore(header, preElement);

            // --- Add Event Listeners (Keep these the same) ---
            copyButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent header click/collapse when clicking button
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
                    copyButton.innerHTML = '<i class="bi bi-x-octagon-fill text-danger"></i>';
                    setTimeout(() => { copyButton.innerHTML = '<i class="bi bi-clipboard"></i>'; }, 2000);
                });
            });

            header.addEventListener('click', (event) => { // Added event parameter
                // Ensure clicking the copy button itself doesn't trigger collapse
                if (!copyButton.contains(event.target) && !copyButton === event.target) {
                    wrapper.classList.toggle('collapsed');
                }
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
        renderMarkdown(); // Re-render might be needed if themes affect layout/highlighting
    }

    function toggleTheme() {
        const currentTheme = rootElement.getAttribute('data-bs-theme') || 'light'; // Ensure default
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    }

    // --- Auto Render Control ---
    function updateAutoRenderState() {
        isAutoRenderEnabled = autoRenderSwitch.checked;
        manualRenderButton.disabled = isAutoRenderEnabled; // Disable button if auto is on
        localStorage.setItem('markdownRendererAutoRender', isAutoRenderEnabled); // Save preference
    }

    // --- Text Direction Control ---
    function setTextDirection(direction) { // 'ltr' or 'rtl'
        currentTextDirection = direction;
        markdownOutput.dataset.textDirection = direction; // Apply data attribute for CSS
        localStorage.setItem('markdownRendererTextDir', direction); // Save preference

        // Update button active state
        textDirLtrBtn.classList.toggle('active', direction === 'ltr');
        textDirRtlBtn.classList.toggle('active', direction === 'rtl');
        // Optionally, re-render if direction affects layout significantly, but CSS should handle it.
        // renderMarkdown();
    }

    // --- Code Block Direction Control ---
    function applyCodeDirectionToBlocks(direction) {
        markdownOutput.querySelectorAll('.code-block-wrapper').forEach(wrapper => {
            wrapper.dataset.codeDirection = direction; // Apply data attribute for CSS
        });
    }

    function setCodeDirection(direction) { // 'ltr' or 'rtl'
        currentCodeDirection = direction;
        applyCodeDirectionToBlocks(direction); // Apply to all existing code blocks
        localStorage.setItem('markdownRendererCodeDir', direction); // Save preference

        // Update button active state
        codeDirLtrBtn.classList.toggle('active', direction === 'ltr');
        codeDirRtlBtn.classList.toggle('active', direction === 'rtl');
    }

    // --- Markdown Toolbar Functionality ---
    function applyMarkdownSyntax(syntaxType) {
        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        const selectedText = markdownInput.value.substring(start, end);
        const textBefore = markdownInput.value.substring(0, start);
        const textAfter = markdownInput.value.substring(end);
        let newText = '';
        let cursorPos = start; // Default cursor position after insertion

        const wrapSelection = (beforeSyntax, afterSyntax, placeholder = '') => {
            if (selectedText) {
                newText = `${textBefore}${beforeSyntax}${selectedText}${afterSyntax}${textAfter}`;
                cursorPos = start + beforeSyntax.length + selectedText.length + afterSyntax.length;
            } else {
                newText = `${textBefore}${beforeSyntax}${placeholder}${afterSyntax}${textAfter}`;
                cursorPos = start + beforeSyntax.length + placeholder.length; // Position cursor after placeholder
            }
            markdownInput.value = newText;
            markdownInput.setSelectionRange(cursorPos, cursorPos);
        };

        const insertAtLineStart = (prefix, placeholder = '') => {
            const lineStart = textBefore.lastIndexOf('\n') + 1;
            const textBeforeLine = markdownInput.value.substring(0, lineStart);
            const textAfterLineStart = markdownInput.value.substring(lineStart);

            // If selection spans multiple lines, prefix each line
            if (selectedText && selectedText.includes('\n')) {
                const lines = selectedText.split('\n');
                const prefixedLines = lines.map(line => `${prefix}${line}`).join('\n');
                newText = `${textBefore}${prefixedLines}${textAfter}`;
                cursorPos = end + (lines.length * prefix.length); // Approx end position
                markdownInput.value = newText;
                markdownInput.setSelectionRange(start + prefix.length, cursorPos); // Select the modified block

            } else if (selectedText) { // Single line selection
                newText = `${textBeforeLine}${prefix}${selectedText}${textAfterLineStart}`;
                cursorPos = start + prefix.length;
                markdownInput.value = newText;
                markdownInput.setSelectionRange(cursorPos, end + prefix.length); // Keep selection if any
            }
            else { // No selection, insert at current line start
                newText = `${textBeforeLine}${prefix}${placeholder}${textAfterLineStart}`;
                cursorPos = lineStart + prefix.length + placeholder.length;
                markdownInput.value = newText;
                markdownInput.setSelectionRange(cursorPos, cursorPos);
            }
        };

        switch (syntaxType) {
            case 'bold':
                wrapSelection('**', '**', 'bold text');
                break;
            case 'italic':
                wrapSelection('*', '*', 'italic text');
                break;
            case 'strikethrough':
                wrapSelection('~~', '~~', 'strikethrough');
                break;
            case 'inline-code':
                wrapSelection('`', '`', 'code');
                break;
            case 'link':
                const url = prompt("Enter link URL:", "https://");
                if (url) {
                    wrapSelection('[', `](${url})`, selectedText || 'link text');
                } else { // If user cancels, don't change selection/text
                    return;
                }
                break;
            case 'image':
                const altText = prompt("Enter image description (alt text):", "");
                // Check if altText prompt was cancelled (returns null)
                if (altText === null) return;
                const imgUrl = prompt("Enter image URL:", "https://");
                // Check if imgUrl prompt was cancelled or empty
                if (!imgUrl) return;
                // Images are typically on their own line, insert logic is simpler
                newText = `${textBefore}![${altText || ''}](${imgUrl})${textAfter}`;
                cursorPos = start + `![${altText || ''}](${imgUrl})`.length;
                markdownInput.value = newText;
                markdownInput.setSelectionRange(cursorPos, cursorPos);
                break;
            case 'h1':
                insertAtLineStart('# ', 'Heading 1');
                break;
            case 'h2':
                insertAtLineStart('## ', 'Heading 2');
                break;
            case 'h3':
                insertAtLineStart('### ', 'Heading 3');
                break;
            case 'ul-list':
                insertAtLineStart('- ', 'List item');
                break;
            case 'blockquote':
                insertAtLineStart('> ', 'Blockquote');
                break;
        }

        markdownInput.focus(); // Keep focus on the textarea
        updateCounts(); // <<< UPDATE COUNTS AFTER APPLYING SYNTAX
        // Trigger input event for auto-rendering if needed
        if (isAutoRenderEnabled) {
            // Create and dispatch the event *after* updating the value and counts
            markdownInput.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            // If auto-render is off, we might still want to manually trigger a render
            // if the user expects the preview to update after a toolbar action,
            // or rely on them clicking the manual render button. For now, let's
            // keep it simple and only dispatch the input event if auto-render is on.
        }
    }


    // --- Event Listeners Setup ---
    const debouncedRender = debounce(renderMarkdown, 300); // Debounced render

    // Markdown Input Event
    markdownInput.addEventListener('input', () => {
        updateCounts(); // Update counts immediately on any input
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

    // Direction Button Events
    textDirLtrBtn.addEventListener('click', () => setTextDirection('ltr'));
    textDirRtlBtn.addEventListener('click', () => setTextDirection('rtl'));
    codeDirLtrBtn.addEventListener('click', () => setCodeDirection('ltr'));
    codeDirRtlBtn.addEventListener('click', () => setCodeDirection('rtl'));

    // Markdown Toolbar Event Listener (using event delegation)
    markdownToolbar.addEventListener('click', (event) => {
        const button = event.target.closest('button'); // Find the clicked button
        if (button && button.dataset.syntax) {
            event.preventDefault(); // Prevent potential default button actions
            applyMarkdownSyntax(button.dataset.syntax);
        }
    });

    // --- Initial Setup on Load ---

    // Set initial theme
    const savedTheme = localStorage.getItem('markdownRendererTheme');
    const initialTheme = savedTheme || 'dark'; // Default dark
    applyTheme(initialTheme);
    themeSwitch.checked = (initialTheme === 'dark');

    // Set initial auto-render state
    const savedAutoRender = localStorage.getItem('markdownRendererAutoRender');
    isAutoRenderEnabled = savedAutoRender !== null ? (savedAutoRender === 'true') : true; // Default true
    autoRenderSwitch.checked = isAutoRenderEnabled;
    updateAutoRenderState(); // Update button state

    // Set initial text direction
    const savedTextDir = localStorage.getItem('markdownRendererTextDir');
    setTextDirection(savedTextDir || 'ltr'); // Default LTR

    // Set initial code direction
    const savedCodeDir = localStorage.getItem('markdownRendererCodeDir');
    setCodeDirection(savedCodeDir || 'ltr'); // Default LTR

    // Initial Render (will also apply initial code direction via enhanceCodeBlocks)
    renderMarkdown();

    // Initial Count Update (New)
    updateCounts(); // Call updateCounts initially after potential initial render

    // Initial Layout
    toggleInputArea();

});