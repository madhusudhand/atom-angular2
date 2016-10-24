'use strict';

const _ = require('lodash');
const projectChecks = require('./util/project-checks');

module.exports = {
  onLoad,
  onDidChangePaths,
};

function filterProjects(projectPaths) {
  return _.filter(projectPaths, (projectPath) => {
    return projectChecks.isAngularCliProject(projectPath);
  });
}

function onLoad(projectPaths, provider) {
  const angularProjects = filterProjects(projectPaths);

  if (angularProjects.length === 0 || !provider) {
    return;
  }

  provider.loadCompletions(angularProjects);
}

// TODO: INDEX NEWLY ADDED PROJECTS ONLY.
//       UPDATE indexData WHEN A PROJECT IS REMOVED
function onDidChangePaths(projectPaths, provider) {
  onLoad(projectPaths, provider);
}
