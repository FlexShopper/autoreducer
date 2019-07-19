# useAutoReducer

[![Build Status](https://travis-ci.com/FlexShopper/autoreducer.svg?branch=master)](https://travis-ci.com/FlexShopper/autoreducer)

`useAutoReducer` is a React Hook around `useReducer` that aims to simplify and streamline the usage of complex state in functional React components.  Its primary design goal is simplicity and predictability.

## Example

```typescript jsx

import { useAutoReducer } from 'autoreducer';

function MyComponent() {
    const [ dispatch, state ] = useAutoReducer({
        topCount: 0,
        bottomCount: 0 
    }, {
        incrementTop: (prevState) => () => {
            return { topCount: prevState.topCount + 1 };
        },
        incrementBottom: (prevState) => () => {
            return { bottomCount: prevState.bottomCount + 1 };
        },
        incrementBoth: (prevState) => () => {
            return { bottomCount: prevState.bottomCount + 1, topCount: prevState.topCount + 1 };
        }       
    });

    return <div>
        <a onClick={dispatch.incrementTop}>Top: {state.topCount}</a>
        <a onClick={dispatch.incrementBottom}>Top: {state.bottomCount}</a>
        <a onClick={dispatch.incrementBoth}>Increment both</a>
    </div>
}

```

## Usage

`useAutoReducer` expects two arguments: a state object and an optional set of custom action creators to be added to the dispatcher, and returns an array of `[state, dispatcher]`.

The state object can be whatever you want it to be.  Keys from the state object will get parsed and automatically added to the dispatcher as a single-value updater.  For example, if you passed a state object of `{foo: 1}`, `dispatch.foo(newFoo: number)` gets added to the dispatcher.  As a result, custom actions cannot share the same name as state keys.

Custom actions are also automatically added to the dispatcher with the keys you provide.  Action creators are functions that take the previous state and return an action (a function that returns a partial state update).  Or, more simply, they take the format: `(prevState: State) => (...args: any[]) => Partial<State>`.  The action creators can only accept 0 or 1 (prevState) argument.  Actions themselves can take arguments and they will need to be called with those arguments when they're called from the dispatcher. 

Check out [the tests](https://github.com/FlexShopper/autoreducer/blob/master/src/__tests__/useAutoReducer.tsx) for more examples!

## TypeScript

autoreducer ships with TS definitions, so it should Just Work out of the box!
