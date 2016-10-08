'use strict';

const _ = require('lodash');
const projectChecks = require('./util/project-checks');

module.exports = {
  onLoad,
};

function onLoad(projectPaths, provider) {
  const isAngular = _.some(projectPaths, (projectPath) => {
    return projectChecks.isAngularCliProject(projectPath);
  });

  if (!isAngular || !provider) {
    return;
  }

  provider.loadCompletions();
}
