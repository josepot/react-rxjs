import { Observable } from "rxjs"

const noop = Function.prototype as () => void

const delayUnsubscription = <T>(delayTime: number) => (
  source$: Observable<T>,
): Observable<T> => {
  if (delayTime === 0) {
    return source$
  }
  let cancelUnsubscription = noop
  return new Observable<T>(subscriber => {
    let isActive = true
    const subscription = source$.subscribe({
      next(value) {
        if (isActive) {
          subscriber.next(value)
        }
      },
      error(e) {
        subscriber.error(e)
      },
      complete() {
        subscriber.complete()
      },
    })
    cancelUnsubscription()
    return () => {
      isActive = false
      let timeoutToken: NodeJS.Timeout | undefined =
        delayTime < Infinity
          ? setTimeout(() => {
              timeoutToken = undefined
              subscription.unsubscribe()
            }, delayTime)
          : undefined
      cancelUnsubscription()
      cancelUnsubscription = () => {
        clearTimeout(timeoutToken!)
        subscription.unsubscribe()
        cancelUnsubscription = noop
      }
    }
  })
}

export default delayUnsubscription
