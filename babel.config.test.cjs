// Simplified Babel Configuration for Testing
module.exports = {
  presets: [
    ["@babel/preset-env", { 
      targets: { node: "current" },
      modules: "commonjs"
    }]
  ],
  plugins: [],
  env: {
    test: {
      presets: [
        ["@babel/preset-env", { 
          targets: { node: "current" },
          modules: "commonjs"
        }]
      ]
    }
  }
};
