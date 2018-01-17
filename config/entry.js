/*
 * This script adds files to webpack's dependency graph
 *
 * By adding it as an entry point in development mode,
 * webpack-dev-server can watch additional static files during development
 * It is preconfigured to import all html and nunjucks files in the /src/views folder
 */

VIEWS.forEach(view => {
	require(PATH + '/' + view);
});
