import { BehaviorObservable, distinctShareReplay, SUSPENSE } from "../../src"
import { EMPTY_VALUE } from "../../src/operators/distinct-share-replay"
import { cold } from "jest-marbles"
import { TestScheduler } from "rxjs/testing"
import { Subject } from "rxjs"

const scheduler = () =>
  new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected)
  })

describe("operators/distinctShareReplay", () => {
  it("only emits distinct values", () => {
    const values = {
      a: { val: 1 },
      b: { val: 2 },
      c: { val: 3 },
      d: { val: 4 },
    }

    let source = "  a-b-b-b-c-c-d|"
    let expected = "a-b-----c---d|"

    expect(cold(source, values).pipe(distinctShareReplay())).toBeObservable(
      cold(expected, values),
    )

    const customCompare = (a: { val: number }, b: { val: number }) =>
      a.val === b.val
    values.c.val = 2

    source = "  a-b-b-b-c-c-d|"
    expected = "a-b---------d|"
    expect(
      cold(source, values).pipe(distinctShareReplay(customCompare)),
    ).toBeObservable(cold(expected, values))
  })

  // prettier-ignore
  it("should restart due to unsubscriptions", () => {
    scheduler().run(({ expectObservable, expectSubscriptions, cold }) => {
      const sourceSubs = []
      const source = cold("a-b-c-d-e-f-g-h-i-j")
      sourceSubs.push("   ^------!----------------------")
      sourceSubs.push("   -----------^------------------")
      const sub1 = "      ^------!"
      const expected1 = " a-b-c-d-"
      const sub2 = "      -----------^------------------"
      const expected2 = " -----------a-b-c-d-e-f-g-h-i-j"

      const shared = source.pipe(distinctShareReplay())

      expectObservable(shared, sub1).toBe(expected1)
      expectObservable(shared, sub2).toBe(expected2)
      expectSubscriptions(source.subscriptions).toBe(sourceSubs)
    })
  })

  // prettier-ignore
  it("should restart due to unsubscriptions when the source has completed", () => {
    scheduler().run(({ expectObservable, expectSubscriptions, cold }) => {
      const sourceSubs = []
      const source = cold('a-(b|)          ');
      sourceSubs.push(    '-^-!            ');
      sourceSubs.push(    '-----------^-!');
      const sub1 =        '-^--!          ';
      const expected1 =   '-a-(b|)         ';
      const sub2 =        '-----------^--!';
      const expected2 =   '-----------a-(b|)';

      const shared = source.pipe(distinctShareReplay());

      expectObservable(shared, sub1).toBe(expected1);
      expectObservable(shared, sub2).toBe(expected2);
      expectSubscriptions(source.subscriptions).toBe(sourceSubs);
    })
  })

  describe("Returns a BehaviorObservable which exposes a getValue function", () => {
    it("getValue returns the latest emitted value", () => {
      const input = new Subject<string>()
      const obs$ = input.pipe(distinctShareReplay()) as BehaviorObservable<
        string
      >

      const subscription = obs$.subscribe()

      input.next("foo")
      expect(obs$.getValue()).toBe("foo")

      input.next("bar")
      expect(obs$.getValue()).toBe("bar")

      subscription.unsubscribe()
    })

    it("getValue throws EMPTY_VALUE if nothing has been emitted", () => {
      const input = new Subject<string>()
      const obs$ = input.pipe(distinctShareReplay()) as BehaviorObservable<
        string
      >

      const subscription = obs$.subscribe()
      let error: any
      try {
        obs$.getValue()
      } catch (e) {
        error = e
      }
      expect(error).toBe(EMPTY_VALUE)
      subscription.unsubscribe()
    })

    it("getValue throws SUSPENSE if the latest emitted value is SUSPENSE", () => {
      const input = new Subject<any>()
      const obs$ = input.pipe(distinctShareReplay()) as BehaviorObservable<any>

      const subscription = obs$.subscribe()
      input.next(SUSPENSE)
      let error: any
      try {
        obs$.getValue()
      } catch (e) {
        error = e
      }
      expect(error).toBe(SUSPENSE)
      subscription.unsubscribe()
    })
  })
})
