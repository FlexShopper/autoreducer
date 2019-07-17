/* tslint:disable:jsdoc-format */
import { useReducer } from 'react';

export type SimpleDispatcher<State extends {}> = {
    [key in keyof State]: (value: State[key]) => void;
};
export type CustomDispatcher<State extends AutoReducerState, CustomActions extends AutoReducerCustomActions<State>> = {
    [key in keyof CustomActions]: (...args: Parameters<ReturnType<CustomActions[key]>>) => void;
};

interface AutoReducerStateAction<State extends {}, K extends keyof State = keyof State> {
    key: K;
    type: 'state';
    value: State[K];
}

/*
The three `any` uses in the following interfaces can't be avoided because they can't be generic, since
args are actually a tuple instead of an array.
 */

interface AutoReducerActionAction<CustomActions extends {}, K extends keyof CustomActions = keyof CustomActions> {
    key: K;
    type: 'custom';
    value: CustomActions[K];
    // tslint:disable-next-line:no-any
    args?: any[];
}

interface AutoReducerState {
    // tslint:disable-next-line:no-any
    [key: string]: any;
}

interface AutoReducerCustomActions<State extends AutoReducerState> {
    // tslint:disable-next-line:no-any
    [key: string]: ((state: State) => (...args: any[]) => Partial<State>);
}

type SimpleReducerInternalAction<State extends {}, CustomActions extends {}> =
    | AutoReducerActionAction<CustomActions>
    | AutoReducerStateAction<State>;

type AutoDispatcher<State extends AutoReducerState, CustomActions extends AutoReducerCustomActions<State>> =
    SimpleDispatcher<State> & CustomDispatcher<State, CustomActions>;

/**
 * Creates a reducer for you, automatically!
 *
 * useAutoReducer returns a [state, dispatcher] tuple to facilitate easily reducing multiple state values.
 *
 * It takes a first parameter, the initialState, and a second (optional) parameter, a list of custom actions.
 * Custom actions must be in this form: (state) => (...args) => state.
 *
 * useAutoReducer sets up a dispatcher with all of the state keys so you can pass it a {username: ""} and
 * dispatcher.username(newUsername: string) will be created for you.  It also adds all of your actions to the
 * dispatcher, so if you have { increment: state => (by: number) => ({...state, counter: state.counter + by}) }
 * then dispatcher.increment(by: number) will be created for you.
 *
 * Example:
 <pre>
 const [state, dispatch] = useAutoReducer({
        username: "",
        clicks: ""
    }, {
        increment: (state) => (by: number = 1) => ({ ...state, clicks: state.clicks + by })
    });

 return <a onClick={() => dispatch.increment(1)}>I've been clicked {state.clicks} times.</a>

 </pre>

 Be careful with default arguments in the returned action callback, because you may wind up getting invoked with an
 event accidentally (e.g. `<a onClick={dispatch.increment} />` will not work because the onClick event will be passed
 as `by`).
 * @param initialState
 * @param actions
 */
// arrow funcs can't be generic
// @formatter:off
// tslint:disable-next-line:only-arrow-functions
export function useAutoReducer<
    State extends AutoReducerState,
    CustomActions extends AutoReducerCustomActions<State>
>(initialState: State, actions?: CustomActions): [ State, AutoDispatcher<State, CustomActions> ] {
// @formatter:on
    Object.keys(actions || {}).forEach(name => {
        if (Object.prototype.hasOwnProperty.call(initialState, name)) {
            throw new Error(`Duplicate key in state and actions: ${name}`);
        }
    });

    const reducer = (lastState: State, action: SimpleReducerInternalAction<State, CustomActions>): State => {
        switch (action.type) {
            case 'state':
                return {
                    ...lastState,
                    [action.key]: action.value,
                };
            case 'custom':
            default: {
                const key = action.key as keyof CustomActions;

                if (actions && actions[key]) {
                    if (Array.isArray(action.args) && action.args.length > 0) {
                        return {
                            ...lastState,
                            ...action.value(lastState)(...action.args),
                        };
                    } else {
                        return {
                            ...lastState,
                            ...action.value(lastState)(),
                        };
                    }
                } else {
                    throw new Error('Somehow you tried to dispatch an action that was not initialized');
                }
            }
        }
    };

    const [ state, dispatch ] = useReducer(reducer, initialState);

    const stateDispatcher: SimpleDispatcher<State> = Object.keys(initialState).map((unsafeName: string) => {
        const name = unsafeName as keyof State;
        return {
            cb: (value: State[keyof State]) => {
                dispatch({
                    key: name,
                    type: 'state',
                    value,
                });
            },
            name,
        };
    }).reduce((acc, curr) => {
        acc[curr.name] = curr.cb;
        return acc;
        // can't figure out a way to make TS like this otherwise
        // tslint:disable-next-line:no-object-literal-type-assertion
    }, {} as { [key in keyof State]: (value: State[key]) => void });

    const customDispatcher: CustomDispatcher<State, CustomActions> | null = !actions ? null :
        Object.keys(actions).map((unsafeName: string) => {
            const name = unsafeName as keyof CustomActions;
            const action = actions[name];

            return {
                cb: (...args: Array<Parameters<ReturnType<typeof action>>>) => {
                    dispatch({
                        args,
                        key: name,
                        type: 'custom',
                        value: actions[name],
                    });
                },
                name,
            };
        }).reduce((acc, curr) => {
            acc[curr.name] = curr.cb;
            return acc;
            // tslint:disable-next-line:no-object-literal-type-assertion
        }, {} as { [key in keyof CustomActions]: (...args: Parameters<ReturnType<CustomActions[key]>>) => void });

    return [ state, { ...stateDispatcher, ...customDispatcher } ];
}
