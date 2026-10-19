/**
 * TRACE — Common Execution and Trace Contract
 *
 * Purpose:
 * Define a common format for execution events and results,
 * regardless of which programming language produced them.
 *
 * This file documents the contract using JSDoc.
 * It does not execute programs or change the existing interpreter.
 */

/**
 * Location of an event in the source code.
 *
 * Lines and columns are 1-based.
 *
 * @typedef {Object} TraceLocation
 * @property {string} [file] - Source filename, e.g. "main.js".
 * @property {number} [line] - Source line number.
 * @property {number} [column] - Source column number.
 */

/**
 * A variable change recorded during execution.
 *
 * Examples:
 *   total = 5
 *   numbers[1]: 6 -> 10
 *   user.points: 20 -> 25
 *
 * @typedef {Object} TraceChange
 * @property {string} target - Name of the variable being changed.
 * @property {Array<string | number>} [path]
 *   - Optional path to a nested value.
 *   - Example: ["points"] for an object property.
 *   - Example: [1] for an array index.
 * @property {unknown} [before] - Value before the change.
 * @property {unknown} [after] - Value after the change.
 */

/**
 * Identifies the function context in which an event occurred.
 *
 * @typedef {Object} TraceFrame
 * @property {string} [id] - Identifier for this call frame.
 * @property {string} [functionName] - Name of the current function.
 * @property {number} [depth] - Call-stack depth.
 */

/**
 * Standard event kinds that the TRACE visualizer understands.
 *
 * Language-specific events should be mapped into these common kinds
 * wherever their meanings are equivalent.
 *
 * @typedef {
 *   "variable-declare" |
 *   "variable-change" |
 *   "array-change" |
 *   "object-change" |
 *   "condition" |
 *   "branch" |
 *   "loop-iteration" |
 *   "loop-complete" |
 *   "function-declare" |
 *   "function-call" |
 *   "function-enter" |
 *   "function-return" |
 *   "function-exit" |
 *   "console-output" |
 *   "error"
 * } TraceEventKind
 */

/**
 * One event in a program's execution.
 *
 * sequence is zero-based, so it can correspond to an index in the
 * events and snapshots arrays.
 *
 * Use change for normalized variable changes and details for
 * event-specific information such as loop iteration or arguments.
 *
 * @typedef {Object} TraceEvent
 * @property {number} sequence - Zero-based event index.
 * @property {TraceEventKind} kind - Normalized event type.
 * @property {TraceLocation} [location] - Source location.
 * @property {TraceFrame} [frame] - Current function/call-stack context.
 * @property {string} [message] - Human-readable event description.
 * @property {TraceChange} [change] - Variable or data mutation.
 * @property {Record<string, unknown>} [details]
 *   - Additional event-specific information.
 * @property {number} [snapshotIndex]
 *   - Index of the state snapshot associated with this event.
 */

/**
 * A complete view of visible variables after an execution event.
 *
 * For example:
 * {
 *   total: 15,
 *   numbers: [3, 5, 7],
 *   user: { name: "TRACE" }
 * }
 *
 * @typedef {Record<string, unknown>} TraceSnapshot
 */

/**
 * Categories of execution errors.
 *
 * @typedef {
 *   "syntax" |
 *   "runtime" |
 *   "unsupported" |
 *   "timeout" |
 *   "security" |
 *   "internal"
 * } TraceErrorKind
 */

/**
 * Structured information about an execution error.
 *
 * @typedef {Object} TraceExecutionError
 * @property {TraceErrorKind} kind - Category of the error.
 * @property {string} message - Human-readable explanation.
 * @property {TraceLocation} [location] - Where the error occurred.
 * @property {string} [stack] - Stack trace, if available and safe to expose.
 */

/**
 * Overall execution status.
 *
 * @typedef {
 *   "completed" |
 *   "failed" |
 *   "timed-out" |
 *   "cancelled"
 * } ExecutionStatus
 */

/**
 * Result returned by a TRACE execution adapter.
 *
 * All language adapters should produce this common structure.
 *
 * IMPORTANT:
 * This is the proposed normalized format. Our existing interpreter
 * currently uses legacy event names and result fields, so an adapter
 * will be needed before its output matches this contract.
 *
 * @typedef {Object} ExecutionResult
 * @property {string} language
 *   - Language identifier, e.g. "javascript", "python", "java".
 * @property {ExecutionStatus} status - Final execution status.
 * @property {TraceEvent[]} events - Ordered execution events.
 * @property {TraceSnapshot[]} snapshots
 *   - State after each corresponding event.
 * @property {Record<string, unknown>} finalVariables
 *   - Final visible variable state.
 * @property {string} [stdout] - Captured standard output.
 * @property {string} [stderr] - Captured standard error.
 * @property {TraceExecutionError | null} [error] - Execution error, if any.
 * @property {number} [durationMs] - Execution duration in milliseconds.
 */

export {};
