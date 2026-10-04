export function execute(code) {
  const fn = new Function(code);

  return fn();
}
