import { configure, mount } from 'enzyme';
import EnzymeAdapter from 'enzyme-adapter-react-16';
import 'jest-enzyme';
import * as React from 'react';
import { Component, ErrorInfo } from 'react';
import { useAutoReducer } from '../useAutoReducer';

configure({ adapter: new EnzymeAdapter() });

class ErrorBoundary extends Component<{}, { hasError: false | string }> {
    constructor(props: {}) {
        super(props);
        this.state = { hasError: false };
    }

    public componentDidCatch(error: Error, info: ErrorInfo) {
        this.setState({ hasError: error.message });
    }

    public render() {
        const { children } = this.props;
        const { hasError } = this.state;
        return hasError || children;
    }
}

describe('useAutoReducer', () => {
    it('Allows simple state updates', () => {
        const SimpleComponent = () => {
            const [ state, dispatcher ] = useAutoReducer({
                a: 1,
                b: 2,
            });

            return (
                <>
                    <div id="stateA">{state.a}</div>
                    <div id="stateB">{state.b}</div>
                    <a id="clickA" onClick={() => dispatcher.a(100)}>A</a>
                    <a id="clickB" onClick={() => dispatcher.b(200)}>B</a>
                </>
            );
        };

        const wrapper = mount(<SimpleComponent/>);
        expect(wrapper.find('#stateA')).toHaveText('1');
        expect(wrapper.find('#stateB')).toHaveText('2');
        wrapper.find('#clickA').simulate('click');
        wrapper.find('#clickB').simulate('click');
        expect(wrapper.find('#stateA')).toHaveText('100');
        expect(wrapper.find('#stateB')).toHaveText('200');
    });

    it('Allows custom actions that update state without parameters', () => {
        const SimpleComponent = () => {
            const [ state, dispatcher ] = useAutoReducer({
                a: 1,
                b: 2,
            }, {
                updateBoth: () => () => {
                    return {
                        a: 1000,
                        b: 2000,
                    };
                },
            });

            return (
                <>
                    <div id="stateA">{state.a}</div>
                    <div id="stateB">{state.b}</div>
                    <a id="click" onClick={() => dispatcher.updateBoth()}>A</a>
                </>
            );
        };

        const wrapper = mount(<SimpleComponent/>);
        expect(wrapper.find('#stateA')).toHaveText('1');
        expect(wrapper.find('#stateB')).toHaveText('2');
        wrapper.find('#click').simulate('click');
        expect(wrapper.find('#stateA')).toHaveText('1000');
        expect(wrapper.find('#stateB')).toHaveText('2000');
    });

    it('Allows custom actions that update state with parameters', () => {
        const SimpleComponent = () => {
            const [ state, dispatcher ] = useAutoReducer({
                a: 1,
                b: 2,
            }, {
                updateBoth: () => ({ a, b }: { a: number, b: number }) => {
                    return { a, b };
                },
            });

            return (
                <>
                    <div id="stateA">{state.a}</div>
                    <div id="stateB">{state.b}</div>
                    <a id="click" onClick={() => dispatcher.updateBoth({ a: 1000, b: 2000 })}>A</a>
                </>
            );
        };

        const wrapper = mount(<SimpleComponent/>);
        expect(wrapper.find('#stateA')).toHaveText('1');
        expect(wrapper.find('#stateB')).toHaveText('2');
        wrapper.find('#click').simulate('click');
        expect(wrapper.find('#stateA')).toHaveText('1000');
        expect(wrapper.find('#stateB')).toHaveText('2000');
    });

    it('Does not allow duplicate keys', () => {
        const SimpleComponent = () => {
            const [ state, dispatcher ] = useAutoReducer({
                a: 1,
                b: 2,
            }, {
                a: () => () => {
                    return {
                        a: 1000,
                        b: 2000,
                    };
                },
            });

            return (
                <>
                    <div id="stateA">{state.a}</div>
                    <div id="stateB">{state.b}</div>
                    <a id="click" onClick={dispatcher.a}>A</a>
                </>
            );
        };

        const wrapper = mount(<ErrorBoundary><SimpleComponent/></ErrorBoundary>);
        expect(wrapper.find(ErrorBoundary).state().hasError).toBe('Duplicate key in state and actions: a');
    });

});
