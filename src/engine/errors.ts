import type { FriendlyError } from '../types'

/**
 * Pyodide surfaces Python errors as a JS error whose message is the full
 * CPython traceback text. We pattern-match the last line ("XyzError: ...")
 * plus the last "line N" reference to build a friendly Swedish explanation.
 */
export function translateError(raw: string, lineOffset = 0): FriendlyError {
  const cleaned = raw.replace(/^PythonError:\s*/i, '').trim()
  const lines = cleaned.split('\n').filter(Boolean)
  const lastLine = lines[lines.length - 1] ?? cleaned

  const lineMatch = [...cleaned.matchAll(/line (\d+)/g)].pop()
  let line = lineMatch ? parseInt(lineMatch[1], 10) - lineOffset : undefined
  if (line !== undefined && line < 1) line = undefined

  const base: Omit<FriendlyError, 'title' | 'message'> = {
    line,
    technical: lastLine
  }

  if (cleaned.includes('INFINITE_LOOP')) {
    return {
      ...base,
      title: 'Programmet körde för länge',
      message:
        'Det ser ut som en oändlig loop – koden verkar aldrig sluta köra. Kontrollera att din while-loop verkligen kan ta slut.'
    }
  }

  const errorMatch = lastLine.match(/^(\w+Error|Exception):\s*(.*)$/)
  const errorType = errorMatch?.[1] ?? 'Error'
  const detail = errorMatch?.[2] ?? lastLine

  switch (errorType) {
    case 'SyntaxError': {
      if (/expected ':'/.test(detail)) {
        return {
          ...base,
          title: 'Något blev fel',
          message: `Det verkar saknas ett ":" i slutet av raden${line ? ` (rad ${line})` : ''}. Rader med if, for, while eller def ska avslutas med ":".`
        }
      }
      if (/unexpected indent/i.test(detail)) {
        return {
          ...base,
          title: 'Något blev fel',
          message: `Indraget stämmer inte${line ? ` på rad ${line}` : ''}. Python bryr sig om mellanslag i början av raden – kontrollera att raderna i samma block har samma indrag.`
        }
      }
      if (/was never closed|unmatched/i.test(detail)) {
        return {
          ...base,
          title: 'Något blev fel',
          message: `Det verkar saknas en avslutande parentes${line ? ` nära rad ${line}` : ''}.`
        }
      }
      return {
        ...base,
        title: 'Något blev fel med koden',
        message: `Python förstår inte koden${line ? ` på rad ${line}` : ''}. Kontrollera stavning, parenteser och kolon.`
      }
    }
    case 'IndentationError':
      return {
        ...base,
        title: 'Något blev fel',
        message: `Indraget stämmer inte${line ? ` på rad ${line}` : ''}. Kontrollera att koden i samma block börjar lika långt in.`
      }
    case 'NameError': {
      const nameMatch = detail.match(/name '(\w+)' is not defined/)
      const name = nameMatch?.[1]
      return {
        ...base,
        title: 'Okänt kommando',
        message: name
          ? `"${name}" känns inte igen. Kontrollera att du har stavat kommandot rätt, till exempel move(), turn_left(), turn_right() eller collect().`
          : 'Ett okänt namn användes i koden.'
      }
    }
    case 'TypeError': {
      if (/positional argument/.test(detail) || /argument/.test(detail)) {
        return {
          ...base,
          title: 'Fel antal argument',
          message: `Ett kommando anropades med fel antal parenteser eller argument${line ? ` på rad ${line}` : ''}. De flesta kommandon i spelet, som move(), skrivs helt utan något inuti parenteserna.`
        }
      }
      return {
        ...base,
        title: 'Något blev fel',
        message: `Fel typ av värde användes${line ? ` på rad ${line}` : ''}.`
      }
    }
    case 'AttributeError':
      return {
        ...base,
        title: 'Okänt kommando',
        message: `Det kommandot finns inte. Kontrollera stavningen mot listan över tillgängliga kommandon.`
      }
    case 'ZeroDivisionError':
      return {
        ...base,
        title: 'Division med noll',
        message: 'Koden försökte dela med noll, vilket inte går.'
      }
    case 'RecursionError':
      return {
        ...base,
        title: 'För djup upprepning',
        message:
          'En funktion verkar anropa sig själv om och om igen utan att sluta. Kontrollera att funktionen inte kallar på sig själv oändligt.'
      }
    case 'IndexError':
      return {
        ...base,
        title: 'Något blev fel',
        message: `Koden försökte komma åt något som inte finns${line ? ` på rad ${line}` : ''}.`
      }
    default:
      return {
        ...base,
        title: 'Något blev fel',
        message: `Python stötte på ett problem${line ? ` på rad ${line}` : ''}: ${detail || errorType}.`
      }
  }
}
