import { useState, useLayoutEffect } from "react"
import { Observable } from "rxjs"
import delayUnsubscription from "./operators/delay-unsubscription"
import { defaultFactoryOptions, ObservableOptions } from "./options"

const useObservable = <O, I>(
  source$: Observable<O>,
  initialValue: I,
  options?: ObservableOptions,
) => {
  const { suspenseTime, unsubscribeGraceTime } = {
    ...defaultFactoryOptions,
    ...options,
  }
  const [state, setState] = useState<I | O>(initialValue)

  useLayoutEffect(() => {
    let timeoutToken =
      suspenseTime === Infinity
        ? undefined
        : setTimeout(setState, suspenseTime, initialValue)

    const subscription = delayUnsubscription(unsubscribeGraceTime)(
      source$,
    ).subscribe(nextState => {
      setState(nextState as any)
      timeoutToken = timeoutToken && (clearTimeout(timeoutToken) as undefined)
    })

    return () => subscription.unsubscribe()
  }, [source$, suspenseTime, unsubscribeGraceTime])

  return state
}

export default useObservable
