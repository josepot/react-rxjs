import { Observable } from "rxjs"
import { SUSPENSE } from "../SUSPENSE"
import connectFactoryObservable from "./connectFactoryObservable"
import connectObservable from "./connectObservable"

/**
 * Binds an observable to React
 *
 * @param observable Source observable to be used by the hook.
 * @param unsubscribeGraceTime (= 200): Amount of time in ms that the shared
 * observable should wait before unsubscribing from the source observable when
 * there are no new subscribers.
 * @returns [1, 2]
 * 1. A React Hook that yields the latest emitted value of the observable
 * 2. A `sharedLatest` version of the observable. It can be used for composing
 * other streams that depend on it. The shared subscription is closed as soon as
 * there are no subscribers to that observable.
 *
 * @remarks If the Observable doesn't synchronously emit a value upon the first
 * subscription, then the hook will leverage React Suspense while it's waiting
 * for the first value.
 */
export function bind<T>(
  observable: Observable<T>,
  unsubscribeGraceTime?: number,
): [() => Exclude<T, typeof SUSPENSE>, Observable<T>]

/**
 * Binds a factory observable to React
 *
 * @param getObservable Factory of observables. The arguments of this function
 *  will be the ones used in the hook.
 * @param unsubscribeGraceTime (= 200): Amount of time in ms that the shared
 *  observable should wait before unsubscribing from the source observable when
 *  there are no new subscribers.
 * @returns [1, 2]
 * 1. A React Hook function with the same parameters as the factory function.
 *  This hook will yield the latest update from the observable returned from
 *  the factory function.
 * 2. A `sharedLatest` version of the observable generated by the factory
 *  function that can be used for composing other streams that depend on it.
 *  The shared subscription is closed as soon as there are no subscribers to
 *  that observable.
 *
 * @remarks If the Observable doesn't synchronously emit a value upon the first
 * subscription, then the hook will leverage React Suspense while it's waiting
 * for the first value.
 */
export function bind<
  A extends (number | string | boolean | null | Object | Symbol)[],
  O
>(
  getObservable: (...args: A) => Observable<O>,
  unsubscribeGraceTime?: number,
): [(...args: A) => Exclude<O, typeof SUSPENSE>, (...args: A) => Observable<O>]

export function bind<
  A extends (number | string | boolean | null | Object | Symbol)[],
  O
>(
  obs: ((...args: A) => Observable<O>) | Observable<O>,
  unsubscribeGraceTime = 200,
) {
  return (typeof obs === "function"
    ? (connectFactoryObservable as any)
    : connectObservable)(obs, unsubscribeGraceTime)
}
