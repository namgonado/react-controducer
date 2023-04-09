'use strict';

const path = require('path');
const webpack = require('webpack');

module.exports = {
	devtool: 'source-map',
	performance: { hints: false },

	entry: path.resolve(__dirname, 'src', 'index.js'),

	output: {
		// The name under which the editor will be exported.
		library: 'react-controducer',

		path: path.resolve(__dirname, 'dist'),
		globalObject: 'this',
		filename: 'index.js',
		libraryTarget: 'umd',
		clean: true
	},
	resolve: {
		modules: [path.resolve(__dirname, 'node_modules')]
	},
	externals: {
		react: "react",
		lodash: "lodash"
	},

/* 	optimization: {
		minimizer: [
			new TerserWebpackPlugin({
				sourceMap: true,
				terserOptions: {
					output: {
						// Preserve CKEditor 5 license comments.
						comments: /^!/
					}
				},
				extractComments: false
			})
		]
	}, */

	module: {
		rules: [
			{
				test: /\.(jsx|js)$/,
				include: path.resolve(__dirname, 'src'),
				exclude: /node_modules/,
				use: [{
					loader: 'babel-loader',
					options: {
						presets: [
							['@babel/preset-env', {
								"targets": "node 12"
							}],
							'@babel/preset-react'
						]
					}
				}]
			}
		]
	}
};
