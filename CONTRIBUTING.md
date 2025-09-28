# Contributing to Markdown Renderer

Thank you for your interest in contributing to this project! This guide will help you understand the codebase and make meaningful contributions.

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Basic understanding of HTML, CSS, and JavaScript
- Familiarity with ES6 modules and modern web APIs

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/markdown-renderer.git
   cd markdown-renderer
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 📚 Understanding the Codebase

This project is thoroughly documented to help contributors understand the architecture:

### File Structure & Documentation

- **`index.html`**: Complete HTML structure with detailed comments explaining each section
- **`script.js`**: Main application logic with JSDoc comments for every function
- **`markdown-renderer.js`**: Rendering engine with step-by-step processing documentation
- **`style.css`**: Comprehensive CSS with section headers and variable explanations
- **`vite.config.js`**: Build configuration with deployment notes

### Key Architecture Concepts

#### 1. **Multi-File System**
```javascript
// Files are stored as objects with ID-based keys
files = {
  1640995200000: {
    id: 1640995200000,
    name: "My Document",
    content: "# Hello World"
  }
}
```

#### 2. **Theme System**
CSS custom properties enable seamless theme switching:
```css
:root {
  --body-bg: #ffffff;
  --body-color: #212529;
  /* Light theme colors */
}

html[data-bs-theme="dark"] {
  --body-bg: #212529;
  --body-color: #dee2e6;
  /* Dark theme overrides */
}
```

#### 3. **Markdown Processing Pipeline**
1. Extract math expressions (protect from markdown parsing)
2. Parse markdown to HTML
3. Restore and render math expressions with KaTeX
4. Apply syntax highlighting to code blocks
5. Enhance code blocks with interactive features

#### 4. **Direction Control System**
Supports LTR/RTL text for multilingual content:
- General text direction
- Inline code direction
- Code block direction

## 🛠️ Development Guidelines

### Code Style

1. **Comprehensive Documentation**
   - Document all functions with JSDoc
   - Explain complex algorithms inline
   - Add section headers to organize code

2. **Consistent Naming**
   - Use descriptive function and variable names
   - Follow camelCase for JavaScript, kebab-case for CSS
   - Prefix boolean variables with `is`, `has`, `should`, etc.

3. **Modular Functions**
   - Keep functions focused on single responsibilities
   - Use pure functions where possible
   - Avoid deep nesting

### Example of Well-Documented Function

```javascript
/**
 * Enhances code blocks with interactive features
 * 
 * This function transforms plain <pre><code> elements into enhanced blocks with:
 * - Language identification and display
 * - Copy-to-clipboard functionality
 * - Collapsible content
 * 
 * @param {string} direction - Current code direction (ltr/rtl)
 */
function enhanceCodeBlocks(direction) {
    // Implementation with inline comments explaining each step
}
```

## 🎯 Contribution Areas

### High-Impact Contributions

1. **Performance Optimizations**
   - Improve rendering speed for large documents
   - Optimize memory usage in multi-file scenarios
   - Enhance mobile performance

2. **Accessibility Improvements**
   - Add keyboard navigation for tabs
   - Improve screen reader support
   - Enhance focus management

3. **Feature Enhancements**
   - Export functionality (PDF, HTML)
   - Import from various formats
   - Plugin system for extensions
   - Collaborative editing features

4. **Mobile Experience**
   - Touch-friendly interactions
   - Responsive layout improvements
   - Mobile-specific UI patterns

### Bug Fixes and Maintenance

1. **Cross-browser Compatibility**
   - Test in different browsers
   - Fix vendor-specific issues
   - Polyfill missing features

2. **Edge Cases**
   - Handle malformed markdown gracefully
   - Improve error recovery
   - Fix memory leaks

## 🧪 Testing Guidelines

### Manual Testing Checklist

- [ ] **Multi-file functionality**: Create, rename, delete, switch files
- [ ] **Theme switching**: Light/dark mode transitions
- [ ] **Direction controls**: LTR/RTL for all content types
- [ ] **Responsive design**: Test on various screen sizes
- [ ] **Code blocks**: Copy functionality, collapse/expand
- [ ] **Math rendering**: Inline and display math expressions
- [ ] **Local storage**: Persistence across browser sessions
- [ ] **Accessibility**: Keyboard navigation and screen readers

### Browser Testing

Test in at least:
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (if on macOS)
- Edge (latest)

## 📝 Submitting Contributions

### Pull Request Guidelines

1. **Clear Description**
   - Explain what changes you made and why
   - Reference any related issues
   - Include screenshots for UI changes

2. **Code Quality**
   - Follow existing documentation patterns
   - Add comments for new functionality
   - Ensure responsive design works

3. **Testing**
   - Test your changes thoroughly
   - Check cross-browser compatibility
   - Verify accessibility isn't broken

### Commit Message Format

```
type(scope): brief description

Detailed explanation of changes made,
why they were necessary, and any
breaking changes or considerations.

Fixes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🤝 Community Guidelines

- Be respectful and constructive in discussions
- Help others understand the codebase
- Share knowledge about web development best practices
- Consider the impact on all users (different devices, abilities, languages)

## 📞 Getting Help

- **Issues**: Use GitHub issues for bug reports and feature requests
- **Discussions**: Start discussions for questions and ideas
- **Code Review**: Don't hesitate to ask for feedback on complex changes

## 🙏 Recognition

Contributors will be:
- Listed in the project's contributors section
- Credited in release notes for significant contributions
- Given collaborator access for ongoing contributors

Thank you for contributing to making this markdown editor better for everyone! 🎉