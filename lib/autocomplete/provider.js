'use strict';

// const exec = require('child_process');
const _ = require('lodash');
const indexer = require('js-module-indexer');

module.exports = {
  selector: '.source.ts',
  disableForSelector: '.source.ts .comment',
  inclusionPriority: 1,
  excludeLowerPriority: true,

  // Required: Return a promise, an array of suggestions, or null.
  // {editor, bufferPosition, scopeDescriptor, prefix, activatedManually}
  getSuggestions: function({editor, bufferPosition, scopeDescriptor, prefix}) {
    return new Promise((resolve, reject) => {
      const completions = this.getCompletions(prefix);
      resolve(completions || []);
    });
  },

  // onDidInsertSuggestion: function(arg) {
  //   // var editor, suggestion, triggerPosition;
  //   // editor = arg.editor, triggerPosition = arg.triggerPosition, suggestion = arg.suggestion;
  // },

  dispose: function() {},


  // helper functions

  loadCompletions: function() {
    this.completions = {};

    const indexResults = indexer();

    this.completions = indexResults.mylist.map((keyword) => {
      return {
        text: keyword,
        type: 'keyword',
      };
    });
  },

  getCompletions: function(prefix) {
    const completions = [];

    completions.push(
      _.filter(this.completions, (completion) => {
        return completion.text.toLowerCase().indexOf(prefix.toLowerCase()) >= 0;
      })
    );
    return completions[0];
  },
};
