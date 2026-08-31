import type { TraceStep } from '../types'
import { pyRepr } from './pyValue'

interface FunctionMachinePanelProps {
  lastCall: TraceStep['callInfo'] | null
  lastReturn: TraceStep['returnInfo'] | null
}

export function FunctionMachinePanel({ lastCall, lastReturn }: FunctionMachinePanelProps) {
  const args = lastCall ? Object.entries(lastCall.args) : []

  return (
    <div className="function-machine">
      <div className="function-machine__title">Funktionsmaskinen</div>
      {!lastCall ? (
        <p className="function-machine__empty">Kör koden – när en funktion anropas visas den här.</p>
      ) : (
        <div className="function-machine__diagram">
          <div className="function-machine__inputs">
            {args.length === 0 ? (
              <span className="function-machine__no-args">inga argument</span>
            ) : (
              args.map(([name, value]) => (
                <span className="function-machine__value" key={name}>
                  {name} = {pyRepr(value)}
                </span>
              ))
            )}
          </div>
          <span className="function-machine__arrow">→</span>
          <div className="function-machine__box">{lastCall.name}()</div>
          <span className="function-machine__arrow">→</span>
          <div className="function-machine__output">
            {lastReturn && lastReturn.name === lastCall.name ? (
              <span className="function-machine__value function-machine__value--return">{pyRepr(lastReturn.value)}</span>
            ) : (
              <span className="function-machine__pending">körs …</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
