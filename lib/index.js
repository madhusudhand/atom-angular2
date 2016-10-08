'use strict';

const CompositeDisposable = require('atom').CompositeDisposable;
const commandHandlers     = require('./command-handlers');
const config              = require('./config');
const provider            = require('./autocomplete/provider');
const init                = require('./init');

module.exports = {
  config: Object.assign({}, config, {
    projectPaths : atom.project.getPaths()
  }),
  subscriptions: null,

  activate: () => {
    this.subscriptions = new CompositeDisposable;
    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'angular2:fix-imports' : () => commandHandlers.fixImports(),
    }));

    init.onLoad(atom.project.getPaths(), provider);

    // this.subscriptions.add(atom.config.observe('angular2.executablePath', function(executablePath) {
    //   return provider.executablePath = executablePath;
    // }));
  },

  deactivate: () => {
    this.subscription.dispose();
  },

  getProvider: () => {
    return provider;
  },
}
