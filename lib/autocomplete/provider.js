'use strict';

// const exec = require('child_process');
const path = require('path');
const _ = require('lodash');
const indexer = require('./indexer');
const ImportOrganizer = require('./import-organizer');

const PREFIX_REGEX = /[^ ,{}();'"]$/

module.exports = {
  scopeSelector: '.source.ts',
  disableForScopeSelector: '.source.ts .comment',
  inclusionPriority: 1,
  excludeLowerPriority: true,

  completions: [],

  // Required: Return a promise, an array of suggestions, or null.
  // {editor, bufferPosition, scopeDescriptor, prefix, activatedManually}
  getSuggestions: function({ editor, bufferPosition, scopeDescriptor, prefix, activatedManually }) {
    return new Promise((resolve, reject) => {
      if (!this._shouldTriggerAutocomplete({ activatedManually, bufferPosition, editor })) {
        resolve([]);
        return;
      }

      let completions = this.getFilteredCompletions(prefix, editor);
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
  loadCompletions: function(projectPaths, statusBarTile) {
    statusBarTile.showProgress();
    Promise.resolve()
    .then(() => {
      this.completions = indexer.index(projectPaths) || [];
      statusBarTile.showComplete();
    })
    .catch(() => {
      statusBarTile.showError();
    });
  },


  // filter the matching suggestions and under the given project
  getFilteredCompletions: function(prefix, editor) {
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

  _shouldTriggerAutocomplete({ editor, activatedManually, bufferPosition }) {
    if (activatedManually) {
      return true;
    }
    const prefix = editor.getTextInBufferRange([[bufferPosition.row, 0], bufferPosition]);
    return PREFIX_REGEX.test(prefix);
  }

};
