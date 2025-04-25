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
    const fullHeightModeSwitch = document.getElementById('fullHeightModeSwitch'); // New selector
    // Direction Selectors
    const textDirLtrBtn = document.getElementById('textDirLtrBtn');
    const textDirRtlBtn = document.getElementById('textDirRtlBtn');
    // -- START: Inline Code Direction Selectors --
    const inlineCodeDirLtrBtn = document.getElementById('inlineCodeDirLtrBtn');
    const inlineCodeDirRtlBtn = document.getElementById('inlineCodeDirRtlBtn');
    // -- END: Inline Code Direction Selectors --
    const codeDirLtrBtn = document.getElementById('codeDirLtrBtn'); // For ``` blocks
    const codeDirRtlBtn = document.getElementById('codeDirRtlBtn'); // For ``` blocks
    const markdownToolbar = document.getElementById('markdown-toolbar');
    // Count Display Selectors (New)
    const charCountSpan = document.getElementById('char-count');
    const wordCountSpan = document.getElementById('word-count');


    // --- State Variables ---
    let isAutoRenderEnabled = true; // Default state
    let currentTextDirection = 'ltr'; // Default
    let currentInlineCodeDirection = 'ltr'; // Default for `code`
    let currentCodeDirection = 'ltr'; // Default for ```code```
    let isFullHeightModeEnabled = false; // Default state for new mode


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

    // --- Update Character/Word Counts ---
    function updateCounts() {
        const text = markdownInput.value;
        const charCount = text.length;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = text.trim() === '' ? 0 : words.length;

        if (charCountSpan) {
            charCountSpan.textContent = `Chars: ${charCount}`;
        }
        if (wordCountSpan) {
            wordCountSpan.textContent = `Words: ${wordCount}`;
        }
    }

    // --- Render Markdown ---
    function renderMarkdown() {
        const markdownText = markdownInput.value;

        marked.setOptions({
            breaks: true,
            gfm: true,
        });

        try {
            const html = marked.parse(markdownText);
            markdownOutput.innerHTML = html;

            // Apply direction to inline code elements FIRST
            applyInlineCodeDirectionToElements(currentInlineCodeDirection);

            // Apply Syntax Highlighting to BLOCK code
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

            // Enhance Code Blocks (``` ```) - Adds wrapper, copy button etc.
            enhanceCodeBlocks();

            // Ensure block code wrappers have the correct direction attribute after rendering/enhancing
            applyCodeDirectionToBlocks(currentCodeDirection);


        } catch (error) {
            console.error("Markdown parsing error:", error);
            markdownOutput.innerHTML = `<div class="alert alert-danger">Error parsing Markdown. Please check your input.</div>`;
        }
    }

    // --- Enhance Code Blocks (``` ``` only) ---
    function enhanceCodeBlocks() {
        const processedPres = new Set();
        markdownOutput.querySelectorAll('pre').forEach((preElement) => {
            if (processedPres.has(preElement) || preElement.parentElement.classList.contains('code-block-wrapper')) {
                processedPres.add(preElement);
                return;
            }
            const codeElement = preElement.querySelector('code');
            if (!codeElement) return;

            // --- Create Wrapper ---
            const wrapper = document.createElement('div');
            wrapper.classList.add('code-block-wrapper');
            // Apply current BLOCK code direction when creating the wrapper
            wrapper.dataset.codeDirection = currentCodeDirection;

            preElement.parentNode.insertBefore(wrapper, preElement);
            wrapper.appendChild(preElement);
            processedPres.add(preElement);

            // --- Determine Language ---
            let language = 'plaintext';
            const langClass = Array.from(codeElement.classList).find(cls => cls.startsWith('language-'));
            if (langClass) {
                language = langClass.replace('language-', '');
            } else {
                const potentialLangClass = Array.from(codeElement.classList).find(cls => hljs.getLanguage(cls));
                if (potentialLangClass) {
                    language = potentialLangClass;
                    if (!codeElement.classList.contains(`language-${language}`)) {
                        codeElement.classList.add(`language-${language}`);
                    }
                } else if (!codeElement.className.includes('language-')) {
                    codeElement.classList.add('language-plaintext');
                }
            }
            if (!codeElement.classList.contains('hljs')) {
                codeElement.classList.add('hljs');
            }

            // --- Create Header ---
            const header = document.createElement('div');
            header.classList.add('code-block-header');

            const langSpan = document.createElement('span');
            langSpan.classList.add('language');
            langSpan.textContent = language;

            const copyButton = document.createElement('button');
            copyButton.classList.add('btn', 'btn-secondary', 'btn-sm', 'copy-code-button');
            copyButton.innerHTML = '<i class="bi bi-clipboard"></i>';
            copyButton.title = 'Copy code to clipboard';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');

            const iconSpan = document.createElement('span');
            iconSpan.classList.add('collapse-icon');
            iconSpan.title = 'Toggle Collapse';

            header.appendChild(langSpan);
            header.appendChild(copyButton);
            header.appendChild(iconSpan);

            wrapper.insertBefore(header, preElement);

            // --- Event Listeners ---
            copyButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const codeToCopy = codeElement.innerText;
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    copyButton.innerHTML = '<i class="bi bi-check-lg"></i>';
                    copyButton.classList.add('copied', 'btn-success');
                    copyButton.classList.remove('btn-secondary');
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="bi bi-clipboard"></i>';
                        copyButton.classList.remove('copied', 'btn-success');
                        copyButton.classList.add('btn-secondary');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy code: ', err);
                    copyButton.innerHTML = '<i class="bi bi-x-octagon-fill text-danger"></i>';
                    setTimeout(() => { copyButton.innerHTML = '<i class="bi bi-clipboard"></i>'; }, 2000);
                });
            });

            header.addEventListener('click', (event) => {
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
    }

    // --- Theme Switching ---
    function applyTheme(theme) { // theme = 'light' or 'dark'
        rootElement.setAttribute('data-bs-theme', theme);
        if (theme === 'dark') {
            themeSwitchLabel.innerHTML = '<i class="bi bi-sun-fill"></i>';
            hljsThemeDarkLink.removeAttribute('disabled');
            hljsThemeLightLink.setAttribute('disabled', 'true');
        } else {
            themeSwitchLabel.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
            hljsThemeLightLink.removeAttribute('disabled');
            hljsThemeDarkLink.setAttribute('disabled', 'true');
        }
        localStorage.setItem('markdownRendererTheme', theme);
    }

    function toggleTheme() {
        const currentTheme = rootElement.getAttribute('data-bs-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    }

    // --- Auto Render Control ---
    function updateAutoRenderState() {
        isAutoRenderEnabled = autoRenderSwitch.checked;
        manualRenderButton.disabled = isAutoRenderEnabled;
        localStorage.setItem('markdownRendererAutoRender', isAutoRenderEnabled);
        if (isAutoRenderEnabled) {
            renderMarkdown();
        }
    }

    // --- Text Direction Control ---
    function setTextDirection(direction) {
        currentTextDirection = direction;
        markdownOutput.dataset.textDirection = direction;
        localStorage.setItem('markdownRendererTextDir', direction);
        textDirLtrBtn.classList.toggle('active', direction === 'ltr');
        textDirRtlBtn.classList.toggle('active', direction === 'rtl');
    }

    // --- START: Inline Code Direction Control ---
    function applyInlineCodeDirectionToElements(direction) {
        // Selects <code> elements NOT inside <pre> elements
        markdownOutput.querySelectorAll('code:not(pre code)').forEach(inlineCode => {
            inlineCode.dataset.inlineCodeDirection = direction; // Apply data attribute for CSS
        });
    }

    function setInlineCodeDirection(direction) {
        currentInlineCodeDirection = direction;
        applyInlineCodeDirectionToElements(direction); // Apply to all existing inline code elements
        localStorage.setItem('markdownRendererInlineCodeDir', direction); // Save preference

        // Update button active state
        inlineCodeDirLtrBtn.classList.toggle('active', direction === 'ltr');
        inlineCodeDirRtlBtn.classList.toggle('active', direction === 'rtl');
        // CSS handles the visual direction change based on the data attribute
    }
    // --- END: Inline Code Direction Control ---


    // --- Code Block (``` ```) Direction Control ---
    function applyCodeDirectionToBlocks(direction) {
        // Apply only to the wrappers created by enhanceCodeBlocks
        markdownOutput.querySelectorAll('.code-block-wrapper').forEach(wrapper => {
            wrapper.dataset.codeDirection = direction; // Apply data attribute for CSS
        });
    }

    function setCodeDirection(direction) {
        currentCodeDirection = direction;
        applyCodeDirectionToBlocks(direction); // Apply to all existing code block wrappers immediately
        localStorage.setItem('markdownRendererCodeDir', direction); // Save preference

        // Update button active state
        codeDirLtrBtn.classList.toggle('active', direction === 'ltr');
        codeDirRtlBtn.classList.toggle('active', direction === 'rtl');
    }

    // --- Markdown Toolbar Functionality ---
    // (No changes needed in applyMarkdownSyntax itself)
    function applyMarkdownSyntax(syntaxType) {
        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        const selectedText = markdownInput.value.substring(start, end);
        const textBefore = markdownInput.value.substring(0, start);
        const textAfter = markdownInput.value.substring(end);
        let newText = '';
        let cursorPos = start;

        const wrapSelection = (beforeSyntax, afterSyntax, placeholder = '') => {
            if (selectedText) {
                newText = `${textBefore}${beforeSyntax}${selectedText}${afterSyntax}${textAfter}`;
                cursorPos = start + beforeSyntax.length + selectedText.length + afterSyntax.length;
            } else {
                newText = `${textBefore}${beforeSyntax}${placeholder}${afterSyntax}${textAfter}`;
                cursorPos = start + beforeSyntax.length;
                markdownInput.value = newText;
                markdownInput.setSelectionRange(cursorPos, cursorPos + placeholder.length);
                return;
            }
            markdownInput.value = newText;
            markdownInput.setSelectionRange(cursorPos, cursorPos);
        };

        const insertAtLineStart = (prefix, placeholder = '') => {
            let currentLineStart = textBefore.lastIndexOf('\n') + 1;
            let indentedPrefix = prefix;

            if (selectedText && selectedText.includes('\n')) {
                const lines = selectedText.split('\n');
                const firstSelectedLineStart = textBefore.lastIndexOf('\n') + 1;
                const textBeforeSelectionStart = markdownInput.value.substring(0, firstSelectedLineStart);
                const textAfterSelectionEnd = textAfter;

                const prefixedLines = lines.map(line => `${indentedPrefix}${line}`).join('\n');
                newText = `${textBeforeSelectionStart}${prefixedLines}${textAfterSelectionEnd}`;

                cursorPos = end + (lines.length * indentedPrefix.length);
                markdownInput.value = newText;
                markdownInput.setSelectionRange(firstSelectedLineStart + indentedPrefix.length, cursorPos);

            } else {
                const textBeforeLine = markdownInput.value.substring(0, currentLineStart);
                const currentLineContent = markdownInput.value.substring(currentLineStart).split('\n')[0];

                if (selectedText) {
                    newText = `${textBeforeLine}${indentedPrefix}${selectedText}${textAfter}`;
                    cursorPos = start + indentedPrefix.length;
                    const selectionEndPos = end + indentedPrefix.length;
                    markdownInput.value = newText;
                    markdownInput.setSelectionRange(cursorPos, selectionEndPos);
                } else {
                    newText = `${textBeforeLine}${indentedPrefix}${placeholder}${markdownInput.value.substring(currentLineStart)}`;
                    cursorPos = currentLineStart + indentedPrefix.length;
                    markdownInput.value = newText;
                    markdownInput.setSelectionRange(cursorPos, cursorPos + placeholder.length);
                }
            }
        };

        const insertOrderedListPrefix = (placeholder = 'List item') => {
            let currentLineStart = textBefore.lastIndexOf('\n') + 1;
            let prefixNum = 1;

            if (selectedText && selectedText.includes('\n')) {
                const lines = selectedText.split('\n');
                const firstSelectedLineStart = textBefore.lastIndexOf('\n') + 1;
                const textBeforeSelectionStart = markdownInput.value.substring(0, firstSelectedLineStart);
                const textAfterSelectionEnd = textAfter;

                const prefixedLines = lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
                newText = `${textBeforeSelectionStart}${prefixedLines}${textAfterSelectionEnd}`;

                cursorPos = end + (lines.length * 3) + (String(lines.length).length - 1);
                markdownInput.value = newText;
                markdownInput.setSelectionRange(firstSelectedLineStart + 3, cursorPos);
            } else {
                insertAtLineStart(`${prefixNum}. `, selectedText || placeholder);
            }
        };


        // --- Syntax Application Logic ---
        switch (syntaxType) {
            case 'bold': wrapSelection('**', '**', 'bold text'); break;
            case 'italic': wrapSelection('*', '*', 'italic text'); break;
            case 'strikethrough': wrapSelection('~~', '~~', 'strikethrough'); break;
            case 'inline-code': wrapSelection('`', '`', 'code'); break;
            case 'link':
                const url = prompt("Enter link URL:", "https://");
                if (url !== null && url.trim() !== "") {
                    wrapSelection('[', `](${url})`, selectedText || 'link text');
                } else { return; }
                break;
            case 'code-block':
                const language = prompt("Enter code language (optional):", "");
                const langStr = language ? language.trim() : '';
                const codePlaceholder = 'Your code here';
                const beforeBlock = `\n\`\`\`${langStr}\n`;
                const afterBlock = `\n\`\`\`\n`;

                if (selectedText) {
                    newText = `${textBefore}${beforeBlock}${selectedText}${afterBlock}${textAfter}`;
                    cursorPos = start + beforeBlock.length + selectedText.length + afterBlock.length;
                } else {
                    newText = `${textBefore}${beforeBlock}${codePlaceholder}${afterBlock}${textAfter}`;
                    cursorPos = start + beforeBlock.length;
                    markdownInput.value = newText;
                    markdownInput.setSelectionRange(cursorPos, cursorPos + codePlaceholder.length);
                    return;
                }
                markdownInput.value = newText;
                markdownInput.setSelectionRange(cursorPos, cursorPos);
                break;
            case 'image':
                const altText = prompt("Enter image description (alt text):", "");
                if (altText === null) return;
                const imgUrl = prompt("Enter image URL:", "https://");
                if (!imgUrl) return;
                let prefix = (textBefore.length > 0 && textBefore.slice(-1) !== '\n') ? '\n' : '';
                let suffix = (textAfter.length > 0 && textAfter[0] !== '\n') ? '\n' : '';
                newText = `${textBefore}${prefix}![${altText || ''}](${imgUrl})${suffix}${textAfter}`;
                cursorPos = start + prefix.length + `![${altText || ''}](${imgUrl})`.length;
                markdownInput.value = newText;
                markdownInput.setSelectionRange(cursorPos, cursorPos);
                break;
            case 'h1': insertAtLineStart('# ', 'Heading 1'); break;
            case 'h2': insertAtLineStart('## ', 'Heading 2'); break;
            case 'h3': insertAtLineStart('### ', 'Heading 3'); break;
            case 'ul-list': insertAtLineStart('- ', 'List item'); break;
            case 'ol-list': insertOrderedListPrefix('List item'); break;
            case 'blockquote': insertAtLineStart('> ', 'Blockquote'); break;
            case 'hr':
                newText = `${textBefore}\n\n---\n\n${textAfter}`;
                cursorPos = start + 5;
                markdownInput.value = newText;
                markdownInput.setSelectionRange(cursorPos, cursorPos);
                break;
        }

        markdownInput.focus();
        updateCounts();
        if (isAutoRenderEnabled) {
            setTimeout(() => {
                markdownInput.dispatchEvent(new Event('input', { bubbles: true }));
            }, 0);
        }
    }

    // --- START: Full Height Mode ---
    function applyFullHeightMode(enabled) {
        if (enabled) {
            rootElement.classList.add('full-height-mode');
        } else {
            rootElement.classList.remove('full-height-mode');
        }
        // Optional: Trigger resize if layout changes affect internal components
        // window.dispatchEvent(new Event('resize'));
    }

    function toggleFullHeightMode() {
        isFullHeightModeEnabled = fullHeightModeSwitch.checked;
        applyFullHeightMode(isFullHeightModeEnabled);
        localStorage.setItem('markdownRendererFullHeightMode', isFullHeightModeEnabled);
    }
    // --- END: Full Height Mode ---


    // --- Event Listeners Setup ---
    const debouncedRender = debounce(renderMarkdown, 300);

    markdownInput.addEventListener('input', () => {
        updateCounts();
        if (isAutoRenderEnabled) {
            debouncedRender();
        }
    });

    toggleInputSwitch.addEventListener('change', toggleInputArea);
    themeSwitch.addEventListener('change', toggleTheme);
    autoRenderSwitch.addEventListener('change', updateAutoRenderState);
    manualRenderButton.addEventListener('click', renderMarkdown);
    fullHeightModeSwitch.addEventListener('change', toggleFullHeightMode); // Add listener

    // Direction Button Events
    textDirLtrBtn.addEventListener('click', () => setTextDirection('ltr'));
    textDirRtlBtn.addEventListener('click', () => setTextDirection('rtl'));
    // -- START: Inline Code Direction Listeners --
    inlineCodeDirLtrBtn.addEventListener('click', () => setInlineCodeDirection('ltr'));
    inlineCodeDirRtlBtn.addEventListener('click', () => setInlineCodeDirection('rtl'));
    // -- END: Inline Code Direction Listeners --
    codeDirLtrBtn.addEventListener('click', () => setCodeDirection('ltr')); // For ``` blocks
    codeDirRtlBtn.addEventListener('click', () => setCodeDirection('rtl')); // For ``` blocks


    markdownToolbar.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-syntax]');
        if (button) {
            event.preventDefault();
            applyMarkdownSyntax(button.dataset.syntax);
        }
    });

    markdownInput.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey) {
            let handled = false;
            switch (event.key.toLowerCase()) {
                case 'b': applyMarkdownSyntax('bold'); handled = true; break;
                case 'i': applyMarkdownSyntax('italic'); handled = true; break;
                case 'k': applyMarkdownSyntax('link'); handled = true; break;
            }
            if (handled) {
                event.preventDefault();
            }
        }
    });

    // --- Initial Setup on Load ---

    // Theme
    const savedTheme = localStorage.getItem('markdownRendererTheme') || 'dark';
    applyTheme(savedTheme);
    themeSwitch.checked = (savedTheme === 'dark');

    // Auto Render
    const savedAutoRender = localStorage.getItem('markdownRendererAutoRender');
    isAutoRenderEnabled = savedAutoRender !== null ? (savedAutoRender === 'true') : true;
    autoRenderSwitch.checked = isAutoRenderEnabled;
    updateAutoRenderState(); // Applies state

    // Text Direction
    const savedTextDir = localStorage.getItem('markdownRendererTextDir') || 'ltr';
    setTextDirection(savedTextDir); // Applies state

    // Inline Code Direction
    const savedInlineCodeDir = localStorage.getItem('markdownRendererInlineCodeDir') || 'ltr';
    setInlineCodeDirection(savedInlineCodeDir); // Applies state

    // Code Block Direction
    const savedCodeDir = localStorage.getItem('markdownRendererCodeDir') || 'ltr'; // For ``` blocks
    setCodeDirection(savedCodeDir); // Applies state

    // Full Height Mode (New)
    const savedFullHeightMode = localStorage.getItem('markdownRendererFullHeightMode');
    isFullHeightModeEnabled = savedFullHeightMode === 'true'; // Default false if null/not 'true'
    fullHeightModeSwitch.checked = isFullHeightModeEnabled;
    applyFullHeightMode(isFullHeightModeEnabled); // Apply initial state

    // Input Content
    const savedInput = localStorage.getItem('markdownInputContent');
    if (savedInput) {
        markdownInput.value = savedInput;
    }

    // Apply initial layout states AFTER loading all preferences
    toggleInputArea();
    renderMarkdown(); // Initial render (will apply all loaded directions)
    updateCounts();

    // Save input content periodically and on close
    markdownInput.addEventListener('input', debounce(() => {
        localStorage.setItem('markdownInputContent', markdownInput.value);
    }, 1000));
    window.addEventListener('beforeunload', () => {
        localStorage.setItem('markdownInputContent', markdownInput.value);
    });
});
