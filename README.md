# Markdown Renderer

A simple, client-side web application for writing and previewing Markdown text with live rendering, enhanced code blocks, and customizable features.

This project provides a clean interface to type Markdown on one side and see the rendered HTML output on the other, powered by `marked.js` for parsing and `highlight.js` for code syntax highlighting.

**[Live Demo](https://matinkg.github.io/markdown-renderer/)**

## Features

*   **Live Preview:** See your Markdown rendered into HTML as you type (can be toggled).
*   **Manual Rendering:** Option to disable auto-render and trigger rendering manually.
*   **Split View:** Input and output panels displayed side-by-side on larger screens.
*   **Toggle Input Panel:** Hide the input panel to view the rendered output in a full-width view.
*   **Character and Word Count:** Get real-time statistics of your input text.
*   **Markdown Toolbar:** Quick access buttons for inserting common Markdown syntax (Bold, Italic, Link, Code, Lists, Headings, etc.) with basic keyboard shortcuts (Ctrl/Cmd+B, I, K).
*   **Enhanced Code Blocks:** Rendered code blocks include:
    *   Language name header.
    *   Copy-to-clipboard button.
    *   Collapsible content.
    *   Direction control (LTR/RTL).
*   **Theme Switching:** Easily toggle between Light and Dark modes.
*   **Text Direction Control:** Set the overall text direction (LTR/RTL) for the output panel.
*   **Persistence:** Your input text, theme preference, auto-render setting, and direction settings are saved in your browser's `localStorage` and persist between sessions.
*   **Client-Side Only:** Runs entirely in your browser; no server or internet connection is required after the initial page load (excluding CDN dependencies).
*   **Responsive Design:** Adapts to different screen sizes, stacking panels vertically on smaller devices.

## Getting Started

This is a single-page application (SPA) that runs entirely in the browser.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/matinkg/markdown-renderer.git
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd markdown-renderer
    ```
3.  **Open `index.html`:** Simply open the `index.html` file in your preferred web browser.

That's it! The application will load and be ready to use. (Or, try the [Live Demo](https://matinkg.github.io/markdown-renderer/)!)

## Technologies Used

*   **HTML5:** Structure of the web page.
*   **CSS3:** Styling, layout, and theming.
*   **JavaScript (ES6+):** Core logic, DOM manipulation, event handling, feature implementation.
*   **[Marked.js](https://marked.js.org/):** Markdown parsing library.
*   **[Highlight.js](https://highlightjs.org/):** Syntax highlighting for code blocks.
*   **[Bootstrap 5.3](https://getbootstrap.com/):** UI framework for styling, grid system, and components.
*   **[Bootstrap Icons](https://icons.getbootstrap.com/):** Icon library used throughout the interface.
*   **[Google Fonts (Vazirmatn)](https://fonts.google.com/specimen/Vazirmatn):** Custom font for better readability.


## Customization

*   **Styling:** Modify `style.css` to change colors, fonts, layout, and overall appearance using CSS variables or direct styling.
*   **Behavior:** Edit `script.js` to alter features, add new functionalities, change debounce timing, modify keyboard shortcuts, or adjust how syntax is applied.
*   **Dependencies:** Update or change CDN links in `index.html` for `marked.js`, `highlight.js`, Bootstrap, or other libraries.

## License

This project is licensed under the MIT License.