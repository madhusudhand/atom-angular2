'use strict';

const path = require('path');
const fs = require('fs');
const ts = require('typescript');
const _ = require('lodash');

const EXPORT_REGEXP = /^export(.|\n)*?from(.)*\n/gm;

module.exports = {
  index,
};

function index(projectPath) {
  const exportDeclarations = [];

  const files = getDirectoryContents(projectPath)
  for(let file of files) {
    exportDeclarations.push(parseAst(file));
    // let text = fs.readFileSync(file, 'utf8');
    // text = text.match(EXPORT_REGEXP);
    // exportDeclarations.push(text);
  }

  // getAst();

  return _.flatten(exportDeclarations);
}


function getDirectoryContents(dirPath) {
  let files = [];

  try {
    fs.accessSync(dirPath);

    let list = fs.readdirSync(dirPath);
    if(list && list.length > 0) {
      for(let item of list) {
        const fullPath = path.join(dirPath, item);
        const stats = fs.lstatSync(fullPath);

        // currently considering exports of index only.
        // TODO: improve to index all .ts files for export keyword
        if (stats.isFile() && item.slice(-3) === '.ts' && item.slice(-8) !== '.spec.ts' ) { // && item.slice(-3) === '.ts' && item.slice(-8) !== '.spec.ts'
          files.push(fullPath);
        } else if (stats.isDirectory()) {
          files = files.concat(getDirectoryContents(fullPath));
        }
      }
    }

  } catch (e) {
    // can't read
  }

  return files;
}

function _addExtension(filePath) {
  return (path.extname(filePath) !== '.ts') ? filePath + '.ts' : filePath;
}

function _trimExtension(filePath) {
  return (path.extname(filePath) === '.ts') ? filePath.slice(0, -3) : filePath;
}

function parseAst(filePath) {
  filePath = _addExtension(filePath);

  let ast = [];

  const host = {
      fileExists: () => true,
      readFile: () => '',

      getSourceFile: () => {
        try {
          const contents = fs.readFileSync(filePath, 'utf8');
          return ts.createSourceFile(path.basename(filePath), contents, ts.ScriptTarget.Latest, true);
        } catch (e) {
          return null;
        }
      },

      getDefaultLibFileName: () => 'lib.d.ts',
      writeFile: () => null,
      getCurrentDirectory: () => '',
      getDirectories: () => [],
      getCanonicalFileName: fileName => fileName,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => ts.sys.newLine,
    };

  const program = ts.createProgram([filePath], {
      noResolve: true,
      target: ts.ScriptTarget.Latest,
      experimentalDecorators: true,
      experimentalAsyncFunctions: true,
    }, host);

  const sourceFile = program.getSourceFile(filePath);
  const declarationTypes = [
    ts.SyntaxKind.VariableDeclaration,
    ts.SyntaxKind.VariableDeclarationList,
    ts.SyntaxKind.FunctionDeclaration,
    ts.SyntaxKind.ClassDeclaration,
    ts.SyntaxKind.InterfaceDeclaration,
    ts.SyntaxKind.TypeAliasDeclaration,
    ts.SyntaxKind.EnumDeclaration,
    ts.SyntaxKind.ModuleDeclaration
  ];

  ts.forEachChild(sourceFile, (node) => {
    if (node.kind === ts.SyntaxKind.ExportDeclaration) {
      if (node.exportClause) {
        // const specifierPath = path.join(path.dirname(filePath), node.moduleSpecifier.text);
        for(let elem of node.exportClause.elements){
          ast.push({ text: elem.name.text, type: 'class', source: _trimExtension(filePath), sourceType: 'app' });
        }
      } else {
        const exportAllAst = parseAst(path.join(path.dirname(filePath), node.moduleSpecifier.text));
        ast = ast.concat(_.map(exportAllAst, (node) => {
          node.source = _trimExtension(filePath);
          return node;
        }));
      }
    } else if (declarationTypes.indexOf(node.kind) !== -1) {
      if (node.modifiers && node.modifiers[0].kind === ts.SyntaxKind.ExportKeyword) {
        // const specifierPath = path.join(path.dirname(filePath), path.basename(filePath, '.ts'));
        ast.push({ text: node.name.text, type: 'class', source: _trimExtension(filePath), sourceType: 'app' });
      }
    }
  });

  return ast;
  // console.log(ts.SyntaxKind);
  // console.log(ts.TypeFormatFlags);
}
