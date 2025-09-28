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

## Development

This project is built with modern web technologies and follows best practices for maintainability:

### Project Structure
```
├── index.html          # Main HTML structure with comprehensive comments
├── script.js           # Main application logic (fully documented)
├── markdown-renderer.js # Markdown rendering module
├── style.css           # Comprehensive styling with CSS variables
├── package.json        # Dependencies and build scripts
├── vite.config.js      # Build configuration
└── README.md           # This file
```

### Code Documentation

All files include comprehensive comments explaining:
- **HTML**: Structure, accessibility, and component purposes
- **JavaScript**: Function documentation with JSDoc, algorithm explanations
- **CSS**: Section organization, variable usage, responsive design patterns
- **Configuration**: Build setup and deployment settings

### Key Features Documented

1. **Multi-file System**: Tab-based file management with localStorage persistence
2. **Markdown Rendering**: Math support (KaTeX) and syntax highlighting (highlight.js)
3. **Theme System**: CSS custom properties for light/dark mode switching
4. **Direction Controls**: LTR/RTL support for multilingual content
5. **Code Enhancement**: Interactive code blocks with copy and collapse features
6. **Responsive Design**: Mobile-first approach with flexible layouts

## Contributing

Contributions are welcome! The codebase is thoroughly documented to help new contributors understand the architecture and make meaningful contributions.

### Getting Started for Contributors

1. **Fork and clone** the repository
2. **Read the code comments** - they explain the purpose and functionality of each component
3. **Install dependencies**: `npm install`
4. **Start development server**: `npm run dev`
5. **Make changes** following the existing code style and documentation patterns
6. **Test thoroughly** across different browsers and screen sizes
7. **Submit a pull request** with clear description of changes

### Code Style Guidelines

- **Comprehensive commenting**: Document all functions, complex logic, and architectural decisions
- **Consistent naming**: Use descriptive variable and function names
- **Modular structure**: Keep functions focused on single responsibilities
- **Accessibility**: Maintain ARIA labels and semantic HTML
- **Performance**: Consider debouncing for user input and efficient DOM operations

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.