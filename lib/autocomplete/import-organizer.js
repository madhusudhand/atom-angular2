'use strict';

const _       = require('lodash');
const indexer = require('js-module-indexer');
const path    = require('path');

const TRIM_SPACES_BEGINNING      = /^\s+/g;
const IMPORT_REGEXP              = /^import(.|\n)*?from(.)*\n/gm;
const NEW_LINES_BETWEEN_IMPORTS  = /from(.)+\n(\n)+import/gm;
const REPLACE_PLACEHOLDER        = '@importPlaceholder@';
const REPLACE_PLACEHOLDER_REGEXP = new RegExp(REPLACE_PLACEHOLDER + '(.)*' + REPLACE_PLACEHOLDER, 'gm');

const LIBRARY_IMPORT = 0;
const PROJECT_IMPORT = 1;

class ImportOrganizer {
  constructor(editor) {
    this.editor = editor;
    this.buffer = editor.getBuffer();
  }

  resolveImportsForSuggestion(suggestion) {
    const importsText = this.constructImports(suggestion);
    this.replaceImports(importsText);
  }

  // add required and remove unused imports
  organizeImports() {

  }


  hasImports() {
    return this.buffer.getText().match(IMPORT_REGEXP);
  }

  _getImportGroups(imports) {
    return _.groupBy(imports, (singleImport) => singleImport.source[0] === '.' ? PROJECT_IMPORT : LIBRARY_IMPORT);
  }

  constructImports(suggestion) {
    let parsedImports = [];
    const imports = this.hasImports();
    if (imports && imports.length !== 0) {
      parsedImports = indexer.parseContent(imports.join(''), { exports: false, imports: true }).imports;
    }

    if (suggestion) {
      if (suggestion.source.slice(0,1) === '/')
        suggestion.source = this.formatPath(path.relative(path.dirname(this.editor.getPath()), suggestion.source));
      const index = (parsedImports.length > 0) ? _.findIndex(parsedImports, { source: suggestion.source }) : -1;

      if (index >= 0) {
        parsedImports[index].specifiers.push({ name: suggestion.text });
      } else {
        parsedImports.push({
          source: suggestion.source,
          sourceType: suggestion.sourceType,
          specifiers: [{ name: suggestion.text }]
        });
      }
    }

    const formattedImports = parsedImports.map((parsedImport) => {
      let specifiers = _.chain(parsedImport.specifiers).sortBy('name').sortedUniqBy('name').value();
      specifiers = specifiers.map((specifier)=> {
        return specifier.name + ((specifier.alias && specifier.alias !== specifier.name) ? ` as ${specifier.alias}` : '')
      }).join(', ');

      return {
        type: parsedImport.source[0] === '.' ? PROJECT_IMPORT : LIBRARY_IMPORT,
        importText: `import { ${specifiers} } from '${parsedImport.source}';`
      };
    });

    const libraryImports = formattedImports.filter((fi) => fi.type === LIBRARY_IMPORT).map(fi => fi.importText).join('\n');
    const projectImports = formattedImports.filter((fi) => fi.type === PROJECT_IMPORT).map(fi => fi.importText).join('\n');
    const seperator = libraryImports && projectImports ? '\n\n' : '';

    return libraryImports + seperator + projectImports;
  }

  formatPath(source) {
    if (source.slice(0,1) !== '.') {
      source = './' + source;
    }
    if (source.slice(-8) === 'index.ts') {
      source = source.slice(0, -8);
    }
    if (source.slice(-2) !== './' && source.slice(-1) === '/') {
      source = source.slice(0, -1);
    }

    return source;
  }

  replaceImports(importsText) {
    if (!importsText) return;
    const bufferText = this.buffer.getText().replace(TRIM_SPACES_BEGINNING, '');

    importsText = this.hasImports() ?
      bufferText
        .replace(NEW_LINES_BETWEEN_IMPORTS, 'from\$1\nimport')
        .replace(IMPORT_REGEXP, REPLACE_PLACEHOLDER)
        .replace(REPLACE_PLACEHOLDER_REGEXP, REPLACE_PLACEHOLDER)
        .replace(REPLACE_PLACEHOLDER, importsText + '\n')
      :
      importsText + '\n\n' + bufferText;

    this.buffer.setTextViaDiff(importsText);
  }

}


module.exports = ImportOrganizer;
