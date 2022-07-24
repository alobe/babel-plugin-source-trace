const { declare } = require('@babel/helper-plugin-utils');
const { types: t } = require('@babel/core');

module.exports = declare((api) => {
  api.assertVersion(7);

  const visitor = {
    Program: {
      enter: (_, state) => {
        state.file.set('hasJSX', false);

        if (process.env.NODE_ENV === 'development');
        else state.file.set('skip', true);
      },
      exit: (path, state) => {
        // only add import statement to files that have JSX

        // bonus TODO: would be nice if we only add this once for each entry point
        // but we don't have that information here
        if (!state.file.get('hasJSX')) return;
      }
    },
    JSXOpeningElement(path, state) {
      if (state.file.get('skip')) return;

      const location = path.container.openingElement.loc;
      if (!location) return;

      state.file.set('hasJSX', true);

      const nameNode = path.container.openingElement.name;
      if (nameNode.name === 'Fragment') return;
      if (
        nameNode.type === 'JSXMemberExpression' &&
        nameNode.object &&
        nameNode.object.name === 'React' &&
        nameNode.property &&
        nameNode.property.name === 'Fragment'
      ) {
        return;
      }

      const source = `${state.filename}:${location.start.line}`
      path.container.openingElement.attributes.push(
        t.jsxAttribute(t.jsxIdentifier(`source-trace`), t.stringLiteral(source))
      );
    }
  };

  return {
    name: 'babel-plugin-source-trace',
    visitor
  };
});
