# Contributing to Wheel in the Sky

Thank you for your interest in contributing to this project! This document outlines the process for contributing, whether you're reporting bugs, suggesting enhancements, or submitting code changes.

## Bug Reports

We appreciate detailed bug reports as they help us improve the project. Before filing a bug report:

1. **Search existing issues** - Check the [Issues](/briansokol/wheel-in-the-sky-3/issues) section to see if your bug has already been reported.
2. **Check for recent changes** - Review recent commits and releases to see if your issue has been addressed.

When reporting a bug, please include:

- A clear, descriptive title
- A detailed description of the issue
- Steps to reproduce the problem
- Expected vs. actual behavior
- Environment details (OS, browser, etc.)
- Screenshots or code samples if applicable

## Pull Requests

We welcome code contributions! To ensure a smooth review process:

### Prerequisites

- Ensure you have **git hooks enabled** for pre-commit checks. If you're unsure, run the following command:

    ```bash
    npm run prepare
    ```

    - Make sure your IDE is set up to run git hooks if you're using a GUI to handle commits (We recommend using Visual Studio Code).

- Make sure your changes include appropriate **unit tests**
    - Add new tests for new functionality
    - Update existing tests for modified functionality
    - Ensure all tests pass before submitting

### PR Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes with a meaningful commit message
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### PR Requirements Checklist

- [ ] Git hooks are enabled and pass
- [ ] Unit tests are added/updated and passing
- [ ] Documentation updated if needed
- [ ] Code follows project coding standards
- [ ] PR has a clear description of changes

## Coding Standards

Please adhere to the coding conventions used throughout the project:

- Follow existing patterns for TypeScript typing
- Use private/public modifiers for class methods and properties
- Include JSDoc comments for functions and classes
- Comment complex logic for better readability

## Communication

Feel free to ask questions or discuss ideas before implementing major changes. You can:

- Open an issue for discussion
- Comment on existing issues
- Reach out through other project communication channels

Thank you for contributing!
