'use strict';

const _ = require('lodash');
const projectChecks = require('./util/project-checks');

module.exports = {
  onLoad,
};

function onLoad(projectPaths, provider) {
  const angularProjects = _.filter(projectPaths, (projectPath) => {
    return projectChecks.isAngularCliProject(projectPath);
  });

  if (angularProjects.length === 0 || !provider) {
    return;
  }

  provider.loadCompletions(angularProjects);
}
