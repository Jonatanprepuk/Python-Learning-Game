import type { FriendlyError } from '../types'

/**
 * Pyodide surfaces Python errors as a JS error whose message is the full
 * CPython traceback text. We pattern-match the last line ("XyzError: ...")
 * plus the last "line N" reference to build a friendly Swedish explanation.
 */
export function translateError(raw: string): FriendlyError {
  const cleaned = raw.replace(/^PythonError:\s*/i, '').trim()
  const lines = cleaned.split('\n').filter(Boolean)
  const lastLine = lines[lines.length - 1] ?? cleaned

  // The player's code runs as its own exec()'d unit (see buildSource), so the
  // innermost "line N" in the traceback is already the player's own line —
  // no preamble-length offset needed.
  const lineMatch = [...cleaned.matchAll(/line (\d+)/g)].pop()
  let line = lineMatch ? parseInt(lineMatch[1], 10) : undefined
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
        'Koden gjorde alldeles för många saker för att vara ett litet övningsprogram – vanligen betyder det en while-loop som aldrig blir klar, en for-loop med ett alldeles för stort tal, eller en funktion som anropar sig själv (rekursion) utan att någonsin stanna. Kontrollera att villkoret i din loop verkligen kan bli falskt, eller att en rekursiv funktion har ett fall som avslutar den.'
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
      if (/can only concatenate str/.test(detail)) {
        return {
          ...base,
          title: 'Fel datatyp',
          message: `Du försökte slå ihop text med något som inte är text${line ? ` på rad ${line}` : ''}. Gör om värdet till text med str(...), eller använd en f-sträng: f"...{variabel}...".`
        }
      }
      if (/unsupported operand type/.test(detail)) {
        return {
          ...base,
          title: 'Fel datatyp',
          message: `De här värdena går inte att räkna ihop med varandra${line ? ` på rad ${line}` : ''}. Kontrollera att båda har samma typ, till exempel att båda är int eller båda är str.`
        }
      }
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
