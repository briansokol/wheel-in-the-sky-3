Use Vitest for unit tests. Do not use Jest.
Vitest functions are globals. Wrap tests with describe() and it(), and not test().
React component tests should use React Testing Library.
Instead of using the destructured return from Testing Library's render() function, use the screen object instead.
Try to avoide direct DOM node access in tests, and use Testing Library functions only.
