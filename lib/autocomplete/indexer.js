'use strict';

const path = require('path');
const _ = require('lodash');
const indexer = require('js-module-indexer');
const projectIndexer = require('./project-indexer');
const readDependencies = require('../util/read-dependencies');

module.exports = {
  index,
};


function index(projectPaths) {
  const projectDependencies = readDependencies.getProjectDependencies(projectPaths);
  if (projectDependencies.length === 0) return;

  // data format
  // [] of obj: { project: '', suggestions: [{ text: '', type: '', source:''}] }
  let indexData = [];

  // index the node modules
  const indexedModules = {};
  _.forEach(projectDependencies, (project) => {
    const modulePath = path.join(project.project, 'node_modules');

    // angular dependencies
    _.forEach(project.dependencies, (dependency) => {
      if(dependency.slice(0,8) === '@angular' && !indexedModules[dependency]){
        const data = indexer.parseModule(dependency, modulePath);
        if(!_.isEmpty(data)) {
          indexData = _.concat(indexData, formatSuggestions(data.exports));
          indexedModules[dependency] = dependency;
        }
      }
    });

    // project src
    const sourcePath = path.join(project.project, 'src', 'app');
    indexData.push({
      project: project.project,
      suggestions: projectIndexer.index(sourcePath)
    });
  });

  return formatToGroups(indexData);
}


function formatSuggestions(data) {
  const indexData = [];

  _.forEach(data, (_data) => {
    let suggestions = [];

    // variables
    const variables = _.map(_data.variables, (v) => {
      return { text: v.name, type: 'keyword', source: _data.source };
    });
    if(variables.length > 0) suggestions = suggestions.concat(variables);

    // functions
    const functions = _.map(_data.functions, (f) => {
      return { text: f.name, type: 'function', source: _data.source };
    });
    if(functions.length > 0) suggestions = suggestions.concat(functions);

    // specifiers
    const specifiers = _.map(_data.specifiers, (s) => {
      return { text: s.name, type: 'class', source: _data.source };
    });
    if(specifiers.length > 0) suggestions = suggestions.concat(specifiers);

    indexData.push({
      project: path.dirname(_data.basePath), // trim node_modules
      suggestions,
    });

  });

  return indexData;
}

function formatToGroups(data) { // data -> [{ project: '', suggestions: [] }]
  return _.chain(data).flatten().groupBy('project')
  .mapValues((group) => { // group --> [ data ]
    // merge suggestions
    return _.chain(group).flatten().reduce((suggestions, _data) => {
      return suggestions.concat(_data.suggestions);
    }, []).value();
  }).value();
}
