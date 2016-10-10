'use strict';

const _  = require('lodash');
const fs = require('fs');

module.exports = {
  getProjectDependencies,
};

function getProjectDependencies(projectPaths) {
  const dependencies = [];

  _.forEach(projectPaths, (projectPath) => {
    let data = {};
    try {
      data = readJsonSync(projectPath);
    } catch (e) {
      // ignore the project
      return;
    }

    dependencies.push({
      project: projectPath,
      dependencies: _.keysIn(data.dependencies)
    });
  });

  return dependencies;
}

function readJsonSync(pkgPath) {
    const pkg = `${pkgPath}/package.json`;
    const data = fs.readFileSync(pkg);

    return JSON.parse(data);
}
