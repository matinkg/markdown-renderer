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
            // Stop if this <pre> is already inside a wrapper (prevent reprocessing)
            if (processedPres.has(preElement) || preElement.parentElement.classList.contains('code-block-wrapper')) {
                processedPres.add(preElement); // Still mark as processed even if skipped
                return;
            }
            const codeElement = preElement.querySelector('code');
            if (!codeElement) return; // Skip if no <code> inside <pre>

            // --- Create Wrapper ---
            const wrapper = document.createElement('div');
            wrapper.classList.add('code-block-wrapper');
            // Apply current code direction when creating the wrapper
            wrapper.dataset.codeDirection = currentCodeDirection;

            // Replace <pre> with wrapper, then append <pre> to wrapper
            preElement.parentNode.insertBefore(wrapper, preElement);
            wrapper.appendChild(preElement);
            processedPres.add(preElement); // Mark this <pre> as processed

            // --- Determine Language ---
            let language = 'plaintext';
            // Prioritize 'language-xyz' class
            const langClass = Array.from(codeElement.classList).find(cls => cls.startsWith('language-'));
            if (langClass) {
                language = langClass.replace('language-', '');
            } else {
                // Fallback: check if any class is a valid hljs language alias
                const potentialLangClass = Array.from(codeElement.classList).find(cls => hljs.getLanguage(cls));
                if (potentialLangClass) {
                    language = potentialLangClass;
                    // Add the official 'language-' class for consistency if missing
                    if (!codeElement.classList.contains(`language-${language}`)) {
                        codeElement.classList.add(`language-${language}`);
                    }
                } else if (!codeElement.className.includes('language-')) {
                    // If no language detected, add 'language-plaintext'
                    codeElement.classList.add('language-plaintext');
                }
            }
            // Ensure 'hljs' class is present for styling, even if highlighting fails
            if (!codeElement.classList.contains('hljs')) {
                codeElement.classList.add('hljs');
            }


            // --- Create Header ---
            const header = document.createElement('div');
            header.classList.add('code-block-header');

            // Language Span
            const langSpan = document.createElement('span');
            langSpan.classList.add('language');
            langSpan.textContent = language;

            // --- Create Copy Button ---
            const copyButton = document.createElement('button');
            copyButton.classList.add('btn', 'btn-secondary', 'btn-sm', 'copy-code-button');
            copyButton.innerHTML = '<i class="bi bi-clipboard"></i>'; // Bootstrap clipboard icon
            copyButton.title = 'Copy code to clipboard';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');

            // Collapse Icon Span (for styling the +/-)
            const iconSpan = document.createElement('span');
            iconSpan.classList.add('collapse-icon');
            iconSpan.title = 'Toggle Collapse';

            // --- Append elements to header ---
            // Order depends on desired layout (e.g., LTR/RTL handling in CSS)
            header.appendChild(langSpan);   // Language on the left (in LTR)
            header.appendChild(copyButton); // Copy button next
            header.appendChild(iconSpan);   // Collapse icon on the right (in LTR)

            // Insert header *before* the <pre> element inside the wrapper
            wrapper.insertBefore(header, preElement);

            // --- NO LONGER COLLAPSED BY DEFAULT ---

            // --- Add Event Listeners ---

            // Copy Button Click
            copyButton.addEventListener('click', (e) => {
                e.stopPropagation(); // IMPORTANT: Prevent header click event
                const codeToCopy = codeElement.innerText; // Get text content
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    // Success feedback
                    copyButton.innerHTML = '<i class="bi bi-check-lg"></i>'; // Check icon
                    copyButton.classList.add('copied', 'btn-success');
                    copyButton.classList.remove('btn-secondary');
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="bi bi-clipboard"></i>'; // Restore icon
                        copyButton.classList.remove('copied', 'btn-success');
                        copyButton.classList.add('btn-secondary');
                    }, 2000); // Revert after 2 seconds
                }).catch(err => {
                    // Error feedback
                    console.error('Failed to copy code: ', err);
                    // Optional: Provide visual feedback on error
                    copyButton.innerHTML = '<i class="bi bi-x-octagon-fill text-danger"></i>'; // Error icon
                    setTimeout(() => { copyButton.innerHTML = '<i class="bi bi-clipboard"></i>'; }, 2000);
                });
            });

            // Header Click for Collapse/Expand
            header.addEventListener('click', (event) => {
                // Ensure clicking the copy button itself doesn't trigger collapse
                // Check if the click target IS the copy button OR is INSIDE the copy button
                if (!copyButton.contains(event.target) && event.target !== copyButton) {
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
        // Re-trigger layout/render if needed, especially if scrollbars change
        // window.dispatchEvent(new Event('resize')); // Might be overkill
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
        // Optionally re-render if theme significantly changes layout or code block appearance needed immediate update
        // renderMarkdown(); // Consider if needed, might cause flicker
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
        // If switching TO auto-render, render immediately
        if (isAutoRenderEnabled) {
            renderMarkdown();
        }
    }

    // --- Text Direction Control ---
    function setTextDirection(direction) { // 'ltr' or 'rtl'
        currentTextDirection = direction;
        markdownOutput.dataset.textDirection = direction; // Apply data attribute for CSS
        localStorage.setItem('markdownRendererTextDir', direction); // Save preference

        // Update button active state
        textDirLtrBtn.classList.toggle('active', direction === 'ltr');
        textDirRtlBtn.classList.toggle('active', direction === 'rtl');
        // No re-render needed, CSS handles this
    }

    // --- Code Block Direction Control ---
    function applyCodeDirectionToBlocks(direction) {
        // Apply to all existing wrappers
        markdownOutput.querySelectorAll('.code-block-wrapper').forEach(wrapper => {
            wrapper.dataset.codeDirection = direction; // Apply data attribute for CSS
        });
    }

    function setCodeDirection(direction) { // 'ltr' or 'rtl'
        currentCodeDirection = direction;
        applyCodeDirectionToBlocks(direction); // Apply to all existing code blocks immediately
        localStorage.setItem('markdownRendererCodeDir', direction); // Save preference

        // Update button active state
        codeDirLtrBtn.classList.toggle('active', direction === 'ltr');
        codeDirRtlBtn.classList.toggle('active', direction === 'rtl');
        // No re-render needed, CSS handles this (state is stored for new blocks)
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
                // Position cursor after the closing syntax
                cursorPos = start + beforeSyntax.length + selectedText.length + afterSyntax.length;
            } else {
                newText = `${textBefore}${beforeSyntax}${placeholder}${afterSyntax}${textAfter}`;
                // Position cursor inside the syntax, selecting the placeholder
                cursorPos = start + beforeSyntax.length;
                markdownInput.value = newText; // Update value first
                markdownInput.setSelectionRange(cursorPos, cursorPos + placeholder.length); // Select placeholder
                return; // Exit early as selection is set
            }
            markdownInput.value = newText;
            markdownInput.setSelectionRange(cursorPos, cursorPos);
        };

        const insertAtLineStart = (prefix, placeholder = '') => {
            let currentLineStart = textBefore.lastIndexOf('\n') + 1;
            let indentedPrefix = prefix; // Handle existing list/quote indentation later if needed

            // If selection spans multiple lines, prefix each line
            if (selectedText && selectedText.includes('\n')) {
                const lines = selectedText.split('\n');
                // Determine the start of the first selected line
                const firstSelectedLineStart = textBefore.lastIndexOf('\n') + 1;
                const textBeforeSelectionStart = markdownInput.value.substring(0, firstSelectedLineStart);
                const textAfterSelectionEnd = textAfter;

                const prefixedLines = lines.map(line => `${indentedPrefix}${line}`).join('\n');
                newText = `${textBeforeSelectionStart}${prefixedLines}${textAfterSelectionEnd}`;

                cursorPos = end + (lines.length * indentedPrefix.length); // Approx end position
                markdownInput.value = newText;
                // Select the modified block
                markdownInput.setSelectionRange(firstSelectedLineStart + indentedPrefix.length, cursorPos);

            } else { // Single line selection or no selection
                const textBeforeLine = markdownInput.value.substring(0, currentLineStart);
                const currentLineContent = markdownInput.value.substring(currentLineStart).split('\n')[0]; // Get full current line

                if (selectedText) { // Single line selection exists
                    newText = `${textBeforeLine}${indentedPrefix}${selectedText}${textAfter}`;
                    cursorPos = start + indentedPrefix.length; // Start of selection + prefix
                    const selectionEndPos = end + indentedPrefix.length; // End of selection + prefix
                    markdownInput.value = newText;
                    markdownInput.setSelectionRange(cursorPos, selectionEndPos); // Keep selection
                } else { // No selection, insert prefix and placeholder at current line start
                    newText = `${textBeforeLine}${indentedPrefix}${placeholder}${markdownInput.value.substring(currentLineStart)}`;
                    cursorPos = currentLineStart + indentedPrefix.length;
                    markdownInput.value = newText;
                    markdownInput.setSelectionRange(cursorPos, cursorPos + placeholder.length); // Select placeholder
                }
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
                if (url !== null && url.trim() !== "") { // Proceed if URL is entered
                    wrapSelection('[', `](${url})`, selectedText || 'link text');
                } else { return; } // Don't change if prompt cancelled or empty
                break;
            case 'image':
                const altText = prompt("Enter image description (alt text):", "");
                // Check if altText prompt was cancelled (returns null)
                if (altText === null) return;
                const imgUrl = prompt("Enter image URL:", "https://");
                // Check if imgUrl prompt was cancelled or empty
                if (!imgUrl) return;
                // Images are typically block elements, insert on a new line if needed
                let prefix = (textBefore.length > 0 && textBefore.slice(-1) !== '\n') ? '\n' : '';
                let suffix = (textAfter.length > 0 && textAfter[0] !== '\n') ? '\n' : '';
                newText = `${textBefore}${prefix}![${altText || ''}](${imgUrl})${suffix}${textAfter}`;
                cursorPos = start + prefix.length + `![${altText || ''}](${imgUrl})`.length;
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
        updateCounts(); // Update counts immediately after applying syntax
        // Trigger input event for auto-rendering IF it's enabled
        if (isAutoRenderEnabled) {
            // Use setTimeout to ensure the event fires after the DOM updates from the syntax application
            setTimeout(() => {
                markdownInput.dispatchEvent(new Event('input', { bubbles: true }));
            }, 0);
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
        const button = event.target.closest('button[data-syntax]'); // Find the clicked button with data-syntax
        if (button) {
            event.preventDefault(); // Prevent potential default button actions
            applyMarkdownSyntax(button.dataset.syntax);
        }
    });

    // Add keyboard shortcuts for toolbar actions
    markdownInput.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey) { // Check for Ctrl (Windows/Linux) or Command (Mac)
            let handled = false;
            switch (event.key.toLowerCase()) {
                case 'b': // Bold
                    applyMarkdownSyntax('bold');
                    handled = true;
                    break;
                case 'i': // Italic
                    applyMarkdownSyntax('italic');
                    handled = true;
                    break;
                case 'k': // Link
                    applyMarkdownSyntax('link');
                    handled = true;
                    break;
                // Add more shortcuts as needed
            }
            if (handled) {
                event.preventDefault(); // Prevent default browser actions (like bookmarking for Ctrl+B)
            }
        }
    });

    // --- Initial Setup on Load ---

    // Set initial theme based on saved preference or system preference (if implementing)
    const savedTheme = localStorage.getItem('markdownRendererTheme');
    // Default to dark if no preference saved
    const initialTheme = savedTheme || 'dark';
    applyTheme(initialTheme);
    themeSwitch.checked = (initialTheme === 'dark'); // Sync switch state

    // Set initial auto-render state
    const savedAutoRender = localStorage.getItem('markdownRendererAutoRender');
    isAutoRenderEnabled = savedAutoRender !== null ? (savedAutoRender === 'true') : true; // Default true
    autoRenderSwitch.checked = isAutoRenderEnabled;
    updateAutoRenderState(); // Update button disabled state based on initial check

    // Set initial text direction
    const savedTextDir = localStorage.getItem('markdownRendererTextDir') || 'ltr'; // Default LTR
    setTextDirection(savedTextDir);

    // Set initial code direction
    const savedCodeDir = localStorage.getItem('markdownRendererCodeDir') || 'ltr'; // Default LTR
    setCodeDirection(savedCodeDir);

    // Restore previous input if desired (e.g., from localStorage)
    // const savedInput = localStorage.getItem('markdownInputContent');
    // if (savedInput) {
    //     markdownInput.value = savedInput;
    // }

    // Initial Layout based on switch state (usually checked/visible by default)
    toggleInputArea();

    // Initial Render (important to do this AFTER setting up theme, directions, etc.)
    renderMarkdown();

    // Initial Count Update
    updateCounts();

    // Optional: Save input content periodically or on unload
    // markdownInput.addEventListener('input', debounce(() => {
    //     localStorage.setItem('markdownInputContent', markdownInput.value);
    // }, 1000));
    // window.addEventListener('beforeunload', () => {
    //     localStorage.setItem('markdownInputContent', markdownInput.value);
    // });

});