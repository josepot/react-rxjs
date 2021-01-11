import { Observable, Subscription, Subject, noop } from "rxjs"
import { BehaviorObservable } from "./BehaviorObservable"
import { EMPTY_VALUE } from "./empty-value"
import { SUSPENSE } from "../SUSPENSE"

const shareLatest = <T>(
  source$: Observable<T>,
  shouldComplete = true,
  defaultValue: T = EMPTY_VALUE,
  teardown = noop,
): BehaviorObservable<T> => {
  let subject: Subject<T> | null
  let subscription: Subscription | null
  let refCount = 0
  let currentValue: T = EMPTY_VALUE
  let promise: Promise<T> | null

  const emitIfEmpty =
    defaultValue === EMPTY_VALUE
      ? noop
      : () => {
          currentValue === EMPTY_VALUE &&
            subject &&
            subject!.next((currentValue = defaultValue))
        }

  const result = new Observable<T>((subscriber) => {
    if (!shouldComplete) subscriber.complete = noop

    refCount++
    let innerSub: Subscription
    if (!subject) {
      subject = new Subject<T>()
      innerSub = subject.subscribe(subscriber)
      subscription = null
      subscription = source$.subscribe(
        (value) => {
          subject!.next((currentValue = value))
        },
        (err) => {
          const _subject = subject
          subscription = null
          subject = null
          _subject!.error(err)
        },
        () => {
          subscription = null
          emitIfEmpty()
          subject!.complete()
        },
      )
      emitIfEmpty()
      if (subscription.closed) subscription = null
    } else {
      innerSub = subject.subscribe(subscriber)
      if (currentValue !== EMPTY_VALUE) {
        subscriber.next(currentValue)
      }
    }

    return () => {
      refCount--
      innerSub.unsubscribe()
      if (refCount === 0) {
        currentValue = EMPTY_VALUE
        if (subscription) {
          subscription.unsubscribe()
        }
        teardown()
        subject = null
        subscription = null
        promise = null
      }
    }
  }) as BehaviorObservable<T>

  result.aH = (n: any, e: any) => {
    let subscription
    if (defaultValue === EMPTY_VALUE) {
      subscription = subject!.subscribe(n, e)
      if (currentValue !== EMPTY_VALUE) {
        n(currentValue)
      }
    } else {
      subscription = result.subscribe(n, e)
    }
    return subscription
  }

  let error: any = EMPTY_VALUE
  let timeoutToken: any
  result.gV = (): T => {
    if ((currentValue as any) !== SUSPENSE && currentValue !== EMPTY_VALUE) {
      return currentValue
    }
    if (defaultValue !== EMPTY_VALUE) return defaultValue

    if (error !== EMPTY_VALUE) {
      clearTimeout(timeoutToken)
      timeoutToken = setTimeout(() => {
        error = EMPTY_VALUE
      }, 50)
      throw error
    }

    if (!subscription) {
      throw new Error("Missing subscription")
    }
    if (promise) throw promise

    throw (promise = new Promise<T>((res) => {
      const setError = (e: any) => {
        error = e
        timeoutToken = setTimeout(() => {
          error = EMPTY_VALUE
        }, 50)
        res()
        promise = null
      }
      const pSubs = subject!.subscribe(
        (v) => {
          if (v !== (SUSPENSE as any)) {
            pSubs.unsubscribe()
            res(v)
            promise = null
          }
        },
        setError,
        () => {
          setError(new Error("Empty observable"))
        },
      )
      subscription!.add(pSubs)
    }))
  }

  return result
}
export default shareLatest
