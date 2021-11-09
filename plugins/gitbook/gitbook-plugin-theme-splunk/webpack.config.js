const path = require('path')
module.exports = {
  entry: {
    theme: path.join(__dirname, '/src/js/theme/index.js'),
    gitbook: path.join(__dirname, '/src/js/core/index.js'),
    style: path.join(__dirname, '/src/scss/website.scss')
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '/_assets/website')
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'style.css'
            }
          },
          'sass-loader'
        ]
      }
    ]
  }
}
