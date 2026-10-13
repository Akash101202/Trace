export function evaluateExpression(node, variables) {
  if (node.type === "NumericLiteral") {
    return node.value;
  }

  if (node.type === "Identifier") {
    if (!Object.hasOwn(variables, node.name)) {
      throw new Error(`Variable "${node.name}" is not defined`);
    }

    return variables[node.name];
  }

  if (node.type === "BinaryExpression") {
    const left = evaluateExpression(node.left, variables);
    const right = evaluateExpression(node.right, variables);

    switch (node.operator) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "%":
        return left % right;
      default:
        throw new Error(`Unsupported operator: ${node.operator}`);
    }
  }

  throw new Error(`Unsupported expression: ${node.type}`);
}

export function executeProgram(ast) {
  const variables = {};
  const events = [];
  const snapshots = [];

  function recordEvent(event) {
    events.push(event);
    snapshots.push({ ...variables });
  }

  for (const statement of ast.program.body) {
    if (statement.type === "VariableDeclaration") {
      for (const declaration of statement.declarations) {
        if (declaration.id.type !== "Identifier" || !declaration.init) {
          throw new Error("Unsupported variable declaration");
        }

        const name = declaration.id.name;
        const value = evaluateExpression(declaration.init, variables);

        variables[name] = value;

        recordEvent({
          type: "declare",
          variable: name,
          value,
          line: statement.loc?.start.line,
        });
      }
    } else if (statement.type === "ExpressionStatement") {
      const expression = statement.expression;

      if (
        expression.type !== "AssignmentExpression" ||
        expression.operator !== "=" ||
        expression.left.type !== "Identifier"
      ) {
        throw new Error("Unsupported expression statement");
      }

      const name = expression.left.name;

      if (!Object.hasOwn(variables, name)) {
        throw new Error(`Variable "${name}" is not defined`);
      }

      const oldValue = variables[name];
      const newValue = evaluateExpression(expression.right, variables);

      variables[name] = newValue;

      recordEvent({
        type: "update",
        variable: name,
        oldValue,
        newValue,
        line: statement.loc?.start.line,
      });
    } else {
      throw new Error(`Unsupported statement: ${statement.type}`);
    }
  }

  return {
    variables,
    events,
    snapshots,
  };
}
