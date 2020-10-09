import { Observable } from "rxjs"

export const startWith = <T>(value: T, source$: Observable<T>) =>
  new Observable<T>((subscriber) => {
    subscriber.next(value)
    return source$.subscribe(subscriber)
  })
