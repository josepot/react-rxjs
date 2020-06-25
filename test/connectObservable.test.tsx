import {
  act as componentAct,
  fireEvent,
  render,
  screen,
} from "@testing-library/react"
import { act, renderHook } from "@testing-library/react-hooks"
import React, { Suspense, useEffect, useRef, FC } from "react"
import { BehaviorSubject, defer, from, of, Subject } from "rxjs"
import { delay, scan, startWith, map } from "rxjs/operators"
import { connectObservable, SUSPENSE } from "../src"

const wait = (ms: number) => new Promise(res => setTimeout(res, ms))

describe("connectObservable", () => {
  const originalError = console.error
  beforeAll(() => {
    console.error = (...args: any) => {
      if (/Warning.*not wrapped in act/.test(args[0])) {
        return
      }
      originalError.call(console, ...args)
    }
  })

  afterAll(() => {
    console.error = originalError
  })

  it("sets the initial state synchronously if it's available", async () => {
    const observable$ = of(1)
    const [useLatestNumber] = connectObservable(observable$)

    const { result } = renderHook(() => useLatestNumber())
    expect(result.current).toEqual(1)
  })

  it("updates with the last emitted value", async () => {
    const numberStream = new BehaviorSubject(1)
    const [useNumber] = connectObservable(numberStream)
    const { result } = renderHook(() => useNumber())
    expect(result.current).toBe(1)

    act(() => {
      numberStream.next(2)
    })
    expect(result.current).toBe(2)
  })

  it("allows React to batch synchronous updates", async () => {
    const numberStream = new BehaviorSubject(1)
    const stringStream = new BehaviorSubject("a")
    const [useNumber] = connectObservable(numberStream)
    const [useString] = connectObservable(stringStream)

    const BatchComponent: FC<{
      onUpdate: () => void
    }> = ({ onUpdate }) => {
      const number = useNumber()
      const string = useString()
      useEffect(onUpdate)
      return (
        <>
          {number} {string}
        </>
      )
    }

    const updates = jest.fn()
    render(<BatchComponent onUpdate={updates} />)
    expect(updates).toHaveBeenCalledTimes(1)

    componentAct(() => {
      numberStream.next(2)
      numberStream.next(3)
      stringStream.next("b")
    })
    expect(updates).toHaveBeenCalledTimes(2)
  })

  it("Only update when the previous and current update are distinct according to the comparator function", async () => {
    interface TestUpdate {
      value: number
      valueToIgnore: string
    }
    const stream$ = new BehaviorSubject<TestUpdate>({
      value: 0,
      valueToIgnore: "A",
    })

    const compare = (a: TestUpdate, b: TestUpdate) => a.value === b.value
    const [useLatestValue] = connectObservable(stream$, { compare })
    const useLatestValueWithUpdates = () => {
      const nUpdates = useRef(0)
      const latestValue = useLatestValue()
      useEffect(() => {
        nUpdates.current++
      })
      return {
        latestValue,
        nUpdates,
      }
    }

    const { result } = renderHook(() => useLatestValueWithUpdates())
    expect(result.current.latestValue.valueToIgnore).toEqual("A")
    expect(result.current.latestValue.value).toEqual(0)
    expect(result.current.nUpdates.current).toEqual(1)

    act(() => {
      stream$.next({ value: 0, valueToIgnore: "B" })
    })

    //should not update to the latest value in the stream
    expect(result.current.latestValue.valueToIgnore).toEqual("A")
    expect(result.current.latestValue.value).toEqual(0)
    //should not trigger a react update
    expect(result.current.nUpdates.current).toEqual(1)

    act(() => {
      stream$.next({ value: 1, valueToIgnore: "B" })
    })
    expect(result.current.latestValue.valueToIgnore).toEqual("B")
    expect(result.current.latestValue.value).toEqual(1)
    expect(result.current.nUpdates.current).toEqual(2)
  })

  it("shares the source subscription until the refCount has stayed at zero for the grace-period", async () => {
    let nInitCount = 0
    const observable$ = defer(() => {
      nInitCount += 1
      return from([1, 2, 3, 4, 5])
    })

    const [useLatestNumber] = connectObservable(observable$, {
      unsubscribeGraceTime: 100,
    })
    const { unmount } = renderHook(() => useLatestNumber())
    const { unmount: unmount2 } = renderHook(() => useLatestNumber())
    const { unmount: unmount3 } = renderHook(() => useLatestNumber())
    expect(nInitCount).toBe(1)
    unmount()
    unmount2()
    unmount3()

    await wait(90)
    const { unmount: unmount4 } = renderHook(() => useLatestNumber())
    expect(nInitCount).toBe(1)
    unmount4()

    await wait(110)
    renderHook(() => useLatestNumber())
    expect(nInitCount).toBe(2)
  })

  it("suspends the component when the observable hasn't emitted yet.", async () => {
    const source$ = of(1).pipe(delay(100))
    const [useDelayedNumber] = connectObservable(source$)
    const Result: React.FC = () => <div>Result {useDelayedNumber()}</div>
    const TestSuspense: React.FC = () => {
      return (
        <Suspense fallback={<span>Waiting</span>}>
          <Result />
        </Suspense>
      )
    }

    render(<TestSuspense />)

    expect(screen.queryByText("Result")).toBeNull()
    expect(screen.queryByText("Waiting")).not.toBeNull()

    await wait(110)

    expect(screen.queryByText("Result 1")).not.toBeNull()
    expect(screen.queryByText("Waiting")).toBeNull()
  })

  it("suspends the component when the observable emits SUSPENSE", async () => {
    const subject$ = new Subject()
    const source$ = subject$.pipe(
      scan(a => a + 1, 0),
      map(x => {
        if (x === 1) {
          return SUSPENSE
        }
        return x
      }),
      startWith(0),
    )
    const [useDelayedNumber] = connectObservable(source$)
    const Result: React.FC = () => <div>Result {useDelayedNumber()}</div>
    const TestSuspense: React.FC = () => {
      return (
        <div>
          <button onClick={() => subject$.next()}>Next</button>
          <Suspense fallback={<span>Waiting</span>}>
            <Result />
          </Suspense>
        </div>
      )
    }

    render(<TestSuspense />)

    expect(screen.queryByText("Result 0")).not.toBeNull()
    expect(screen.queryByText("Waiting")).toBeNull()

    fireEvent.click(screen.getByText(/Next/i))

    expect(screen.queryByText("Waiting")).not.toBeNull()

    fireEvent.click(screen.getByText(/Next/i))

    expect(screen.queryByText("Result 2")).not.toBeNull()
    expect(screen.queryByText("Waiting")).toBeNull()
  })

  it("keeps in suspense if more than two SUSPENSE are emitted in succesion", async () => {
    const subject$ = new Subject()
    const source$ = subject$.pipe(
      scan(a => a + 1, 0),
      map(x => {
        if (x <= 2) {
          return SUSPENSE
        }
        return x
      }),
      startWith(0),
    )
    const [useDelayedNumber] = connectObservable(source$)
    const Result: React.FC = () => <div>Result {useDelayedNumber()}</div>
    const TestSuspense: React.FC = () => {
      return (
        <div>
          <button onClick={() => subject$.next()}>Next</button>
          <Suspense fallback={<span>Waiting</span>}>
            <Result />
          </Suspense>
        </div>
      )
    }

    render(<TestSuspense />)

    expect(screen.queryByText("Result 0")).not.toBeNull()
    expect(screen.queryByText("Waiting")).toBeNull()

    fireEvent.click(screen.getByText(/Next/i))

    expect(screen.queryByText("Waiting")).not.toBeNull()

    fireEvent.click(screen.getByText(/Next/i))

    expect(screen.queryByText("Waiting")).not.toBeNull()

    fireEvent.click(screen.getByText(/Next/i))

    expect(screen.queryByText("Result 3")).not.toBeNull()
    expect(screen.queryByText("Waiting")).toBeNull()
  })
})
