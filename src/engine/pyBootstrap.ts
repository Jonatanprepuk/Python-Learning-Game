// Python preamble injected before the player's own code. Defines the
// beginner-friendly robot API as plain Python functions that call back
// into JS (registered as globals by the worker) to mutate/query the
// simulated world. Using sys._getframe(1) lets each builtin report the
// exact source line of the *call site* in the player's code.
export const PREAMBLE = `import sys as __sys

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
`

export const PREAMBLE_LINE_COUNT = PREAMBLE.split('\n').length

export function buildSource(userCode: string): string {
  return `${PREAMBLE}\n${userCode}\n`
}
