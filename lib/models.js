function loadModels(mean) {
	for(var m = 0; m < mean.config.models.length; m++) {
		require(mean.config.models[m].path);
		mean.models.push(mean.config.models[m].name);
	}
}

module.exports = loadModels;