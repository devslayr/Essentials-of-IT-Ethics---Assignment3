const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/client/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist/client'),
    filename: 'bundle.[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@client': path.resolve(__dirname, 'src/client'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
              api: 'modern',
              sassOptions: {
                // Any additional Sass options if needed
              },
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|mp3|wav)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/client/index.html',
      title: 'Chess Platform',
    }),
  ],
  devServer: {
    static: './dist/client',
    port: 3000,
    hot: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://localhost:3001',
        secure: false,
        changeOrigin: true,
      },
      {
        context: ['/socket.io'],
        target: 'http://localhost:3001',
        ws: true,
        secure: false,
        changeOrigin: true,
      },
    ],
  },
};
