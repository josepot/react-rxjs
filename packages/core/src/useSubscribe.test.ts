import { defer, Subject } from "rxjs"
import { share, finalize } from "rxjs/operators"
import { renderHook } from "@testing-library/react-hooks"
import { useSubscribe } from "./"

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms))

describe("useSubscribe", () => {
  it("subscribes to the provided observable and remains subscribed until it's unmounted", async () => {
    let nSubscriptions = 0
    const source$ = defer(() => {
      nSubscriptions++
      return new Subject()
    }).pipe(
      finalize(() => {
        nSubscriptions--
      }),
      share(),
    )

    expect(nSubscriptions).toBe(0)

    const { unmount } = renderHook(() => useSubscribe(source$, 201))

    expect(nSubscriptions).toBe(1)

    unmount()
    expect(nSubscriptions).toBe(1)

    await wait(250)

    expect(nSubscriptions).toBe(0)
  })
})
