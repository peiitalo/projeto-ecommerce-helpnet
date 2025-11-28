export default {
  testEnvironment: 'node',
  testMatch: [
    '**/src/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/tests/**',
    '!src/scripts/**',
    '!src/config/**'
  ]
};