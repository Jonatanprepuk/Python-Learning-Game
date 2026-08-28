// Python preamble injected before the player's own code. Defines the
// beginner-friendly robot/terminal API as plain Python functions that call
// back into JS (registered as globals by the worker) to mutate/query the
// simulated world. Using sys._getframe(1) lets each builtin report the
// exact source line of the *call site* in the player's code.
export const PREAMBLE = `import sys as __sys
import json as __json

__RESERVED_NAMES = {
    'move', 'turn_left', 'turn_right', 'collect', 'can_move',
    'resource_ahead', 'at_goal', 'print', 'input'
}

def move():
    return __step_move(__sys._getframe(1).f_lineno)

def turn_left():
    return __step_turn_left(__sys._getframe(1).f_lineno)

def turn_right():
    return __step_turn_right(__sys._getframe(1).f_lineno)

def collect():
    return __step_collect(__sys._getframe(1).f_lineno)

def can_move():
    return bool(__step_can_move(__sys._getframe(1).f_lineno))

def resource_ahead():
    return bool(__step_resource_ahead(__sys._getframe(1).f_lineno))

def at_goal():
    return bool(__step_at_goal(__sys._getframe(1).f_lineno))

def print(*args, sep=' ', end='\\n'):
    __step_print(__sys._getframe(1).f_lineno, sep.join(str(a) for a in args) + end)

def input(prompt=''):
    return __step_input(__sys._getframe(1).f_lineno, str(prompt))

def __to_jsonable(value, depth=0):
    if depth > 3:
        return None
    if isinstance(value, float):
        # json.dumps emits the bare (non-standard) tokens NaN/Infinity/-Infinity
        # for these, which JS's JSON.parse rejects outright. Represent them as
        # readable strings instead so a stray NaN never crashes the snapshot.
        if value != value:
            return 'NaN'
        if value == float('inf'):
            return 'Infinity'
        if value == float('-inf'):
            return '-Infinity'
        return value
    if value is None or isinstance(value, (bool, int, str)):
        return value
    if isinstance(value, (list, tuple)):
        return [__to_jsonable(v, depth + 1) for v in value]
    if isinstance(value, dict):
        return {str(k): __to_jsonable(v, depth + 1) for k, v in value.items()}
    if callable(value):
        return None
    if hasattr(value, '__dict__'):
        result = {'__class__': type(value).__name__}
        for k, v in vars(value).items():
            result[k] = __to_jsonable(v, depth + 1)
        return result
    return str(value)

def __snapshot_globals(g):
    return {
        k: __to_jsonable(v)
        for k, v in g.items()
        if not k.startswith('_') and k not in __RESERVED_NAMES
    }

def __trace_line(frame, event, arg):
    if event == 'line':
        __step_state(frame.f_lineno, __json.dumps(__snapshot_globals(frame.f_globals)))
    return __trace_line

def __trace_return(frame, event, arg):
    if event == 'return':
        __step_return(frame.f_lineno, frame.f_code.co_name, __json.dumps(__to_jsonable(arg)))
    return __trace_return

__INTERNAL_NAMES = ('__trace_calls', '__trace_return', '__trace_line', '__to_jsonable', '__snapshot_globals')

def __trace_calls(frame, event, arg):
    if event != 'call':
        return __trace_calls
    name = frame.f_code.co_name
    # The player's own top-level code (see buildSource: exec(literal, globals()))
    # is itself compiled as a '<module>' code object — track it line-by-line so
    # the UI can show variables updating live, not just at the very end.
    if name == '<module>':
        return __trace_line
    # Skip our own API, and synthetic frames like <genexpr>/<listcomp>/<lambda>
    # that Python creates internally (e.g. inside print()'s argument join).
    if name.startswith('<') or name in __RESERVED_NAMES or name in __INTERNAL_NAMES:
        return None
    args = {k: __to_jsonable(v) for k, v in frame.f_locals.items()}
    __step_call(frame.f_lineno, name, __json.dumps(args))
    return __trace_return
`

/**
 * Wrap the player's code so that:
 *  - it runs as its OWN compiled unit (via exec on a string literal), so every
 *    line number reported through _getframe(1).f_lineno is already the
 *    player's own 1-indexed line number — no preamble-length offset needed.
 *  - sys.settrace is enabled only around that exec call and always disabled
 *    in a finally, whether the code succeeds, raises, or pauses on input().
 *    Tracing is deliberately NOT left on: sys.settrace is a process-wide
 *    interpreter setting, and Pyodide's own post-run bookkeeping (still
 *    inside this same runPython call) is itself pure Python — left enabled,
 *    it gets traced too and can trip the runaway-call guard on totally
 *    ordinary code that has no loop or recursion at all.
 * JSON.stringify produces a valid Python string literal for any JS string
 * (its escapes are a subset of Python's), so this needs no custom escaping.
 */
export function buildSource(userCode: string): string {
  const literal = JSON.stringify(userCode)
  return `${PREAMBLE}\n__sys.settrace(__trace_calls)\ntry:\n    exec(${literal}, globals())\nfinally:\n    __sys.settrace(None)\n`
}

/**
 * Run once, after the player's code finishes successfully, in the same
 * globals namespace, to collect a JSON-safe snapshot of their variables for
 * the variable inspector / dashboard / inventory / dictionary / class panels.
 */
export const SNAPSHOT_SOURCE = `__json.dumps(__snapshot_globals(globals()))`
