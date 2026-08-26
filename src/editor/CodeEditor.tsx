import { useEffect, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { vscodeDark } from '@uiw/codemirror-theme-vscode'
import { Decoration, EditorView } from '@codemirror/view'
import type { DecorationSet } from '@codemirror/view'
import { StateEffect, StateField } from '@codemirror/state'

const setHighlight = StateEffect.define<number | null>()

const highlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none
  },
  update(deco, tr) {
    for (const e of tr.effects) {
      if (e.is(setHighlight)) {
        if (e.value == null) return Decoration.none
        const lineNumber = Math.max(1, Math.min(e.value, tr.state.doc.lines))
        const line = tr.state.doc.line(lineNumber)
        return Decoration.set([
          Decoration.line({ attributes: { class: 'cm-exec-line' } }).range(line.from)
        ])
      }
    }
    return deco.map(tr.changes)
  },
  provide: (f) => EditorView.decorations.from(f)
})

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  highlightedLine: number | null
  readOnly?: boolean
}

export function CodeEditor({ value, onChange, highlightedLine, readOnly }: CodeEditorProps) {
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({ effects: setHighlight.of(highlightedLine) })
    if (highlightedLine != null) {
      const lineNumber = Math.max(1, Math.min(highlightedLine, view.state.doc.lines))
      const line = view.state.doc.line(lineNumber)
      view.dispatch({ effects: EditorView.scrollIntoView(line.from, { y: 'center' }) })
    }
  }, [highlightedLine])

  return (
    <div className="code-editor">
      <CodeMirror
        value={value}
        height="100%"
        theme={vscodeDark}
        extensions={[python(), highlightField]}
        readOnly={readOnly}
        basicSetup={{ tabSize: 4, indentOnInput: true }}
        onChange={onChange}
        onCreateEditor={(view: EditorView) => {
          viewRef.current = view
        }}
      />
    </div>
  )
}
