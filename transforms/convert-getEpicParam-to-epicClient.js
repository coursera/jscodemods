'use strict';

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;

  let replacementsMade = false;
  let EPIC_CLIENT_MODULE_PATH = 'bundles/epic/client';

  function getRequireLiteral(variableDeclaration) {
    let require;
    j(variableDeclaration)
      .find(j.Literal)
      .forEach(path => {
        // handle loaders by splitting on !
        require = path.value.value.split('!').slice(-1)[0];
      });

    return require;
  }

  function smartInsertRequire(ast, name, modulePath) {
    // All react components have variable declarations since they must
    // require 'React'. We can assume a variable declaration requiring
    // something will exist in the file.
    const requirePaths = ast
      .find(j.VariableDeclaration, (path) => j(path)
          .find(j.CallExpression, path => path.callee.name === 'require').length > 0
      ).__paths;

    // Find index to insert require node at.
    let epicClientInsertAfterIndex = 0;
    for(let i = 0; i < requirePaths.length; i++) {
      const prev = getRequireLiteral(requirePaths[i]);
      if (prev < EPIC_CLIENT_MODULE_PATH) {
        epicClientInsertAfterIndex = i;
      }
    }

    j(requirePaths[epicClientInsertAfterIndex])
      .insertAfter(j.variableDeclaration(
        'const',
        [
          j.variableDeclarator(
            j.identifier('epic'),
            j.callExpression(
              j.identifier('require'),
              [
                j.literal(EPIC_CLIENT_MODULE_PATH)
              ]
            )
          )
        ]
      ))
  }

  const ast = j(file.source);

  ast
    .find(j.CallExpression, (path) => j(path)
      .find(j.Identifier, (path) => path.name === 'getEpicParam')
      .length > 0)
    .forEach(path => {
      j(path).replaceWith(
        j.callExpression(
          j.memberExpression(j.identifier('epic'), j.identifier('get')),
          path.value.arguments
        )
      )

      replacementsMade = true;
      return path;
    });

  // if replacements were made, that means getEpicParam was in the context, remove it
  // and then add a require statement for bundles/epic/client. Also remove any destructuring assignments
  // of getEpicParam
  if (replacementsMade) {
    ast
      .find(j.ClassProperty, (path) => path.key.name === 'contextTypes')
      .find(j.Property, (path) => path.key.name === 'getEpicParam')
      .forEach(path => {
        j(path).remove();
      });

    smartInsertRequire(ast, 'epic', EPIC_CLIENT_MODULE_PATH);

    ast
      .find(j.VariableDeclaration)
      .find(j.ObjectPattern, path => path.properties.map(p => p.key.name).includes('getEpicParam'))
      .forEach(path => {
        j(path).find(j.Property, path => path.key.name === 'getEpicParam')
          .forEach(path => {
            j(path).remove();
          });
      });

    // Remove contextTypes class property if it is now empty
    ast
      .find(j.ClassProperty, path => path.key.name === 'contextTypes' && path.value.type === 'ObjectExpression' && path.value.properties.length === 0)
      .forEach(path => j(path).remove());
  }

  return ast.toSource({
    quote: 'single',
    reuseWhitespace: false,
    trailingCommas: false
  });
}
