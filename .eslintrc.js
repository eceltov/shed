module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: [
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'airbnb',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
  },
  plugins: [
    'react',
  ],
  rules: {
    'brace-style': ['error', 'stroustrup'],
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-console': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-no-undef': 'off',
    'no-alert': 'off',
    'react/destructuring-assignment': ['error', 'never'],
    'jsx-a11y/click-events-have-key-events': 'off', // fix this by adding full keyboard support
    'react/forbid-prop-types': 'off', // fix this by replacing objects with shapes
    'react/sort-comp': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'function-paren-newline': ['error', 'consistent'],
    'function-call-argument-newline': ['error', 'never'],
    'jsx-a11y/control-has-associated-label': 'off',
    'react/prop-types': 'off',
    'prefer-destructuring': 'off',
    'react/prefer-stateless-function': 'off',
    'no-param-reassign': 'off',
    'no-plusplus': 'off',
    'no-continue': 'off',
  },
};
