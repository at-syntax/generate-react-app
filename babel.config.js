module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        modules: "cjs", // Default to CommonJS
        targets: {
          node: "16", // Support Node.js 16+
        },
      },
    ],
    "@babel/preset-typescript",
  ],
  env: {
    esm: {
      presets: [
        [
          "@babel/preset-env",
          {
            modules: "auto", // Preserve ES modules for minified ESM build
            targets: {
              node: "16",
              esmodules: true,
            },
          },
        ],
        "@babel/preset-typescript",
      ],
    },
    "esm-production": {
      presets: [
        [
          "@babel/preset-env",
          {
            modules: "auto", // Preserve ES modules for minified ESM build
            targets: {
              node: "16",
              esmodules: true,
            },
          },
        ],
        "@babel/preset-typescript",
        [
          "minify",
          {
            builtIns: false, // Preserve built-ins for Node.js compatibility
            evaluate: false, // Safer for CLI tools
            mangle: true, // Keep function names readable for debugging
          },
        ],
      ],
    },
    production: {
      presets: [
        [
          "@babel/preset-env",
          {
            modules: "cjs",
            targets: {
              node: "16",
            },
          },
        ],
        "@babel/preset-typescript",
        [
          "minify",
          {
            builtIns: false, // Preserve built-ins for Node.js compatibility
            evaluate: false, // Safer for CLI tools
            mangle: true, // Keep function names readable for debugging
          },
        ],
      ],
    },
  },
};
