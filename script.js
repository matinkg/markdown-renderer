// markdown-renderer/script.js
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
    // File Tabs Selectors
    const fileTabsContainer = document.getElementById('file-tabs-container');
    const fileTabsList = document.querySelector('.tab-list');
    const addTabBtn = document.getElementById('add-tab-btn');


    // --- State Variables ---
    let isAutoRenderEnabled = true; // Default state
    let currentTextDirection = 'ltr'; // Default
    let currentInlineCodeDirection = 'ltr'; // Default for `code`
    let currentCodeDirection = 'ltr'; // Default for ```code```
    let isFullHeightModeEnabled = false; // Default state for new mode

    // --- File Management State ---
    let files = {};
    let activeFileId = null;
    let nextFileId = 1;

    // --- Header Height Sync (Tabs/Direction) ---
    function syncHeaderHeights() {
        const tabsHeader = document.getElementById('file-tabs-container');
        const dirHeader = document.getElementById('direction-controls-container');
        if (!tabsHeader || !dirHeader) return;
        // Reset to natural height for accurate measurement
        tabsHeader.style.height = '';
        dirHeader.style.height = '';
        // Measure and set to the max
        const maxH = Math.max(tabsHeader.offsetHeight, dirHeader.offsetHeight);
        tabsHeader.style.height = `${maxH}px`;
        dirHeader.style.height = `${maxH}px`;
    }


    // --- File Management Functions ---
    function createNewFile(name = null, content = '') {
        const id = nextFileId++;
        const fileName = name || `File ${id}`;
        
        files[id] = {
            id: id,
            name: fileName,
            content: content
        };
        
        return id;
    }

    function switchToFile(fileId) {
        // Save current file content before switching
        if (activeFileId && files[activeFileId]) {
            files[activeFileId].content = markdownInput.value;
        }
        
        activeFileId = fileId;
        
        // Load the new file content
        if (files[fileId]) {
            markdownInput.value = files[fileId].content;
            updateCounts();
            if (isAutoRenderEnabled) {
                renderMarkdown();
            }
        }
        
        updateTabsUI();
        
        // Scroll to show the active tab
        setTimeout(() => {
            const activeTab = document.querySelector('.file-tab.active');
            if (activeTab) {
                activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }, 50);
    }

    function deleteFile(fileId) {
        if (Object.keys(files).length <= 1) {
            return; // Don't delete the last file
        }
        
        delete files[fileId];
        
        // If deleted file was active, switch to first available file
        if (activeFileId === fileId) {
            const remainingIds = Object.keys(files);
            if (remainingIds.length > 0) {
                switchToFile(parseInt(remainingIds[0]));
            }
        }
        
        updateTabsUI();
    }

    function renameFile(fileId, newName) {
        if (files[fileId]) {
            files[fileId].name = newName;
            updateTabsUI();
        }
    }

    function createTabElement(file) {
        const tab = document.createElement('div');
        tab.className = `file-tab ${file.id === activeFileId ? 'active' : ''}`;
        tab.dataset.fileId = file.id;
        
        tab.innerHTML = `
            <span class="file-tab-name">${file.name}</span>
            <button class="file-tab-close" type="button" title="Close file">
                <i class="bi bi-x"></i>
            </button>
        `;
        
        return tab;
    }

    function updateTabsUI() {
        fileTabsList.innerHTML = '';
        
        Object.values(files).forEach(file => {
            const tabElement = createTabElement(file);
            fileTabsList.appendChild(tabElement);
        });
    // After updating tabs, re-sync header heights
    syncHeaderHeights();
    }

    function scrollTabsToEnd() {
        // Scroll the tab list to the end to show the newest tab
        fileTabsList.scrollLeft = fileTabsList.scrollWidth;
    }

    function initializeFiles() {
        // Try to load saved files from localStorage
        const savedFiles = localStorage.getItem('markdownFiles');
        const savedActiveFileId = localStorage.getItem('markdownActiveFileId');
        
        if (savedFiles) {
            try {
                files = JSON.parse(savedFiles);
                activeFileId = savedActiveFileId ? parseInt(savedActiveFileId) : null;
                
                // Ensure we have a valid active file
                if (!activeFileId || !files[activeFileId]) {
                    const fileIds = Object.keys(files);
                    activeFileId = fileIds.length > 0 ? parseInt(fileIds[0]) : null;
                }
                
                // Update nextFileId to avoid conflicts
                const maxId = Math.max(...Object.keys(files).map(id => parseInt(id)));
                nextFileId = maxId + 1;
                
                // Load active file content into textarea
                if (activeFileId && files[activeFileId]) {
                    markdownInput.value = files[activeFileId].content;
                }
                
                updateTabsUI();
                return;
            } catch (e) {
                console.warn('Failed to load saved files:', e);
            }
        }
        
        // Fallback: create first file with legacy saved content or empty
        const savedInput = localStorage.getItem('markdownInputContent') || '';
        const firstFileId = createNewFile('File 1', savedInput);
        switchToFile(firstFileId);
    }


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

        // --- START: MathJax/KaTeX block processing ---
        // Temporarily replace block-level math expressions ($$ ... $$) with placeholders
        // to prevent `marked` from interfering with them (e.g., adding <p> tags inside).
        const mathBlocks = [];
        const textWithPlaceholders = markdownText.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
            const id = mathBlocks.length;
            // Note: We wrap the content in a div to ensure it's treated as a block element.
            // The extra newlines help `marked` treat this as a distinct block.
            mathBlocks.push(match);
            return `\n<div class="math-placeholder" data-id="${id}"></div>\n`;
        });
        // --- END: MathJax/KaTeX block processing ---


        // Configure marked
        marked.setOptions({
            breaks: true, // Convert single line breaks to <br>
            gfm: true,    // Use GitHub Flavored Markdown
        });

        try {
            // 1. Parse Markdown to HTML using the text with placeholders
            const html = marked.parse(textWithPlaceholders);
            markdownOutput.innerHTML = html;

            // --- START: Restore Math Blocks ---
            // Find the placeholders and replace them with their original math content.
            markdownOutput.querySelectorAll('div.math-placeholder').forEach(placeholder => {
                const id = parseInt(placeholder.dataset.id, 10);
                if (id >= 0 && id < mathBlocks.length) {
                    // Create a text node with the raw math content
                    const mathTextNode = document.createTextNode(mathBlocks[id]);
                    // Replace the placeholder div with the text node.
                    // The parent will typically be the markdownOutput itself or a block-level element.
                    placeholder.parentNode.replaceChild(mathTextNode, placeholder);
                }
            });
            // --- END: Restore Math Blocks ---

            // 2. Render LaTeX math using KaTeX auto-render on the restored content
            renderMathInElement(markdownOutput, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ],
                throwOnError: false
            });

            // 3. Apply direction to inline code elements FIRST
            applyInlineCodeDirectionToElements(currentInlineCodeDirection);

            // 4. Apply Syntax Highlighting to BLOCK code
            markdownOutput.querySelectorAll('pre code').forEach((block) => {
                // Check if already highlighted to avoid re-processing
                if (!block.classList.contains('hljs')) {
                    try {
                        hljs.highlightElement(block);
                    } catch (error) {
                        console.error("Highlight.js error on block:", error, block);
                        block.classList.add('hljs-error'); // Optional: Mark errored blocks
                    }
                }
            });

            // 5. Enhance Code Blocks (``` ```) - Adds wrapper, copy button etc.
            enhanceCodeBlocks(); // This adds wrappers and might re-apply hljs if needed

            // 6. Ensure block code wrappers have the correct direction attribute AFTER enhancing
            applyCodeDirectionToBlocks(currentCodeDirection);

        } catch (error) {
            // Catch errors during Markdown parsing or subsequent steps
            console.error("Rendering error:", error);
            markdownOutput.innerHTML = `<div class="alert alert-danger">Error rendering content. Please check your Markdown and console for details.</div>`;
        }
    }

    // --- Enhance Code Blocks (``` ``` only) ---
    function enhanceCodeBlocks() {
        const processedPres = new Set(); // Keep track of processed <pre> tags
        markdownOutput.querySelectorAll('pre').forEach((preElement) => {
            // Skip if already processed or if it's inside a wrapper (e.g., nested blocks - unusual)
            if (processedPres.has(preElement) || preElement.parentElement.classList.contains('code-block-wrapper')) {
                return; // Skip already wrapped/processed blocks
            }

            const codeElement = preElement.querySelector('code');
            if (!codeElement) return; // Skip <pre> without <code> inside

            // --- Create Wrapper ---
            const wrapper = document.createElement('div');
            wrapper.classList.add('code-block-wrapper');
            // Apply current BLOCK code direction when creating the wrapper
            wrapper.dataset.codeDirection = currentCodeDirection; // Set initial direction

            // Insert wrapper before pre, then move pre inside wrapper
            preElement.parentNode.insertBefore(wrapper, preElement);
            wrapper.appendChild(preElement);
            processedPres.add(preElement); // Mark this <pre> as processed

            // --- Determine Language ---
            let language = 'plaintext'; // Default language
            // Find language class like "language-javascript"
            const langClass = Array.from(codeElement.classList).find(cls => cls.startsWith('language-'));
            if (langClass) {
                language = langClass.replace('language-', '');
            } else {
                // If no language- class, check if a class name is a valid hljs language
                const potentialLangClass = Array.from(codeElement.classList).find(cls => hljs.getLanguage(cls));
                if (potentialLangClass) {
                    language = potentialLangClass;
                    // Ensure the standard class format exists for consistency
                    if (!codeElement.classList.contains(`language-${language}`)) {
                        codeElement.classList.add(`language-${language}`);
                    }
                } else if (!codeElement.className.includes('language-')) {
                    // If truly no language info, add plaintext class
                    codeElement.classList.add('language-plaintext');
                }
            }
            // Ensure hljs class is present for themes to apply correctly even if highlighting failed/skipped
            if (!codeElement.classList.contains('hljs')) {
                codeElement.classList.add('hljs');
            }


            // --- Create Header ---
            const header = document.createElement('div');
            header.classList.add('code-block-header');

            const langSpan = document.createElement('span');
            langSpan.classList.add('language');
            langSpan.textContent = language; // Display detected or default language

            const copyButton = document.createElement('button');
            copyButton.classList.add('btn', 'btn-secondary', 'btn-sm', 'copy-code-button');
            copyButton.innerHTML = '<i class="bi bi-clipboard"></i>';
            copyButton.title = 'Copy code to clipboard';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');

            const iconSpan = document.createElement('span');
            iconSpan.classList.add('collapse-icon'); // Icon for collapsing (handled by CSS)
            iconSpan.title = 'Toggle Collapse';

            // Add elements to header
            header.appendChild(langSpan);
            header.appendChild(copyButton);
            header.appendChild(iconSpan); // Add collapse icon to header

            // Insert header before the <pre> element inside the wrapper
            wrapper.insertBefore(header, preElement);

            // --- Event Listeners ---
            // Copy Button Click
            copyButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent header click event when clicking button
                const codeToCopy = codeElement.innerText; // Get text content of the code block
                navigator.clipboard.writeText(codeToCopy).then(() => {
                    // Success: Change button icon/style temporarily
                    copyButton.innerHTML = '<i class="bi bi-check-lg"></i>';
                    copyButton.classList.add('copied', 'btn-success');
                    copyButton.classList.remove('btn-secondary');
                    // Revert after 2 seconds
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="bi bi-clipboard"></i>';
                        copyButton.classList.remove('copied', 'btn-success');
                        copyButton.classList.add('btn-secondary');
                    }, 2000);
                }).catch(err => {
                    // Error: Log error and show error icon temporarily
                    console.error('Failed to copy code: ', err);
                    copyButton.innerHTML = '<i class="bi bi-x-octagon-fill text-danger"></i>'; // Error icon
                    setTimeout(() => { copyButton.innerHTML = '<i class="bi bi-clipboard"></i>'; }, 2000);
                });
            });

            // Header Click for Collapse/Expand
            header.addEventListener('click', (event) => {
                // Only trigger collapse if the click is not on the copy button itself
                if (!copyButton.contains(event.target)) {
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
        // Persist state
        localStorage.setItem('markdownRendererInputVisible', isInputVisible);
    // Re-sync header heights when layout changes
    syncHeaderHeights();
    }

    // --- Theme Switching ---
    function applyTheme(theme) { // theme = 'light' or 'dark'
        rootElement.setAttribute('data-bs-theme', theme);
        if (theme === 'dark') {
            themeSwitchLabel.innerHTML = '<i class="bi bi-sun-fill"></i>'; // Sun icon for dark mode
            hljsThemeDarkLink.removeAttribute('disabled'); // Enable dark HLJS theme
            hljsThemeLightLink.setAttribute('disabled', 'true'); // Disable light HLJS theme
        } else {
            themeSwitchLabel.innerHTML = '<i class="bi bi-moon-stars-fill"></i>'; // Moon icon for light mode
            hljsThemeLightLink.removeAttribute('disabled'); // Enable light HLJS theme
            hljsThemeDarkLink.setAttribute('disabled', 'true'); // Disable dark HLJS theme
        }
        // Save theme preference
        localStorage.setItem('markdownRendererTheme', theme);
    }

    function toggleTheme() {
        const currentTheme = rootElement.getAttribute('data-bs-theme') || 'light'; // Default to light if unset
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    }

    // --- Auto Render Control ---
    function updateAutoRenderState() {
        isAutoRenderEnabled = autoRenderSwitch.checked;
        manualRenderButton.disabled = isAutoRenderEnabled; // Disable manual button if auto is on
        localStorage.setItem('markdownRendererAutoRender', isAutoRenderEnabled);
        // If auto-render was just enabled, trigger a render
        if (isAutoRenderEnabled) {
            renderMarkdown();
        }
    }

    // --- Text Direction Control ---
    function setTextDirection(direction) {
        currentTextDirection = direction;
        markdownOutput.dataset.textDirection = direction; // Set data attribute for CSS styling
        localStorage.setItem('markdownRendererTextDir', direction); // Save preference
        // Update button active states
        textDirLtrBtn.classList.toggle('active', direction === 'ltr');
        textDirRtlBtn.classList.toggle('active', direction === 'rtl');
        // Re-render needed if math layout depends on parent direction initially
        // (KaTeX CSS fix should handle this, but re-render ensures consistency)
        renderMarkdown();
    }

    // --- START: Inline Code Direction Control ---
    function applyInlineCodeDirectionToElements(direction) {
        // Selects <code> elements NOT inside <pre> elements (i.e., inline code)
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
        // No re-render needed as this is applied after initial render
    }
    // --- END: Inline Code Direction Control ---


    // --- Code Block (``` ```) Direction Control ---
    function applyCodeDirectionToBlocks(direction) {
        // Apply only to the wrappers created by enhanceCodeBlocks
        markdownOutput.querySelectorAll('.code-block-wrapper').forEach(wrapper => {
            wrapper.dataset.codeDirection = direction; // Apply data attribute for CSS styling
        });
    }

    function setCodeDirection(direction) {
        currentCodeDirection = direction;
        applyCodeDirectionToBlocks(direction); // Apply to all existing code block wrappers immediately
        localStorage.setItem('markdownRendererCodeDir', direction); // Save preference

        // Update button active state
        codeDirLtrBtn.classList.toggle('active', direction === 'ltr');
        codeDirRtlBtn.classList.toggle('active', direction === 'rtl');
        // CSS uses the data-code-direction attribute on the wrapper
        // No re-render needed as this is applied after initial render
    }

    // --- Markdown Toolbar Functionality ---
    function applyMarkdownSyntax(syntaxType) {
        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        const selectedText = markdownInput.value.substring(start, end);
        const textBefore = markdownInput.value.substring(0, start);
        const textAfter = markdownInput.value.substring(end);
        let newText = '';
        let cursorPos = start;

        // Helper to wrap selected text or insert placeholder
        const wrapSelection = (beforeSyntax, afterSyntax, placeholder = '') => {
            if (selectedText) {
                // Wrap existing selection
                newText = `${textBefore}${beforeSyntax}${selectedText}${afterSyntax}${textAfter}`;
                // Place cursor after the wrapped text
                cursorPos = start + beforeSyntax.length + selectedText.length + afterSyntax.length;
            } else {
                // Insert syntax with placeholder
                newText = `${textBefore}${beforeSyntax}${placeholder}${afterSyntax}${textAfter}`;
                // Place cursor at the beginning of the placeholder
                cursorPos = start + beforeSyntax.length;
                markdownInput.value = newText;
                // Select the placeholder text
                markdownInput.setSelectionRange(cursorPos, cursorPos + placeholder.length);
                return; // Exit early as selection is handled
            }
            markdownInput.value = newText;
            markdownInput.setSelectionRange(cursorPos, cursorPos); // Place cursor after insertion
        };

        // Helper to add prefix to the start of the current line or selected lines
        const insertAtLineStart = (prefix, placeholder = '') => {
            let currentLineStart = textBefore.lastIndexOf('\n') + 1; // Find start of current line
            let indentedPrefix = prefix; // Use prefix directly

            if (selectedText && selectedText.includes('\n')) {
                // --- Multi-line selection ---
                const lines = selectedText.split('\n');
                // Find the actual start index of the first selected line
                const firstSelectedLineStart = textBefore.lastIndexOf('\n') + 1;
                const textBeforeSelectionStart = markdownInput.value.substring(0, firstSelectedLineStart);
                const textAfterSelectionEnd = textAfter;

                // Add prefix to each selected line
                const prefixedLines = lines.map(line => `${indentedPrefix}${line}`).join('\n');
                newText = `${textBeforeSelectionStart}${prefixedLines}${textAfterSelectionEnd}`;

                // Calculate new cursor end position
                cursorPos = end + (lines.length * indentedPrefix.length);
                markdownInput.value = newText;
                // Select all the modified lines
                markdownInput.setSelectionRange(firstSelectedLineStart + indentedPrefix.length, cursorPos);

            } else {
                // --- Single line or no selection ---
                const textBeforeLine = markdownInput.value.substring(0, currentLineStart);
                // Get current line content (needed if inserting placeholder without selection)
                const currentLineContent = markdownInput.value.substring(currentLineStart).split('\n')[0];

                if (selectedText) {
                    // Insert prefix before the single-line selection
                    newText = `${textBeforeLine}${indentedPrefix}${selectedText}${textAfter}`;
                    cursorPos = start + indentedPrefix.length; // Cursor start position
                    const selectionEndPos = end + indentedPrefix.length; // Cursor end position
                    markdownInput.value = newText;
                    markdownInput.setSelectionRange(cursorPos, selectionEndPos); // Reselect the modified text
                } else {
                    // Insert prefix and placeholder at the start of the line
                    newText = `${textBeforeLine}${indentedPrefix}${placeholder}${markdownInput.value.substring(currentLineStart)}`;
                    cursorPos = currentLineStart + indentedPrefix.length; // Cursor start position
                    markdownInput.value = newText;
                    // Select the placeholder
                    markdownInput.setSelectionRange(cursorPos, cursorPos + placeholder.length);
                }
            }
        };

        // Special handler for ordered lists to increment numbers
        const insertOrderedListPrefix = (placeholder = 'List item') => {
            let currentLineStart = textBefore.lastIndexOf('\n') + 1;
            let prefixNum = 1; // Start numbering at 1

            // Check previous line for existing number to continue sequence (optional improvement - omitted for simplicity)

            if (selectedText && selectedText.includes('\n')) {
                // --- Multi-line selection ---
                const lines = selectedText.split('\n');
                const firstSelectedLineStart = textBefore.lastIndexOf('\n') + 1;
                const textBeforeSelectionStart = markdownInput.value.substring(0, firstSelectedLineStart);
                const textAfterSelectionEnd = textAfter;

                // Add incrementing number prefix to each line
                const prefixedLines = lines.map((line, index) => `${index + prefixNum}. ${line}`).join('\n');
                newText = `${textBeforeSelectionStart}${prefixedLines}${textAfterSelectionEnd}`;

                // Calculate approximate end position (tricky due to varying number lengths)
                // This is a rough estimate, might need refinement
                cursorPos = end + (lines.length * 3) + (lines.length > 9 ? lines.length : 0); // Rough estimate
                markdownInput.value = newText;
                // Select the modified lines
                markdownInput.setSelectionRange(firstSelectedLineStart + `${prefixNum}. `.length, cursorPos);
            } else {
                // --- Single line or no selection ---
                // Use the basic insertAtLineStart with the starting number
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
                if (url !== null && url.trim() !== "") { // Check if user provided a URL
                    wrapSelection('[', `](${url})`, selectedText || 'link text');
                } else { return; } // Cancelled or empty URL
                break;
            case 'code-block':
                const language = prompt("Enter code language (optional):", "");
                const langStr = language ? language.trim() : ''; // Use language if provided
                const codePlaceholder = 'Your code here';
                // Ensure newlines around the block for proper parsing
                const beforeBlock = (textBefore.length === 0 || textBefore.endsWith('\n\n') || textBefore.endsWith('\n')) ? `\`\`\`${langStr}\n` : `\n\`\`\`${langStr}\n`;
                const afterBlock = `\n\`\`\`` + (textAfter.startsWith('\n') ? '' : '\n');

                if (selectedText) {
                    newText = `${textBefore}${beforeBlock}${selectedText}${afterBlock}${textAfter}`;
                    cursorPos = start + beforeBlock.length + selectedText.length + afterBlock.length;
                } else {
                    newText = `${textBefore}${beforeBlock}${codePlaceholder}${afterBlock}${textAfter}`;
                    cursorPos = start + beforeBlock.length; // Position cursor at start of placeholder
                    markdownInput.value = newText;
                    markdownInput.setSelectionRange(cursorPos, cursorPos + codePlaceholder.length); // Select placeholder
                    return; // Exit early
                }
                markdownInput.value = newText;
                markdownInput.setSelectionRange(cursorPos, cursorPos); // Place cursor after block
                break;
            case 'image':
                const altText = prompt("Enter image description (alt text):", "");
                if (altText === null) return; // User cancelled alt text prompt
                const imgUrl = prompt("Enter image URL:", "https://");
                if (imgUrl === null || imgUrl.trim() === "") return; // User cancelled or empty URL

                // Add newlines before/after if needed for block behavior
                let prefix = (textBefore.length > 0 && !textBefore.endsWith('\n')) ? '\n' : '';
                let suffix = (textAfter.length > 0 && !textAfter.startsWith('\n')) ? '\n' : '';
                const imageMarkdown = `![${altText || ''}](${imgUrl})`;

                newText = `${textBefore}${prefix}${imageMarkdown}${suffix}${textAfter}`;
                cursorPos = start + prefix.length + imageMarkdown.length; // Cursor after image markdown
                markdownInput.value = newText;
                markdownInput.setSelectionRange(cursorPos, cursorPos);
                break;
            case 'h1': insertAtLineStart('# ', 'Heading 1'); break;
            case 'h2': insertAtLineStart('## ', 'Heading 2'); break;
            case 'h3': insertAtLineStart('### ', 'Heading 3'); break;
            case 'ul-list': insertAtLineStart('- ', 'List item'); break;
            case 'ol-list': insertOrderedListPrefix('List item'); break; // Use the specialized function
            case 'blockquote': insertAtLineStart('> ', 'Blockquote'); break;
            case 'hr':
                // Ensure HR is on its own line, surrounded by blank lines
                let hrPrefix = '\n';
                if (textBefore.length > 0 && !textBefore.endsWith('\n\n')) {
                    hrPrefix = textBefore.endsWith('\n') ? '\n' : '\n\n';
                } else if (textBefore.length === 0) {
                    hrPrefix = ''; // No prefix needed if at the very beginning
                }
                let hrSuffix = '\n'; // Only need one newline after ---


                newText = `${textBefore}${hrPrefix}---\n${textAfter}`; // Keep it simple, add one newline after
                cursorPos = start + hrPrefix.length + 4; // Position cursor after '---' and newline
                markdownInput.value = newText;
                markdownInput.setSelectionRange(cursorPos, cursorPos);
                break;
        }

        // After applying syntax:
        markdownInput.focus(); // Keep focus on the input area
        updateCounts(); // Update char/word counts
        // If auto-render is on, trigger a re-render programmatically
        if (isAutoRenderEnabled) {
            // Use setTimeout to ensure the input value is updated in the DOM before dispatching event
            setTimeout(() => {
                markdownInput.dispatchEvent(new Event('input', { bubbles: true }));
            }, 0);
        }
    }

    // --- START: Full Height Mode ---
    function applyFullHeightMode(enabled) {
        isFullHeightModeEnabled = enabled; // Update state variable
        if (enabled) {
            rootElement.classList.add('full-height-mode');
        } else {
            rootElement.classList.remove('full-height-mode');
        }
        // No need to trigger resize usually, CSS handles layout
    }

    function toggleFullHeightMode() {
        // Use the switch's checked state directly
        applyFullHeightMode(fullHeightModeSwitch.checked);
        // Save preference
        localStorage.setItem('markdownRendererFullHeightMode', fullHeightModeSwitch.checked);
    // Re-sync heights in case borders/margins changed
    syncHeaderHeights();
    }
    // --- END: Full Height Mode ---


    // --- Event Listeners Setup ---
    const debouncedRender = debounce(renderMarkdown, 300); // Debounce render calls by 300ms

    // Debounced saving function
    const debouncedSaveInput = debounce(() => {
        if (activeFileId && files[activeFileId]) {
            // Save the files object to localStorage
            localStorage.setItem('markdownFiles', JSON.stringify(files));
            localStorage.setItem('markdownActiveFileId', activeFileId.toString());
        }
    }, 1000); // Save every 1 second after input stops

    // Header Controls Listeners
    toggleInputSwitch.addEventListener('change', toggleInputArea);
    themeSwitch.addEventListener('change', toggleTheme);
    autoRenderSwitch.addEventListener('change', updateAutoRenderState);
    manualRenderButton.addEventListener('click', renderMarkdown); // Manual render button
    fullHeightModeSwitch.addEventListener('change', toggleFullHeightMode); // Full height toggle

    // Direction Button Events
    textDirLtrBtn.addEventListener('click', () => setTextDirection('ltr'));
    textDirRtlBtn.addEventListener('click', () => setTextDirection('rtl'));
    inlineCodeDirLtrBtn.addEventListener('click', () => setInlineCodeDirection('ltr'));
    inlineCodeDirRtlBtn.addEventListener('click', () => setInlineCodeDirection('rtl'));
    codeDirLtrBtn.addEventListener('click', () => setCodeDirection('ltr')); // For ``` blocks
    codeDirRtlBtn.addEventListener('click', () => setCodeDirection('rtl')); // For ``` blocks


    // Markdown Toolbar Button Clicks (using event delegation)
    markdownToolbar.addEventListener('click', (event) => {
        // Find the closest button with a 'data-syntax' attribute
        const button = event.target.closest('button[data-syntax]');
        if (button) {
            event.preventDefault(); // Prevent default button behavior
            applyMarkdownSyntax(button.dataset.syntax); // Call syntax function
        }
    });

    // Keyboard Shortcuts (Ctrl+B, Ctrl+I, Ctrl+K)
    markdownInput.addEventListener('keydown', (event) => {
        // Check for Ctrl key (Windows/Linux) or Meta key (Mac)
        if (event.ctrlKey || event.metaKey) {
            let handled = false; // Flag to prevent default browser actions
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
            }
            // If we handled the key combination, prevent default browser behavior (e.g., bookmarking)
            if (handled) {
                event.preventDefault();
            }
        }
    });

    // --- File Tabs Event Handlers ---
    
    // Add new tab button
    addTabBtn.addEventListener('click', () => {
        const newFileId = createNewFile();
        switchToFile(newFileId);
        // Scroll to show the new tab after a brief delay to ensure DOM is updated
        setTimeout(scrollTabsToEnd, 50);
    });

    // Tab interactions (using event delegation)
    fileTabsList.addEventListener('click', (event) => {
        const tab = event.target.closest('.file-tab');
        if (!tab) return;

        const fileId = parseInt(tab.dataset.fileId);
        
        // Handle close button clicks
        if (event.target.closest('.file-tab-close')) {
            event.stopPropagation();
            deleteFile(fileId);
            return;
        }
        
        // Handle tab clicks (switch file)
        switchToFile(fileId);
    });

    // Tab double-click to rename
    fileTabsList.addEventListener('dblclick', (event) => {
        const tab = event.target.closest('.file-tab');
        if (!tab || event.target.closest('.file-tab-close')) return;

        const fileId = parseInt(tab.dataset.fileId);
        const nameSpan = tab.querySelector('.file-tab-name');
        
        if (!nameSpan || nameSpan.style.display === 'none') return; // Already editing
        
        const currentName = nameSpan.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'file-tab-name editing';
        input.style.width = Math.max(nameSpan.offsetWidth, 100) + 'px';
        
        // Replace span with input
        nameSpan.style.display = 'none';
        nameSpan.parentNode.insertBefore(input, nameSpan);
        
        input.focus();
        input.select();
        
        const finishEditing = () => {
            const newName = input.value.trim() || currentName;
            renameFile(fileId, newName);
            input.remove();
            nameSpan.style.display = '';
        };
        
        input.addEventListener('blur', finishEditing);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                finishEditing();
            } else if (e.key === 'Escape') {
                input.value = currentName;
                finishEditing();
            }
        });
        
        // Prevent the click event from interfering
        event.stopPropagation();
    });

    // Update file content when textarea changes
    markdownInput.addEventListener('input', () => {
        if (activeFileId && files[activeFileId]) {
            files[activeFileId].content = markdownInput.value;
        }
        updateCounts(); // Update counts on every input
        if (isAutoRenderEnabled) {
            debouncedRender(); // Use debounced rendering
        }
        // Save content frequently but debounced
        debouncedSaveInput();
    });

    // --- Initial Setup on Load ---

    // Initialize file management system
    initializeFiles();

    // 1. Theme
    const savedTheme = localStorage.getItem('markdownRendererTheme') || 'dark'; // Default to dark
    applyTheme(savedTheme); // Apply saved or default theme
    themeSwitch.checked = (savedTheme === 'dark'); // Set switch state

    // 2. Auto Render
    const savedAutoRender = localStorage.getItem('markdownRendererAutoRender');
    // Default to true if nothing is saved
    isAutoRenderEnabled = savedAutoRender !== null ? (savedAutoRender === 'true') : true;
    autoRenderSwitch.checked = isAutoRenderEnabled; // Set switch state
    updateAutoRenderState(); // Apply initial state (disables/enables manual button)

    // 3. Text Direction
    const savedTextDir = localStorage.getItem('markdownRendererTextDir') || 'ltr'; // Default LTR
    setTextDirection(savedTextDir); // Apply saved or default direction (this will trigger initial render)

    // 4. Inline Code Direction
    const savedInlineCodeDir = localStorage.getItem('markdownRendererInlineCodeDir') || 'ltr'; // Default LTR
    setInlineCodeDirection(savedInlineCodeDir); // Apply saved or default (applies after render)

    // 5. Code Block Direction (``` blocks)
    const savedCodeDir = localStorage.getItem('markdownRendererCodeDir') || 'ltr'; // Default LTR
    setCodeDirection(savedCodeDir); // Apply saved or default (applies after render)

    // 6. Full Height Mode
    const savedFullHeightMode = localStorage.getItem('markdownRendererFullHeightMode');
    // Default to false if nothing saved or not 'true'
    isFullHeightModeEnabled = savedFullHeightMode === 'true';
    fullHeightModeSwitch.checked = isFullHeightModeEnabled; // Set switch state
    applyFullHeightMode(isFullHeightModeEnabled); // Apply initial layout mode

    // 7. Input Visibility
    const savedInputVisible = localStorage.getItem('markdownRendererInputVisible');
    // Default to true (visible) if nothing saved
    const isInputInitiallyVisible = savedInputVisible !== null ? (savedInputVisible === 'true') : true;
    toggleInputSwitch.checked = isInputInitiallyVisible;
    // Apply initial layout based on visibility state *after* setting the switch
    toggleInputArea();

    // Initial Render and Counts (Render is already triggered by setTextDirection)
    // renderMarkdown(); // Perform the first render based on loaded content and settings - Removed as setTextDirection calls it
    updateCounts(); // Calculate initial counts
    // Initial header height sync after DOM laid out
    syncHeaderHeights();

    // Keep headers in sync on window resize (debounced)
    const debouncedSyncHeaders = debounce(syncHeaderHeights, 100);
    window.addEventListener('resize', debouncedSyncHeaders);

    // Save files on window close/refresh as a fallback
    window.addEventListener('beforeunload', () => {
        if (activeFileId && files[activeFileId]) {
            files[activeFileId].content = markdownInput.value;
            localStorage.setItem('markdownFiles', JSON.stringify(files));
            localStorage.setItem('markdownActiveFileId', activeFileId.toString());
        }
    });

}); // End DOMContentLoaded
