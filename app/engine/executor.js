export function execute(code) {
  const events = [];

  function recordEvent(event) {
    events.push(event);
  }

  const fn = new Function("recordEvent", code);

  const result = fn(recordEvent);

  return {
    result,
    events,
  };
}
