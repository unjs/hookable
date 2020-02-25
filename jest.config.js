module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
}
