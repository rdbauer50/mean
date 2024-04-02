var path = require('path');
var glob = require('glob');

// Load server api routes
function loadRoutes(mean) {
	glob(path.join(mean.basedir, 'server', '*', 'routes', '*.js'), null, function(error, files) {
		// find home index
		var indexFile = null;
		for(var i = 0; i < files.length; i ++) {
			if(files[i].indexOf('home') !== -1) {
				if(files[i].indexOf('index') !== -1) {
					indexFile = files.splice(i, 1)[0];
					break;
				}
			}
		}
		for(var f = 0; f < files.length; f++) {
			require(files[f])(mean.app);
		}
		require(indexFile)(mean.app);
	});
	
}

module.exports = loadRoutes;