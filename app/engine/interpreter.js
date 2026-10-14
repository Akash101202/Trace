function cloneValue(value) {
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneValue(item)]),
    );
  }

  return value;
}

function cloneVariables(variables) {
  return Object.fromEntries(
    Object.entries(variables).map(([name, value]) => [name, cloneValue(value)]),
  );
}

export function evaluateExpression(node, variables, evaluateCall = null) {
  switch (node.type) {
    case "NumericLiteral":
    case "StringLiteral":
    case "BooleanLiteral":
      return node.value;

    case "NullLiteral":
      return null;

    case "Identifier": {
      if (!Object.hasOwn(variables, node.name)) {
        throw new Error(`Variable "${node.name}" is not defined`);
      }

      return variables[node.name];
    }

    // Arrays: [1, 2, 3]
    case "ArrayExpression":
      return node.elements.map((element) => {
        if (!element) {
          throw new Error("Array holes are not supported");
        }

        return evaluateExpression(element, variables, evaluateCall);
      });

    // Objects: { total: 10, grade: "A" }
    case "ObjectExpression":
      return Object.fromEntries(
        node.properties.map((property) => {
          if (property.type !== "ObjectProperty" || property.computed) {
            throw new Error("Only simple object properties are supported");
          }

          let key;

          if (property.key.type === "Identifier") {
            key = property.key.name;
          } else if (
            property.key.type === "StringLiteral" ||
            property.key.type === "NumericLiteral"
          ) {
            key = String(property.key.value);
          } else {
            throw new Error("Unsupported object property key");
          }

          return [
            key,
            evaluateExpression(property.value, variables, evaluateCall),
          ];
        }),
      );

    // Array/object property access
    case "MemberExpression": {
      const object = evaluateExpression(node.object, variables, evaluateCall);

      if (
        !node.computed &&
        node.property.type === "Identifier" &&
        node.property.name === "length" &&
        (Array.isArray(object) || typeof object === "string")
      ) {
        return object.length;
      }

      if (node.computed) {
        const property = evaluateExpression(
          node.property,
          variables,
          evaluateCall,
        );

        if (Array.isArray(object)) {
          if (
            !Number.isInteger(property) ||
            property < 0 ||
            property >= object.length
          ) {
            throw new Error(`Invalid array index: ${property}`);
          }

          return object[property];
        }

        if (
          object !== null &&
          typeof object === "object" &&
          Object.hasOwn(object, property)
        ) {
          return object[property];
        }

        throw new Error("Invalid property access");
      }

      if (
        object !== null &&
        typeof object === "object" &&
        node.property.type === "Identifier" &&
        Object.hasOwn(object, node.property.name)
      ) {
        return object[node.property.name];
      }

      throw new Error("Unsupported or invalid property access");
    }

    // Function calls are handled by the interpreter.
    case "CallExpression":
      if (!evaluateCall) {
        throw new Error(
          "Function calls must be evaluated by the TRACE interpreter",
        );
      }

      return evaluateCall(node);

    // Arithmetic and comparisons
    case "BinaryExpression": {
      const left = evaluateExpression(node.left, variables, evaluateCall);

      const right = evaluateExpression(node.right, variables, evaluateCall);

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
        case "**":
          return left ** right;
        case "<":
          return left < right;
        case "<=":
          return left <= right;
        case ">":
          return left > right;
        case ">=":
          return left >= right;
        case "===":
          return left === right;
        case "!==":
          return left !== right;
        default:
          throw new Error(`Unsupported operator: ${node.operator}`);
      }
    }

    // Logical operators
    case "LogicalExpression": {
      const left = evaluateExpression(node.left, variables, evaluateCall);

      if (node.operator === "&&") {
        return left && evaluateExpression(node.right, variables, evaluateCall);
      }

      if (node.operator === "||") {
        return left || evaluateExpression(node.right, variables, evaluateCall);
      }

      throw new Error(`Unsupported logical operator: ${node.operator}`);
    }

    // Unary operators: !x, -x, +x
    case "UnaryExpression": {
      const value = evaluateExpression(node.argument, variables, evaluateCall);

      switch (node.operator) {
        case "!":
          return !value;
        case "-":
          return -value;
        case "+":
          return +value;
        default:
          throw new Error(`Unsupported unary operator: ${node.operator}`);
      }
    }

    default:
      throw new Error(`Unsupported expression: ${node.type}`);
  }
}

export function executeProgram(ast) {
  const globalVariables = {};
  const scopes = [globalVariables];
  const functions = new Map();
  const callStack = [];
  const events = [];
  const snapshots = [];

  const MAX_EVENTS = 5000;
  const MAX_CALL_DEPTH = 100;
  const RETURN_SIGNAL = Symbol("return");

  // Combine outer and inner scopes for display.
  function visibleVariables() {
    const visible = {};

    for (const scope of scopes) {
      Object.assign(visible, scope);
    }

    return visible;
  }

  function getVariable(name) {
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (Object.hasOwn(scopes[i], name)) {
        return scopes[i][name];
      }
    }

    throw new Error(`Variable "${name}" is not defined`);
  }

  function setVariable(name, value) {
    for (let i = scopes.length - 1; i >= 0; i--) {
      if (Object.hasOwn(scopes[i], name)) {
        scopes[i][name] = value;
        return;
      }
    }

    throw new Error(`Variable "${name}" is not defined`);
  }

  // Record an event and an independent state snapshot.
  function recordEvent(event) {
    if (events.length >= MAX_EVENTS) {
      throw new Error(
        `Execution stopped after ${MAX_EVENTS} events. Check for an infinite loop.`,
      );
    }

    events.push(event);
    snapshots.push(cloneVariables(visibleVariables()));
  }

  function evaluate(node) {
    return evaluateExpression(node, visibleVariables(), invokeFunction);
  }

  // Variable declarations
  function executeDeclaration(statement) {
    for (const declaration of statement.declarations) {
      if (declaration.id.type !== "Identifier") {
        throw new Error("Only simple variable names are supported");
      }

      const name = declaration.id.name;
      const value = declaration.init ? evaluate(declaration.init) : undefined;

      scopes[scopes.length - 1][name] = value;

      recordEvent({
        type: "declare",
        variable: name,
        value: cloneValue(value),
        line: statement.loc?.start.line,
      });
    }
  }

  // Assignments, increments and array mutations
  function executeMutation(expression, line) {
    // i++ and i--
    if (expression.type === "UpdateExpression") {
      if (expression.argument.type !== "Identifier") {
        throw new Error("Only variable++ and variable-- are supported");
      }

      const name = expression.argument.name;
      const oldValue = getVariable(name);

      if (
        typeof oldValue !== "number" ||
        !["++", "--"].includes(expression.operator)
      ) {
        throw new Error("Increment/decrement requires a numeric variable");
      }

      const newValue =
        expression.operator === "++" ? oldValue + 1 : oldValue - 1;

      setVariable(name, newValue);

      recordEvent({
        type: "update",
        variable: name,
        oldValue,
        newValue,
        line,
      });

      return;
    }

    if (
      expression.type !== "AssignmentExpression" ||
      expression.operator !== "="
    ) {
      throw new Error("Unsupported assignment expression");
    }

    const left = expression.left;

    // x = ...
    if (left.type === "Identifier") {
      const name = left.name;
      const oldValue = getVariable(name);
      const newValue = evaluate(expression.right);

      setVariable(name, newValue);

      recordEvent({
        type: "update",
        variable: name,
        oldValue: cloneValue(oldValue),
        newValue: cloneValue(newValue),
        line,
      });

      return;
    }

    // arr[index] = ... or object.property = ...
    if (left.type === "MemberExpression") {
      const object = evaluate(left.object);

      let property;

      if (left.computed) {
        property = evaluate(left.property);
      } else if (left.property.type === "Identifier") {
        property = left.property.name;
      } else {
        throw new Error("Unsupported assignment property");
      }

      if (
        !Array.isArray(object) &&
        (object === null || typeof object !== "object")
      ) {
        throw new Error("Cannot update a property on a non-object value");
      }

      if (Array.isArray(object)) {
        if (
          !Number.isInteger(property) ||
          property < 0 ||
          property > object.length
        ) {
          throw new Error(`Invalid array index: ${property}`);
        }
      }

      const oldValue = object[property];
      const newValue = evaluate(expression.right);

      object[property] = newValue;

      const variableName =
        left.object.type === "Identifier" ? left.object.name : "object";

      recordEvent({
        type: Array.isArray(object) ? "array-update" : "object-update",
        variable: variableName,
        index: Array.isArray(object) ? property : undefined,
        property: Array.isArray(object) ? undefined : String(property),
        oldValue: cloneValue(oldValue),
        newValue: cloneValue(newValue),
        line,
      });

      return;
    }

    throw new Error("Unsupported assignment target");
  }

  // Function calls and console.log()
  function invokeFunction(callNode) {
    if (
      callNode.callee.type === "MemberExpression" &&
      !callNode.callee.computed &&
      callNode.callee.object.type === "Identifier" &&
      callNode.callee.object.name === "console" &&
      callNode.callee.property.type === "Identifier" &&
      callNode.callee.property.name === "log"
    ) {
      const values = callNode.arguments.map((argument) => {
        if (argument.type === "SpreadElement") {
          throw new Error("Spread arguments are not supported");
        }

        return evaluate(argument);
      });

      recordEvent({
        type: "console-log",
        arguments: values.map(cloneValue),
        line: callNode.loc?.start.line,
      });

      return undefined;
    }

    if (callNode.callee.type !== "Identifier") {
      throw new Error("Only calls to named functions are supported");
    }

    const functionName = callNode.callee.name;
    const definition = functions.get(functionName);

    if (!definition) {
      throw new Error(`Function "${functionName}" is not defined`);
    }

    if (callStack.length >= MAX_CALL_DEPTH) {
      throw new Error(
        `Maximum function call depth (${MAX_CALL_DEPTH}) exceeded`,
      );
    }

    const argumentsList = callNode.arguments.map((argument) => {
      if (argument.type === "SpreadElement") {
        throw new Error("Spread arguments are not supported");
      }

      return evaluate(argument);
    });

    const recordedArguments = argumentsList.map(cloneValue);

    recordEvent({
      type: "function-call",
      functionName,
      arguments: recordedArguments,
      line: callNode.loc?.start.line,
    });

    const localScope = {};

    definition.params.forEach((parameter, index) => {
      if (parameter.type !== "Identifier") {
        throw new Error("Only simple function parameters are supported");
      }

      localScope[parameter.name] = argumentsList[index];
    });

    scopes.push(localScope);
    callStack.push(functionName);

    recordEvent({
      type: "function-enter",
      functionName,
      arguments: recordedArguments,
      line: definition.loc?.start.line,
    });

    let outcome;

    try {
      outcome = executeStatement(definition.body);
    } finally {
      callStack.pop();
      scopes.pop();
    }

    const returned = outcome?.type === RETURN_SIGNAL;

    const value = returned ? outcome.value : undefined;

    recordEvent({
      type: "function-exit",
      functionName,
      value: cloneValue(value),
      line: callNode.loc?.start.line,
    });

    return value;
  }

  // Attach source-location diagnostics to interpreter errors.
  function executeStatement(statement) {
    try {
      return executeStatementUnsafe(statement);
    } catch (error) {
      if (error && typeof error === "object") {
        if (error.traceLine == null) {
          error.traceLine = statement.loc?.start.line ?? null;
        }

        if (error.traceColumn == null) {
          const column = statement.loc?.start.column;

          error.traceColumn = column == null ? null : column + 1;
        }

        if (error.traceErrorType == null) {
          const message = error.message ?? String(error);

          error.traceErrorType = /unsupported|not supported/i.test(message)
            ? "unsupported"
            : "runtime";
        }
      }

      throw error;
    }
  }

  function executeStatementUnsafe(statement) {
    const line = statement.loc?.start.line;

    switch (statement.type) {
      case "FunctionDeclaration": {
        if (!statement.id) {
          throw new Error("Anonymous function declarations are unsupported");
        }

        functions.set(statement.id.name, statement);

        recordEvent({
          type: "function-declaration",
          functionName: statement.id.name,
          line,
        });

        return;
      }

      case "VariableDeclaration":
        executeDeclaration(statement);
        return;

      case "ExpressionStatement":
        if (statement.expression.type === "CallExpression") {
          evaluate(statement.expression);
        } else {
          executeMutation(statement.expression, line);
        }

        return;

      case "ReturnStatement": {
        if (callStack.length === 0) {
          throw new Error("return can only be used inside a function");
        }

        const value = statement.argument
          ? evaluate(statement.argument)
          : undefined;

        recordEvent({
          type: "function-return",
          functionName: callStack[callStack.length - 1],
          value: cloneValue(value),
          line,
        });

        return {
          type: RETURN_SIGNAL,
          value,
        };
      }

      case "BlockStatement":
        for (const child of statement.body) {
          const outcome = executeStatement(child);

          if (outcome?.type === RETURN_SIGNAL) {
            return outcome;
          }
        }

        return;

      case "IfStatement": {
        const condition = Boolean(evaluate(statement.test));

        recordEvent({
          type: "condition",
          construct: "if",
          result: condition,
          line: statement.test.loc?.start.line ?? line,
        });

        recordEvent({
          type: "branch",
          construct: "if",
          branch: condition ? "if" : "else",
          result: condition,
          line,
        });

        if (condition) {
          return executeStatement(statement.consequent);
        }

        if (statement.alternate) {
          return executeStatement(statement.alternate);
        }

        return;
      }

      case "ForStatement": {
        if (statement.init) {
          if (statement.init.type === "VariableDeclaration") {
            executeDeclaration(statement.init);
          } else {
            executeMutation(
              statement.init,
              statement.init.loc?.start.line ?? line,
            );
          }
        }

        let iterations = 0;

        while (statement.test ? evaluate(statement.test) : true) {
          iterations++;

          recordEvent({
            type: "loop-iteration",
            construct: "for",
            iteration: iterations,
            line,
          });

          const outcome = executeStatement(statement.body);

          if (outcome?.type === RETURN_SIGNAL) {
            return outcome;
          }

          if (statement.update) {
            executeMutation(
              statement.update,
              statement.update.loc?.start.line ?? line,
            );
          }
        }

        recordEvent({
          type: "loop-complete",
          construct: "for",
          iterations,
          line,
        });

        return;
      }

      case "WhileStatement": {
        let iterations = 0;

        while (evaluate(statement.test)) {
          iterations++;

          recordEvent({
            type: "loop-iteration",
            construct: "while",
            iteration: iterations,
            line,
          });

          const outcome = executeStatement(statement.body);

          if (outcome?.type === RETURN_SIGNAL) {
            return outcome;
          }
        }

        recordEvent({
          type: "loop-complete",
          construct: "while",
          iterations,
          line,
        });

        return;
      }

      default:
        throw new Error(`Unsupported statement: ${statement.type}`);
    }
  }

  // Register top-level functions before program execution.
  for (const statement of ast.program.body) {
    if (statement.type === "FunctionDeclaration" && statement.id) {
      functions.set(statement.id.name, statement);
    }
  }

  try {
    for (const statement of ast.program.body) {
      executeStatement(statement);
    }
  } catch (caughtError) {
    const error =
      caughtError instanceof Error
        ? caughtError
        : new Error(String(caughtError));

    error.traceInfo = {
      kind: error.traceErrorType ?? "runtime",
      message: error.message,
      line: error.traceLine ?? null,
      column: error.traceColumn ?? null,
      events: [...events],
      snapshots: [...snapshots],
      variables: cloneVariables(visibleVariables()),
    };

    throw error;
  }

  return {
    variables: cloneVariables(globalVariables),
    events,
    snapshots,
  };
}
