'use strict';

const CompositeDisposable = require('atom').CompositeDisposable;
const commandHandlers     = require('./command-handlers');
const config              = require('./config');
const provider            = require('./autocomplete/provider');
const init                = require('./init');
const IndexProgressView   = require('./autocomplete/status-bar-tile');

module.exports = {
  config: {},
  subscriptions: null,

  activate: () => {
    this.projectPaths = atom.project.getPaths();

    this.subscriptions = new CompositeDisposable;
    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'angular2:fix-imports' : () => commandHandlers.fixImports(),
    }));

    // this.subscriptions.add(atom.config.observe('angular2.executablePath', function(executablePath) {
    //   return provider.executablePath = executablePath;
    // }));

    this.indexProgressView = new IndexProgressView();
    this.indexProgressView.init();

    init.onLoad(this.projectPaths, provider, this.indexProgressView);

    atom.project.onDidChangePaths((projectPaths) => {
      this.projectPaths = projectPaths;
      init.onDidChangePaths(projectPaths, provider, this.indexProgressView);
    });

    atom.workspace.observeTextEditors((editor) => {
      editor.onDidSave((event) => {
        // TODO: use event.path to re-index changed file only
        init.onDidChangeFiles(this.projectPaths, provider, this.indexProgressView);
      });
    });

  },

  deactivate: () => {
    // this.subscription.dispose();

    if (this.statusBarTile) {
      this.statusBarTile.destroy();
      this.statusBarTile = null;
    }

    if (this.indexProgressView) {
      this.indexProgressView.hide();
    }
  },

  getProvider: () => {
    return provider;
  },

  consumeStatusBar: (statusBar) => {
    this.statusBarTile = statusBar.addRightTile({
      item: this.indexProgressView,
      priority: 100
    });
  },

}
