const glob = require("glob"); // select many files at once
const webpack = require("webpack") // default webpack plugins
const path = require("path");
const ExtractTextPlugin = require("extract-text-webpack-plugin"); // extract css to seperate file
const PurifyCSSPlugin = require("purifycss-webpack"); // remove unused css
const CleanWebpackPlugin = require("clean-webpack-plugin"); // clean folder
const UglifyWebpackPlugin = require("uglifyjs-webpack-plugin"); // minify JS
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin"); // minify CSS
const cssnano = require("cssnano") // css minification processor
const BrowserSyncPlugin = require("browser-sync-webpack-plugin"); // browser sync
const HtmlWebpackPlugin = require("html-webpack-plugin"); // generate html files

/*
 * Setup hot-reloading dev-server
 */
exports.devServer = ({host, port} = {}) => ({
	devServer: {
		stats: "errors-only",
		host, // Defaults to `localhost`
		port, // Defaults to 8080
		overlay: {
			errors: true,
			warnings: true,
		},
		hot: true,
	},
	plugins: [
		new webpack.NamedModulesPlugin(),
		new webpack.HotModuleReplacementPlugin(),
	]
});

/*
 * Postcss loader with autoprefixing
 * autoprefix plugin is defined in package.json to fix
 * "No PostCSS config found" error when including external libraries
 * see: https://github.com/postcss/postcss-loader/issues/92#issuecomment-276036682
 */
exports.autoprefix = () => ({
	loader: "postcss-loader"
});

/* ES6 loader
 *
 */
exports.loadJS = () => ({
	module: {
		rules: [
			{
  			test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: "babel-loader",
					options: {
						presets: ['es2015'],
					}
				}
			},
    ],
	},
});

/*
 * Html loader
 * Copies html files from /dist to /src
 * Ignores files preceded by an underscore (_)
 */
exports.loadHTML = ({ parent } = {}) => {
	// search all html files
	const pages = glob.sync(
		'**/*.html', {
			cwd: parent,
			nomount: true,
			nodir: true,
			ignore: '**/_*',
		}
	);

	// load HtmlWebpackPlugin for every page
	plugins = pages.map(
		page => new HtmlWebpackPlugin({
			filename: page,
			template: path.join(parent, page),
		})
	);

	return {
		module: {
			rules: [
				{
					test: /\.html$/,
					exclude: /node_modules/,
					use: 'html-loader',
				}],
		},
		plugins: plugins
	}
}

/*
 * Nunjucks loader
 * Builds nunjucks files and copies them to /src
 * Ignores files preceded by an underscore (_)
 */
exports.loadNunjucks = ({ parent } = {}) => {
	// search all html files
	const pages = glob.sync(
		'**/*.njk', {
			cwd: parent,
			nomount: true,
			nodir: true,
			ignore: '**/_*',
		}
	);

	// load HtmlWebpackPlugin for every page
	// see: https://github.com/xiao555/nunjucks-extend-loader
	// and: https://github.com/ryanhornberger/nunjucks-html-loader
	plugins = pages.map(
		page => new HtmlWebpackPlugin({
			filename: page.replace('.njk', '.html'),
			template: path.join(parent, page),
		})
	);

	return {
		module: {
			rules: [
				{
					test: /\.(njk|nunjucks)$/,
					use: [
						'html-loader',
						{
							loader: 'nunjucks-html-loader',
							options: {
								context: parent,
								searchPaths: [parent],
							}
						}
					]
				}],
		},
		plugins: plugins,
	}
}

/*
 * Style loader
 */
exports.loadCSS = ({include,exclude} = {}) => ({
	module: {
		rules: [
			{
  			test: /\.s?css$/,
				include,
				exclude,
				use: [
					"style-loader",
					"css-loader",
					exports.autoprefix,
					"sass-loader"
				],
			},
    ],
	},
});

/*
 * Style loader - extracts to a seperate css file
 */
exports.extractCSS = ({include, exclude} = {}) => {
	const plugin = new ExtractTextPlugin({
		allChunks: true,
		filename: "[name].[contenthash:8].css",
	});

	return {
		module: {
			rules: [
				{
					test: /\.s?css$/,
					include,
					exclude,
					use: plugin.extract({
						use: ["css-loader", exports.autoprefix, "sass-loader"],
						fallback: "style-loader",
					}),
        },
      ],
		},
		plugins: [plugin],
	};
};

/*
 * Remove unused css
 */
exports.purifyCSS = ({ paths }) => ({
  plugins: [new PurifyCSSPlugin({ paths })],
});

/*
 * Image and font loader
 */
exports.loadAssets = ({ include, exclude, limit, name } = {}) => ({
  module: {
		rules: [
			{
				test: /\.(ttf|eot|woff2?|png|jpe?g|gif|svg|ico)$/,
				include,
				exclude,
				use: {
					loader: "url-loader",
					options: {
						name: '[path]' + name,
						limit,
					}
				},
			},
			{
        test: /\.(ttf|eot|woff2?|png|jpe?g|gif|svg|ico)$/,
        include: /node_modules/,
				exclude,
        use: {
					loader: "url-loader",
					options: {
						outputPath: 'assets/vendor/',
						name: name,
						limit,
					}
				},
			}
		],
	},
});

/*
 * Generate source maps
 */
exports.generateSourceMaps = ({ type }) => ({
  devtool: type,
});

/*
 * Split bundles
 */
exports.extractBundles = bundles => ({
	plugins: bundles.map(
		bundle => new webpack.optimize.CommonsChunkPlugin(bundle)
	),
});

/*
 * Clean a folder
 */
exports.clean = ({ path, root } = {}) => ({
	plugins: [
		new CleanWebpackPlugin(
			[path],
			{
				root: root
			}
		)
	],
});

/*
 * Minfiy JS
 */
exports.minifyJavaScript = ( options = {}) => ({
	plugins: [
		new UglifyWebpackPlugin(options)
	],
});

/*
 * Minify CSS
 */
exports.minifyCSS = ( options = {}) => ({
	plugins:[
		new OptimizeCSSAssetsPlugin({
			cssProcessor: cssnano,
			cssProcessorOptions: options,
			canPrint: false,
		}),
	],
});

/*
 * Browsersync proxy
 */
exports.browserSync = ( options = {} ) => ({
	plugins: [
    new BrowserSyncPlugin(
			// BrowserSync options
			options,
			// plugin options
			{
				// prevent BrowserSync from reloading the page
				// and let Webpack Dev Server take care of this
				reload: false
			}
    )
  ]
});

/*
 * Dynamically add entries
 * Depends on entry.js
 * Should be rewritten as a plugin
 */
exports.addEntries = ({ script, path }) => {

	const pages = glob.sync(
		'**/*.+(njk|html)', {
			cwd: path,
			nomount: true,
			nodir: true,
			ignore: '**/_*',
		}
	);
		
	return {
		entry: {
			development: script
		},
		plugins: [
			new webpack.DefinePlugin({
				VIEWS: JSON.stringify(pages),
				PATH: JSON.stringify(path),
			})
		]
	}
};
