'use strict';

// const exec = require('child_process');
const path = require('path');
const _ = require('lodash');
const indexer = require('js-module-indexer');
const readDependencies = require('../util/read-dependencies');
const ImportOrganizer = require('./import-organizer');

module.exports = {
  scopeSelector: '.source.ts',
  disableForScopeSelector: '.source.ts .comment',
  inclusionPriority: 1,
  excludeLowerPriority: true,

  // Required: Return a promise, an array of suggestions, or null.
  // {editor, bufferPosition, scopeDescriptor, prefix, activatedManually}
  getSuggestions: function({editor, bufferPosition, scopeDescriptor, prefix}) {
    return new Promise((resolve, reject) => {
      let completions = this.getCompletions(prefix, editor);
      // TODO: This is a tempory call as replacement isn't working
      // issue: https://github.com/atom/autocomplete-plus/issues/781
      completions = this.clearReplacementPrefix(completions);
      resolve(completions || []);
    });
  },

  // TODO: This is is a tempory fix
  // issue: https://github.com/atom/autocomplete-plus/issues/781
  clearReplacementPrefix: function(completions) {
    return _.map(completions, (completion) => {
      completion.replacementPrefix = null;
      return completion;
    });
  },

  onDidInsertSuggestion: function({editor, suggestion, triggerPosition}) {
    // suggestion: {text, type, source}

    const importOrganizer = new ImportOrganizer(editor);
    importOrganizer.resolveImportsForSuggestion(suggestion);
  },



  dispose: function() {},

  // onWillConfirm

  // helper functions

  loadCompletions: function(projectPaths) {
    this.completions = {};

    const projectDependencies = readDependencies.getProjectDependencies(projectPaths);
    if (projectDependencies.length === 0) return;

    const indexData = [];
    const indexedModules = {};
    _.forEach(projectDependencies, (project) => {
      const modulePath = path.join(project.project, 'node_modules');

      _.forEach(project.dependencies, (dependency) => {
        if(dependency.slice(0,8) === '@angular' && !indexedModules[dependency]){
          const data = indexer.parseModule(dependency, modulePath);
          if(!_.isEmpty(data)) {
            indexData.push(this.formatSuggestions(data.exports));
            indexedModules[dependency] = dependency;
          }
        }
      });
    });

    this.completions = this.formatToGroups(indexData);
  },

  formatSuggestions: function(data) {
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
  },


  formatToGroups: function(data) { // data -> [{ project: '', suggestions: [] }]
    return _.chain(data).flatten().groupBy('project')
    .mapValues((group) => { // group --> [ data ]
      // merge suggestions
      return _.chain(group).flatten().reduce((suggestions, _data) => {
        return suggestions.concat(_data.suggestions);
      }, []).value();
    }).value();
  },


  // filter the matching suggestions and under the given project
  getCompletions: function(prefix, editor) {
    // get current project path and do filter
    let filePath = '';
    if (editor && editor.buffer && editor.buffer.file) {
      filePath = editor.buffer.file.path;
    }
    if (!filePath) return [];

    // returns [ project path, file relative path ]
    const projectPath = atom.project.relativizePath(filePath);
    if (!projectPath || projectPath.length === 0) return [];

    return _.filter(this.completions[projectPath[0]], (completion) => {
      return completion.text.toLowerCase().indexOf(prefix.toLowerCase()) >= 0;
    });
  },
};
