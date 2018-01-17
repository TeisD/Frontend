const path = require("path");
const webpack = require("webpack");
const glob = require("glob"); // select many files at once
const merge = require("webpack-merge"); // merge configuration files
const HtmlWebpackPlugin = require("html-webpack-plugin"); // generate html files

const parts = require("./config/webpack.parts"); // reusable configuration parts

const PATHS = {
  app: path.join(__dirname, "src"),
  build: path.join(__dirname, "dist"),
};

const config = merge([
	// application-specific configuration
	{
		context: PATHS.app,
		target: 'web',
		entry: {
			app : "./js/main.js",
		},
		output: {
			path: PATHS.build,
			filename: "[name].js",
		},
		plugins: [
			new webpack.NamedModulesPlugin(),
		],
	},
	// load reusable parts
	parts.loadHTML({
		parent: path.join(PATHS.app, "views"),
	}),
	parts.loadNunjucks({
		parent: path.join(PATHS.app, "views"),
	}),
	parts.clean({
		path: PATHS.build,
		root: __dirname
	}),
]);

const productionConfig = merge([
	{
		output: {
			chunkFilename: "[name].[chunkhash:8].js",
			filename: "[name].[chunkhash:8].js",
		},
	},
	parts.minifyJavaScript({
		sourceMap: true,
	}),
	parts.minifyCSS({
		discardComments: {
			removeAll: true,
		},
		safe: true,
		sourceMap: true,
		map: {
			inline: false
		},
	}),
	parts.extractCSS(),
	parts.purifyCSS({
    paths: glob.sync(`${PATHS.app}/**/*.js`, { nodir: true }),
  }),
	parts.loadAssets({
      limit: 4096,
			name: '[name].[hash:8].[ext]',
  }),
	parts.generateSourceMaps({ type: "source-map" }),
	parts.extractBundles([
		{
			name: "vendor",
			minChunks: ({ resource }) => /node_modules/.test(resource),
		},
		{
			name: "manifest",
			minChunks: Infinity,
		},
	]),
]);

const developmentConfig = merge([
	{
		bail: false,
	},
	parts.browserSync({
		host: 'localhost',
		port: 3000,
		// proxy the Webpack Dev Server endpoint
		// (which should be serving on http://localhost:3100/)
		// through BrowserSync
		proxy: 'http://localhost:3100/',
	}),
  parts.devServer({
		// will be proxied to browsersync at localhost:3000
    port: 3100,
  }),
	parts.loadCSS(),
	parts.loadAssets(),
	parts.generateSourceMaps({
    type: "cheap-module-eval-source-map"
  }),
	parts.addEntries({
		script: '../config/entry.js',
		path: path.join(PATHS.app, "views"),
	})
]);

module.exports = env => {
  if (env === "production") {
    return merge(config, productionConfig);
  }

  return merge(config, developmentConfig);
};

