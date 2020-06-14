# re-rxjs
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

## The ultimate React-RxJS bindings

- :cyclone: Truly Reactive
- :twisted_rightwards_arrows: First class support for React Suspense
- :scissors: Decentralized and composable, thus enabling optimal code-splitting
- :zap: Highly performant (while avoiding memory leaks)
- :microscope: Tiny and tree-shakeable

## Examples

- [This is a contrived example](https://codesandbox.io/s/crazy-wood-vn7gg?file=/src/fakeApi.js) based on [this example](https://reactjs.org/docs/concurrent-mode-patterns.html#reviewing-the-changes) from the React docs.

## Docs
```tsx
const useDocs = () => useObservable(NEVER)

function Docs() {
  const docs = useDocs()
  return <pre>{docs}</pre>
}

function App() {
  return (
    <>
      <h1>Docs</h1>
      <Suspense fallback={() => <h2>Comming soon...</h1>}>
        <Docs />
      </Suspense>
    </>
  )
}
```

Now seriously: they are coming soon, for real! 

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/josepot"><img src="https://avatars1.githubusercontent.com/u/8620144?v=4" width="100px;" alt=""/><br /><sub><b>Josep M Sobrepere</b></sub></a><br /><a href="https://github.com/re-rxjs/re-rxjs/commits?author=josepot" title="Code">💻</a> <a href="#ideas-josepot" title="Ideas, Planning, & Feedback">🤔</a> <a href="#maintenance-josepot" title="Maintenance">🚧</a> <a href="https://github.com/re-rxjs/re-rxjs/commits?author=josepot" title="Tests">⚠️</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!