import resolve from 'rollup-plugin-node-resolve';
export default {
  entry: 'index.es',
  dest: 'index.js',
  format: 'cjs',
  plugins: [
    resolve({jsnext: true})
  ]
};
