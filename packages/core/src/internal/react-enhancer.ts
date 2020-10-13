import { Observable } from "rxjs"
import { SUSPENSE } from "../SUSPENSE"
import { BehaviorObservable } from "./BehaviorObservable"
import { EMPTY_VALUE } from "./empty-value"

const reactEnhancer = <T>(
  source$: Observable<T>,
  defaultValue: T,
): BehaviorObservable<T> => {
  const result = new Observable<T>((subscriber) =>
    source$.subscribe(subscriber),
  ) as BehaviorObservable<T>

  let promise: Promise<T | void> | undefined
  let error: any = EMPTY_VALUE
  const getValue = (): T => {
    let timeoutToken
    if (error !== EMPTY_VALUE) {
      clearTimeout(timeoutToken)
      timeoutToken = setTimeout(() => {
        error = EMPTY_VALUE
      }, 50)
      throw error
    }

    try {
      return (source$ as BehaviorObservable<T>).getValue()
    } catch (e) {
      if (defaultValue !== EMPTY_VALUE) return defaultValue
      if (promise) throw promise

      let value: typeof EMPTY_VALUE | T = EMPTY_VALUE

      promise = new Promise<T>((res) => {
        const subscription = result.subscribe(
          (v) => {
            if (v !== (SUSPENSE as any)) {
              value = v
              subscription && subscription.unsubscribe()
              res(v)
            }
          },
          (e) => {
            error = e
            timeoutToken = setTimeout(() => {
              error = EMPTY_VALUE
            }, 50)
            res()
          },
        )
        if (value !== EMPTY_VALUE) {
          subscription.unsubscribe()
        }
      }).finally(() => {
        promise = undefined
      })

      if (value !== EMPTY_VALUE) return value

      throw error !== EMPTY_VALUE ? error : promise
    }
  }
  result.getValue = getValue
  return result
}

export default reactEnhancer
