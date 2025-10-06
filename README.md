# @atsyntax/generate-react-app

A powerful CLI tool to scaffold fully configured React libraries with modern tooling and best practices. Choose between TypeScript or JavaScript, multiple bundlers, and get a production-ready setup in seconds.

[![npm version](https://badge.fury.io/js/%40atsyntax%2Fgenerate-react-app.svg)](https://www.npmjs.com/package/@atsyntax/generate-react-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- **Multiple Language Support**: Choose between TypeScript and JavaScript
- **Modern Bundlers**: Support for Rollup, Webpack, and Vite
- **Package Manager Freedom**: Works with npm, Yarn, pnpm, and Bun
- **Testing Ready**: Pre-configured Jest with React Testing Library
- **Code Quality**: ESLint, Prettier, and Git hooks with Lefthook
- **GitHub Integration**: Automatic repository URL detection and setup
- **Production Ready**: Optimized build configurations for publishing

## 🚀 Quick Start

```bash
# Using npx (recommended)
npx @atsyntax/generate-react-app my-react-library

# Using npm
npm install -g @atsyntax/generate-react-app
generate-react-app my-react-library

# Using yarn
yarn global add @atsyntax/generate-react-app
generate-react-app my-react-library
```

## 📋 Interactive Setup

The CLI will guide you through an interactive setup process:

```sh
✔ What is the name of the project? … my-awesome-component
✔ What is the description for the project? … An awesome React component
✔ What is the name of project author? … John Doe
✔ What is the email address for the project author? … john@example.com
✔ What is the URL for the project author? … https://github.com/johndoe
✔ What is the URL for the repository? … https://github.com/johndoe/my-awesome-component
✔ Which language do you prefer? › TypeScript
✔ Which bundler would you like to use? › Rollup
✔ Which package manager would you like to use? › npm
```

## 🛠 Available Options

### Languages

- **JavaScript**: Modern ES6+ with Babel
- **TypeScript**: Full TypeScript support with type definitions

### Bundlers

- **Rollup**: Optimized for libraries (default)
- **Webpack**: Full-featured bundler
- **Vite**: Fast build tool with HMR

### Package Managers

- **npm**: Node Package Manager
- **yarn**: Fast, reliable package manager
- **pnpm**: Efficient disk space usage
- **bun**: Ultra-fast JavaScript runtime and package manager

## 📂 Generated Project Structure

```txt
my-react-library/
├── src/
│   ├── __tests__/
│   │   └── index.test.tsx
│   ├── index.tsx
│   └── setupTests.ts
├── lib/                    # Build output
├── .vscode/
│   └── settings.json
├── .gitignore
├── .prettierignore
├── eslint.config.mjs
├── jest.config.js
├── lefthook.yml
├── package.json
├── prettier.config.js
├── (rollup | webpack | vite).config.mjs
├── tsconfig.json
└── README.md
```

## 🔧 CLI Options

You can skip the interactive prompts by providing options directly:

```bash
generate-react-app my-library \
  --slug "my-awesome-library" \
  --description "An awesome React library" \
  --author-name "John Doe" \
  --author-email "john@example.com" \
  --author-url "https://github.com/johndoe" \
  --repo-url "https://github.com/johndoe/my-awesome-library" \
  --language typescript \
  --bundler rollup \
  --package-manager npm
```

### Available CLI Options

| Option              | Description                         | Type   | Choices                      |
| ------------------- | ----------------------------------- | ------ | ---------------------------- |
| `--slug`            | Name of the project                 | string | -                            |
| `--description`     | Description of the project          | string | -                            |
| `--author-name`     | Name of the project author          | string | -                            |
| `--author-email`    | Email address of the project author | string | -                            |
| `--author-url`      | URL for the project author          | string | -                            |
| `--repo-url`        | URL for the repository              | string | -                            |
| `--language`        | Language for the project            | string | `javascript`, `typescript`   |
| `--bundler`         | Bundler to use                      | string | `rollup`, `webpack`, `vite`  |
| `--package-manager` | Package manager to use              | string | `npm`, `yarn`, `pnpm`, `bun` |

## 📦 What's Included

### Development Tools

- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Code formatting with consistent style
- **Lefthook**: Git hooks for pre-commit and pre-push validation
- **Jest**: Testing framework with React Testing Library
- **TypeScript**: (when selected) Full type checking and IntelliSense

### Build Configuration

- **Rollup/Webpack/Vite**: Optimized bundling for libraries
- **Babel**: Modern JavaScript transpilation
- **Source Maps**: For better debugging experience
- **Declaration Files**: TypeScript type definitions for consumers

### Package Configuration

- **Dual Package**: CommonJS and ESM builds
- **Tree Shaking**: Optimized for modern bundlers
- **Peer Dependencies**: React and ReactDOM as peer deps
- **Publishing Ready**: Pre-configured for npm publishing

## 🚀 Development Workflow

After generating your project:

```bash
cd my-react-library

# Install dependencies (automatically done during generation)
npm install

# Start development
npm run build:watch

# Run tests
npm test

# Type checking (TypeScript projects)
npm run type-check

# Lint your code
npm run lint

# Format your code
npm run format

# Build for production
npm run build
```

## 🔍 Example Component

The generated project includes a sample component:

```tsx
import React, { ReactNode } from "react";

export interface MyComponentProps {
  children?: ReactNode;
  className?: string;
}

const MyComponent: React.FC<MyComponentProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={`my-component ${className || ""}`} {...props}>
      <h2>My Awesome Project</h2>
      <p>A React component Project</p>
      {children}
    </div>
  );
};

export default MyComponent;
```

## 🧪 Testing

The generated project includes comprehensive testing setup:

```tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import MyComponent from "../index";

describe("MyComponent", () => {
  it("renders without crashing", () => {
    render(<MyComponent />);
    expect(screen.getByText("My Awesome Project")).toBeInTheDocument();
  });
});
```

## 🔗 Git Integration

The tool automatically:

- Initializes a Git repository
- Creates an initial commit
- Detects GitHub username from Git config
- Suggests repository URLs based on author info

## 🎯 Best Practices

The generated projects follow React library best practices:

- **Peer Dependencies**: React as peer dependency to avoid version conflicts
- **Tree Shaking**: ESM builds for optimal bundle sizes
- **Type Safety**: Full TypeScript support when selected
- **Testing**: Comprehensive test setup with React Testing Library
- **Code Quality**: ESLint and Prettier configurations
- **Git Hooks**: Automated code quality checks before commits

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Create React App and other scaffolding tools
- Built with modern JavaScript tooling and best practices
- Community feedback and contributions

---

**Happy coding!** 🚀

For more information, visit the [GitHub repository](https://github.com/at-syntax/generate-react-app).
