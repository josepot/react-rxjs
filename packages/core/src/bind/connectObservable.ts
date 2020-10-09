import { Observable } from "rxjs"
import shareLatest from "../internal/share-latest"
import reactEnhancer from "../internal/react-enhancer"
import { useObservable } from "../internal/useObservable"
import { startWith } from "../internal/startWith"

/**
 * Accepts: An Observable.
 *
 * Returns [1, 2]
 * 1. A React Hook that yields the latest emitted value of the observable
 * 2. A `sharedLatest` version of the observable. It can be used for composing
 * other streams that depend on it. The shared subscription is closed as soon as
 * there are no subscribers to that observable.
 *
 * @param observable Source observable to be used by the hook.
 *
 * @remarks If the Observable doesn't synchronously emit a value upon the first
 * subscription, then the hook will leverage React Suspense while it's waiting
 * for the first value.
 */
export default function connectObservable<T>(
  observable: Observable<T>,
  defaultValue?: T,
) {
  const defaultedObservable =
    arguments.length === 2 ? startWith(defaultValue!, observable) : observable
  const sharedObservable$ = shareLatest<T>(defaultedObservable, false)
  const reactObservable$ = reactEnhancer(sharedObservable$)
  const useStaticObservable = () => useObservable(reactObservable$)
  return [useStaticObservable, sharedObservable$] as const
}
