'use strict';

const CompositeDisposable = require('atom').CompositeDisposable;
const commandHandlers     = require('./command-handlers');
const config              = require('./config');

const angular2Package = {
  config: config,
  subscriptions: null,

  activate: () => {
    // this.subscriptions = new CompositeDisposable;
    // this.subscriptions.add(atom.commands.add('atom-text-editor', {
    //   'angular2:fix-imports' : () => commandHandlers.fixImports(),
    // }));
  },

  deactivate: () => {
    // this.subscription.dispose()
  }
}

module.exports = angular2Package;
