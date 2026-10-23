import { useEffect, useRef, useState } from 'react'
import type { TestCase, TestOutcome } from '../types'
import { snapshotEqual } from '../engine/snapshotEqual'
import { TEST_REVEAL_DELAY_MS } from '../hooks/useLevelSession'
import { pyRepr } from './pyValue'

interface TestsPanelProps {
  tests: TestCase[]
  testResults: TestOutcome[] | null
}

export function TestsPanel({ tests, testResults }: TestsPanelProps) {
  // Results all land in one batch, but ticking them in one by one (instead of
  // dumping every checkmark at once) is what actually makes the run feel like
  // it's "checking" each example, giving the player a moment to see it happen.
  // useLevelSession.finishRun delays the success/failed flip by the same
  // total duration, so the completion modal never appears mid-reveal.
  const [revealedCount, setRevealedCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setRevealedCount(0)
    if (!testResults || testResults.length === 0) return

    let revealed = 0
    const revealNext = () => {
      revealed += 1
      setRevealedCount(revealed)
      if (revealed < testResults.length) {
        timerRef.current = setTimeout(revealNext, TEST_REVEAL_DELAY_MS)
      }
    }
    timerRef.current = setTimeout(revealNext, TEST_REVEAL_DELAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [testResults])

  return (
    <div className="tests-panel">
      <div className="tests-panel__title">Testresultat</div>
      <p className="tests-panel__subtitle">
        Kör din kod fritt med "Kör kod" för att testa den själv. Tryck sedan på "Kör tester" för att kontrollera den mot exemplen nedan.
      </p>
      <ul className="tests-panel__list">
        {tests.map((test, index) => {
          const outcome = index < revealedCount ? testResults?.[index] : undefined
          const passed = Boolean(outcome?.ok && snapshotEqual(outcome.value, test.expected))
          const state = !outcome ? 'pending' : passed ? 'pass' : 'fail'
          return (
            <li key={index} className={`tests-panel__item tests-panel__item--${state}`}>
              <span className="tests-panel__icon">{state === 'pass' ? '✓' : state === 'fail' ? '✕' : '…'}</span>
              <div className="tests-panel__body">
                <span className="tests-panel__desc">{test.description}</span>
                {state === 'fail' && (
                  <span className="tests-panel__detail">
                    Fick: {outcome?.ok ? pyRepr(outcome.value ?? null) : `fel – ${outcome?.error === 'missing_function' ? 'funktionen saknas' : outcome?.error}`} · Förväntade: {pyRepr(test.expected)}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
