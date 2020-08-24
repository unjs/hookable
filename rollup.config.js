import babel from '@rollup/plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

const extensions = ['.js', '.ts', '.tsx']

export default [
  {
    input: './src/hookable.ts',
    output: { file: './dist/hookable.js', format: 'cjs' },
    plugins: [
      resolve({ extensions }),
      babel({
        extensions,
        presets: [
          '@babel/preset-typescript'
        ]
      })
    ]
  },
  {
    input: './src/hookable.ts',
    output: { name: 'hookable', file: './dist/hookable.min.js', format: 'umd' },
    plugins: [
      resolve({ extensions }),
      babel({
        extensions,
        presets: [
          ['@babel/preset-env', {
            targets: { ie: '11' },
            exclude: ['@babel/plugin-transform-regenerator']
          }],
          '@babel/preset-typescript'
        ]
      }),
      terser()
    ]
  }
]
