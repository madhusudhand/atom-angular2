'use strict';

const _ = require('lodash');
const projectChecks = require('./util/project-checks');

module.exports = {
  onLoad,
  onDidChangePaths,
  onDidChangeFiles,
};

function filterProjects(projectPaths) {
  return _.filter(projectPaths, (projectPath) => {
    return projectChecks.isAngularCliProject(projectPath);
  });
}

function onLoad(projectPaths, provider, statusBarTile) {
  const angularProjects = filterProjects(projectPaths);

  if (angularProjects.length === 0 || !provider) {
    return;
  }

  provider.loadCompletions(angularProjects, statusBarTile);
}

// TODO: INDEX NEWLY ADDED PROJECTS ONLY.
//       UPDATE indexData WHEN A PROJECT IS REMOVED
function onDidChangePaths(projectPaths, provider, statusBarTile) {
  onLoad(projectPaths, provider, statusBarTile);
}


function onDidChangeFiles(projectPaths, provider, statusBarTile) {
  onLoad(projectPaths, provider, statusBarTile);
}
