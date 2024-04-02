var path = require('path');

function loadConfig(mean) {
	var config = require(path.join(mean.basedir, 'config', 'mean'));
	mean.config = config;
}

module.exports = loadConfig;