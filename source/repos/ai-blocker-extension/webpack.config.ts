import path from "path";
import CopyPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { Configuration } from "webpack";

export default (env: { firefox?: boolean } = {}): Configuration => ({
  mode: "development",
  devtool: "cheap-module-source-map",
  entry: {
    "background/service-worker": "./src/background/service-worker.ts",
    "content/index": "./src/content/index.ts",
    "popup/index": "./src/popup/index.tsx",
  },
  output: {
    path: path.resolve(__dirname, env.firefox ? "dist/firefox" : "dist/chrome"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
      { test: /\.css$/, use: ["style-loader", "css-loader"] },
    ],
  },
  resolve: { extensions: [".ts", ".tsx", ".js"] },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: env.firefox ? "manifest.firefox.json" : "manifest.json",
          to: "manifest.json",
        },
        { from: "assets", to: "assets", noErrorOnMissing: true },
      ],
    }),
    new HtmlWebpackPlugin({
      template: "public/popup.html",
      filename: "popup/index.html",
      chunks: ["popup/index"],
    }),
  ],
});
