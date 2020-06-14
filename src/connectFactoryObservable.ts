import { Observable, NEVER, concat } from "rxjs"
import {
  distinctShareReplay,
  BehaviorObservable,
} from "./operators/distinct-share-replay"
import { ConnectorOptions, defaultConnectorOptions } from "./options"
import { SUSPENSE } from "./"
import { useObservable } from "./useObservable"
import reactEnhancer from "./operators/react-enhancer"

export function connectFactoryObservable<
  A extends (number | string | boolean | null)[],
  O
>(
  getObservable: (...args: A) => Observable<O>,
  _options?: ConnectorOptions<O>,
): [
  (...args: A) => Exclude<O, typeof SUSPENSE>,
  (...args: A) => Observable<O>,
] {
  const options = {
    ...defaultConnectorOptions,
    ..._options,
  }

  const cache = new Map<
    string,
    [BehaviorObservable<O>, BehaviorObservable<O>]
  >()

  const getSharedObservables$ = (
    ...input: A
  ): [BehaviorObservable<O>, BehaviorObservable<O>] => {
    const key = JSON.stringify(input)
    const cachedVal = cache.get(key)

    if (cachedVal !== undefined) {
      return cachedVal
    }

    const sharedObservable$ = distinctShareReplay(options.compare, () => {
      cache.delete(key)
    })(concat(getObservable(...input), NEVER))

    const reactObservable$ = reactEnhancer(
      sharedObservable$,
      options.unsubscribeGraceTime,
    )
    const result: [BehaviorObservable<O>, BehaviorObservable<O>] = [
      sharedObservable$,
      reactObservable$,
    ]

    cache.set(key, result)
    return result
  }
  const getSharedObservable$ = (...input: A) =>
    getSharedObservables$(...input)[0]

  return [
    (...input: A) =>
      useObservable(
        getSharedObservables$(...input)[1],
        options.unsubscribeGraceTime,
      ),

    getSharedObservable$,
  ]
}
