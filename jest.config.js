module.exports = {
  'testEnvironment': 'node',
  'collectCoverage': true,
  'collectCoverageFrom': [
    'lib/**/*.js'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
}
