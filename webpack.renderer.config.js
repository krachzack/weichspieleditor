const VueLoaderPlugin = require('vue-loader/lib/plugin')
const rules = require('./webpack.rules')

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

rules.push({
  test: /\.vue$/,
  use: [{ loader: 'vue-loader' }]
})

rules.push({
  test: /\.(ttf|otf|eot|woff|woff2)$/,
  use: {
    loader: 'file-loader'
  }
})

module.exports = {
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins: [
    new VueLoaderPlugin()
  ]
};
