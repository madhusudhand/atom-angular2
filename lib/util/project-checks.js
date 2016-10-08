'use strict';

const fs   = require('fs');
const path = require('path');

module.exports = {
  isAngularCliProject,
};

function isAngularCliProject(projectPath) {
  try {
    fs.accessSync(path.join(projectPath, 'angular-cli.json'), fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}
