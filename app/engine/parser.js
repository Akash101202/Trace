import { parse } from "@babel/parser";

export function parseCode(code) {
  return parse(code, {
    sourceType: "module",
  });
}

export function getVariableExpressions(ast) {
  const variableExpressions = [];

  ast.program.body.forEach((node) => {
    if (node.type == "VariableDeclaration") {
      const declaration = node.declarations[0];
      const variableName = declaration.id.name;
      const variableValue = declaration.init.value;

      variableExpressions.push({
        name: variableName,
        value: variableValue,
      });
    }
  });
  return variableExpressions;
}

/*Change the inside of the loop so you:
1. Check whether the node is a VariableDeclaration.
2. Get node.declarations[0].
3. Extract id.name and init.value.
4. Put them into variableExpressions.
5. Return the array.*/
