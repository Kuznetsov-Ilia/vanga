import resolve from 'rollup-plugin-node-resolve';
export default {
  entry: 'src/index.js',
  dest: 'index.js',
  format: 'cjs',
  plugins: [
    resolve({jsnext: true})
  ]
};
