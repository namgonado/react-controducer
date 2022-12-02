# react-controducer
A react library to help front-end developers build React application with **stores, reducers and controllers** patterns. This is a pure React library, lightweight and easily adaptable to any current React based application. It doens't introduce any new technology but utilize the built-in React core functions to ensure the performance and integrity of React Framework.

If you were a fan of traditional MVC architect, then you won't be able to resist going ahead with "trendy" Flux pattern, a front-end architect by Facebook that focusing in unidirectional data flow. You probably get farmiliar with view, action, dispatcher, store and also reducer in Redux, another version of Flux. Redux in recent years has gained popularity as the de facto partner for many React applications. 

However there is still an open question regarding Flux & Redux patterns: where is the Controller? You may see different answers depending on people's point of view, but the common information is that the Controllers don't have good place in the store - reducers pattern like Redux, they are unecessary. Still, it was an unsatisfactory answer.

`react-controducer` not only provides stores, reducers, but it can also fill that gap by bringing a Controller into the store-reducer cycle and centralizing the management of React view components. If you're familiar with the Redux syntax, the controller will give you the same effect but with React's native rules.
## Contact & Questions
Owner: <namgonado@gmail.com>
## Features

- Define configurable stores across application
- Define Reducers and Actions set for each store
- Define Controllers that can "consume" one or many stores and processing data for React components group
- Define Duty, an independent executable unit that can be called from anywhere in the application
- Built-in Hooks for store, controllers, duties

## Prerequisite
This guide line is based on assumption that you have minimal experience on 
- Javascript (better with ES6) 
- Nodejs
- NPM (or other node package manager like Yarn..)
- React

If you are a newcomer, take some online journeys on those techniques to have a first impression on the relevants topics.

## Installation
The library require React ^17.0.0 or later, lodash 4 or later versions to run
```shell
npm install --save react@^17.0.0
npm install --save lodash@^4.0.0
```
then install Controducer
```ssh
npm install --save react-controducer
```

## Getting Started
Refer to the following `API Reference` guide for more details on how the library works.

The easiest way to scaffold a React application is using [Create React App](https://github.com/facebook/create-react-app) which includes necessary React dependencies by default. Then you can use npm command in "Installation" section above to add reac-controducer into the app.
```ssh
npx create-react-app counter-example 
cd counter-example
npm install --save react-controducer
```
A basic controducer app will contain these esstential components
- RootConfig
- Store, Reducers configurations
- Controllers
- React components

### Create a store configuration

```js
[CounterController.js]

export const counterConfig = {
    name: "counter",
    initialState: { value: 0 },
    reducers: {
        increase_value: (store, actionPayload) => {
            return { value: store.value + 1 }
        },
        decrease_value: (store, actionPayload) => {
            return { value: store.value - 1 }
        }
    }
}
```
Create a file name `CounterController.js` and put in that code snippet. You are defining a normal javascript object with name, initialState and reducers parts. The name must be unique, the initialState will be used to set initial value for the store, and two reducers that you can guess what they do through the code.
### Configure root store
```js
[store.js]

import { configureRoot } from "react-controducer"
import { counterConfig } from './CounterController';

const RootStore = configureRoot({ counterConfig })
export default RootStore
```
The `configureRoot({store1Config, store2Config...})` function can accept mutiple store configurations, remember that `counterConfig` is the counter store that was defined earlier. Once the root store is configured, we need to make it available to React by adding RootStore component to the `index.js`
```js
[index.js]

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import RootStore from './store';

const root = ReactDOM.createRoot(document.getElementById('root'));
//This is react v18 syntax, you can use the v17 either
root.render(
  <React.StrictMode>
    <RootStore>
      <App />
    </RootStore>
  </React.StrictMode>
);
```
The root store will have this structure:
```,js
{
    counter: { value: 0 },
    ....
}
```

### Create a Controller
```js
[CounterController.js]

import {createController, useStore, useDispatch} from "react-controducer"
..............................

const CounterController = createController(counterConfig, (props) => {
    const counter = useStore(rootStore => rootStore.counter)
    const [dispatch, counterActions] = useDispatch(counterConfig.name)

    return {
        count: counter.value,
        increase: () => {
            dispatch(counterActions.increase_value())
        },
        decrease: () => {
            dispatch(counterActions.decrease_value())
        }
    }
})

export default CounterController
```
A Controller is a React component that consume one or many pre-configured stores, compute the data and provide more granular state to view components under its management. 

The `createController(name, controllerFunction)` requires 2 arguments: 
* _name_ can be a string or object with name attibute inside. Controller name must be unique over the app. 
* _controllerFunction_ is a callback function to handle Controller logics. 

Two built-in hooks `useStore()` and `useDispatch()` are used inside the controller. `useStore` tells the controller to consume the stores returned by selector function, you can see how the selector arrow function `rootStore => rootStore.counter` extract counter from root. Everytime when the selected stores change, controller will execute again and update view components with new data.

In the mean time, `useDipatch` obtains an array containing 2 artifacts: `dispatch` is used to update stores and `counterActions` is a group of action creators corresponding to the reducers configured in the `counterConfig` before. Look at the reducers name `increase_value` and `decrease_value`, you will see the framework has generated two matching action creators with the same names. 

The CounterController is a React component and will be put later in App.js
The return value of controllerFunction is a normal Javascript object and will be consumed later in view components.

### Connect React view components to Controller
```js
[Counter.js]

import React from 'react'
import { useController } from "react-controducer"
import { counterConfig } from './CounterController'

export function Counter(props) {
    const { increase, decrease, count } = useController(counterConfig.name)

    return (
        <div>
            <button aria-label="Increment value" onClick={increase}>
                Increment
            </button>
            <span>{count}</span>
            <button aria-label="Decrement value" onClick={decrease}>
                Decrement
            </button>
        </div>
    )
}
```
This is a normal React functional component with one exception, it calls the `useController()` hook, passing in the name of the configured store. This hook allows the component to **bind** to the controller we created earlier and receive updated data whenever the stores are changed. Please note that the button's onclicks events are handled by two functions returned from the CounterController.

### Layout View and Controller components
Last but really important step, we have to put all React components including view and controller components created above into `App.js`.

```js
[App.js]

import CounterController from './CounterController';
import { Counter } from './Counter';

function App() {
    return (
        <CounterController>
            <Counter className="App" />
        </CounterController>
    );
}

export default App;
```
**Important Rules**
- Controller component `<CounterController>` need to be nested inside root component `<RootStore>`
- View component `<Counter>` need to be nested inside controller component `<CounterController>` to which it connected. 
- Nesting doesn't need to be direct, you can actually put those elements under multiple levels of nesting for convenience as long as they follow the first 2 rules

At project root folder, run the React app and observer the result:
```sh
npm run start
```
### Bring more Duty to the code
```js
[CounterController.js]

import { useEffect } from "react"
import { createController, useStore, useCallOf } from "react-controducer"

//Remember to add counterStore to configureRoot()
const counterConfig = {
    name: "counter",
    reducers: {
        value_updated: (store, actionPayload) => {
            store.value = actionPayload.value
            return {...store}
        }
    }
}

async function loadDataDuty(rootStore, storeKit) {
    const { dispatch, getActions } = storeKit
    const counterActions = getActions('counter')

    //Fetch data from API
    const lastValue = await API.fetchLastCountValue()
    //Update the counter store
    dispatch(counterActions.value_updated({
        value: lastValue
    }))

    //this is async funnction, you can access return value by promise then
    return lastValue
}

const CounterController = createController(counterConfig, (props) => {
    const counter = useStore(rootStore => rootStore.counter)
    const callOf = useCallOf()

    useEffect(() => {
        //After controller did mount, fetch last counter value and update store asynchronously
        callOf(() => loadDataDuty)
            .then((lastValue) => {
                console.log("Last value counter has been loaded: " + lastValue)
            })
    }, [])

    return {
        count: counter.value
    }
})
```
A Duty is a standalone function that can be called anywhere in the application. Normally if you want to modify the stores, you need to have the `dispatch` and `actions` in hand and can only do that inside a Controller. Duty brings all the store-reducer environment and theirs toolkit into a function.

Duty provide a more flexible way to organize your business by extracting some domain logics into another services or Configurations. Duty can be asynchronous or synchronous function. If you are farmiliar with Redux `thunk`, Duty does the same thing.

To trigger a Duty, we use `callOf` function obtained through `useCallOf()` in Controller or extract the `callOf` directly from storeKit in Duty.

Refer to `API Reference` guide for more details on how to use `Duty` and `callOf`

# API Reference
### `configureRoot(configurations)`

Arguments:
- `configurations` contains multiples store Configuration javascript object. The _name_ attribute in Configuration object will be taken as store name in the Root. If _name_ attribute is absent, the key name of `configurations` would be taken. Name have to be unique for each store. Refer to `Configuration format` section for more details

Returns:
- A React component represent root store. Root component have to be put into React app to manage state of the App.
```js
Example 

import { configureRoot } from "react-controducer"
const sessionConfig = {name: "session"}
const profileConfig = {name: "profile"}

const RootStore = configureRoot({ 
    sessionConfig, 
    profileConfig
})

const App = (props) => {
    return(
        <RootStore>
            <div>App here<div>
        </RootStore>
    )
}

/**
    Once initialized, rootStore would be available across the app under this structure:
    rootStore = {
        session: {},
        profile: {}
    }
**/
```

### `Store Configuration format`
A store Configuration is a plain Javascript object with the format below
```js
const configuration = {
    name: "",
    initialState: {},
    reducers: {
        reducerName: reducerFunction,
        ...
    },
    duties: {
        dutyName: dutyFunction,
        ...
    }
}
```
- _name_ must be unique for each store, used to to acsess the store under the root with rootStore[name]. 
- _initialState_ is used to set initial value for the store when configuring root. If no initialState is specified, the store is undefined when it is first loaded in the root store.
- _reducers_ are functions declared to manipulate the store. Once root is initialized, it automatically generate actions suites corressponding to the reducers. Reducer is called through `dispatch` and `actions`. Refer to `Reducer function` section for more details.
- _duties_ is a group of standalone asynchronization or synchronization functions that can be called from any location in the application. This is an optional part, as Duty can be defined outside the configuration. However if we have defined inside Configuration, they are available to the `fnDutySelector` to be chosen instead of import from outside. Refer to the `Duty function` section for more details.

### `Reducer function`
> `function(store, actionPayload)`

A reducer is a function that is defined in Configuration object under the "reducers" section to manipulate the store. A reducer accepts two arguments
- `store` represents the current state of the store defined in Configuration
- `actionPayload` an object that carries changed data to apply to the store
### `Dispatch & Action`
> `function dispatch(action)`

The only way to trigger a certain reducer in a store is to use a dispatch function. Dispatch function needs an object containing the changed data called an Action. If you have experience with React Dispatch or Redux Dispatch, the same goes for this. In Controducer, the Action object usually has this pattern:
```js
    const increaseAction = {
        storeName: "counter",
        reducer: "increase_value",
        payload: {}
    }
```
The payload attribute will go into the reducer as "actionPayload". To free you from manually creating Action, the framework provides Action Creators that generate specific Actions for each reducers. See the section [`Action Creator`](#actioncreator) for more details.

> `useDispatch(storeName)`

Dispatch can be obtained with `useDispatch` hook inside Controller or extract `dispatch` from storeKit inside Duty functions. See the respective sections for more details.

### `Action Creator`
> `const [dispatch, actions] = useDispatch(storeName)`

> `const actions = getActions(storeName)`

When root store is initialized, the Action Creator is generated automatically on every reducers in store Configuration. In short, Action Creator is a function to create an Action so that the `dispatch` can tell which reducer need to be called for the store manipulation. The Action Creator's name is the same as the reducer's.

To obtain Action Creators, call the hook `useDispatch(storeName)` inside a Controller or `getActions(storeName)` inside a Duty. If you provide store name, they will return Action Creators for specific store. If no store name provided, all actions creators of all configured stores will be returned.
```js
Code Example

import {createController, useDispatch} from "react-controducer"

export const counterConfig = {
    name: "counter",
    initialState: { value: 0 },
    reducers: {
        increase_value: (store, actionPayload) => {
            return { value: store.value + 1 }
        },
        decrease_value: (store, actionPayload) => {
            return { value: store.value - 1 }
        }
    }
}

const CounterController = createController("counter", (props) => {
    const [dispatch, counterActions] = useDispatch("counter")
    const [sameDispatch, allActions] = useDispatch()

    ....
    dispatch(counterActions.increase_value())
    ....
    dispatch(allActions['counter'].increase_value())
}
```


### `Controller`
> `createController(name, fnControlerHandler)`

Controller is a React component that consumes one or many pre-configured stores, computes data and provides more granular state to view components under its management.

Controller is not just a middle man between Stores and View Components but you can put any logics here to process external data, call to API, group logical behaviors... before delivering final data to View Components to render. Controller can separate handling logic from displaying data so you can have multiple instances of React View Components without worrrying about breaking your data handling.

Arguments:
* `name` can be a string or object with the name attribute inside. The Controller name must be unique across the application.
* `fnControlerHandler` a callback function to handle Controller logics. The Controller component's properties will be passed in when calling fnControlerHandler. You can call normal React hooks inside this function, the hooks will take effect on the returned Controller component

Return:
* A React component as a Controller that can manage React components inside

```js
Code Example

import {createController, useStore, useDispatch} from "react-controducer"

//Assume counterConfig is defined before. Refer to "Store  Configuration" example

const CounterController = createController(counterConfig, (props) => {
    const counter = useStore(rootStore => rootStore.counter)
    const [dispatch, counterActions] = useDispatch(counterConfig.name)
    
    // use other React hooks here like: useState(), useEffect(), useMemo()...
    
    return {
        count: counter.value,
        increase: () => {
            dispatch(counterActions.increase_value())
        },
        decrease: () => {
            dispatch(counterActions.decrease_value())
        }
    }
})

function App(props) {
    return (
        <CounterController>
            <Counter className="App" />
        </CounterController>
    );
}
```

After calling 'creatController', you must provide this component to your React application to manage child components inside. 

Controller always come with a `useStore` hook to register itself for store updates. Changing store will trigger the `fnControlerHandler` again. See the section `useStore` for more details.

Rules for Controller:
* The controller component must be nested inside the RootStore component (see `configureRoot` for more details)
* All React view components connected to a Controller must be nested inside a Controller
* Nested components need not be direct children, they can be the decendents instead
* Controller only and only updates if there is a difference in the store selector comparison between the previous and current state, so view elements that use the controller will re-render accordingly
* You can use any kind of React hooks inside fnControlerHandler

### `useStore hook` 
>`hook useStore(fnStoreSelector)`

`useStore` is a built-in hook to allow a controller to start observing data changes from stores and run processing on those changes. You would define a `fnStoreSelector` function to choose which data froms stores the controller should be interested in.

> `function fnStoreSelector(rootStore, shallow)`

Arguments:
* `rootStore` the top level store over the application which contains many sub stores
* `shallow` an optional function used to tell the framework to do a shallow comparision on the selector value

Return:
* Selected data from rootStore. The controller only update when the return data reference change. If `shallow` is sued, data is compare using shallow comparision.

```js
Code Example

const counterSelector = (rootStore) => rootStore['counter']

const profileSelector = (rootStore, shallow) => {
    
    return shallow({
        profile: rootStore['profile'],
        isLoggin: rootStore['session'].login
    })
}

const CounterController = createController(counterConfig, (props) => {

    //Update controller when the counter object refrence change
    const counter = useStore(counterSelector)
    //Update controller when the profile object reference change or login value change
    const status = useStore(profileSelector)
    ............
}
```

### `useController hook` 
> `hook useController(controllerName)`

Every React view components nested inside Controller can connect and start becoming active child elements using the `useController` hook. 

Arguments:
* `controllerName` the name of the Controller this view component is connecting to. Remember that the Controller must be the ancestor of this view component.

Returns:
* The return Value in this hook is the return value by `fnControllerHandler`. See the `Controller` section for details.
```js
Code Example 

import React from 'react'
import { useController } from "react-controducer"
import { counterConfig } from './CounterController'

export function Counter(props) {
    const { increase, decrease, count } = useController(counterConfig.name)

    return (
        <div>
            <button aria-label="Increment value" onClick={increase}>
                Increment
            </button>
            <span>{count}</span>
            <button aria-label="Decrement value" onClick={decrease}>
                Decrement
            </button>
        </div>
    )
}
```
The data flow would be: Stores change ==> Controller updates due to store changes ==> React view components rerender base on Controller computed data 

It is recommended that you should have one feature view container connect to one Controller for UI pattern. The feature view container can include many smaller view components.
### `Duty`
> `function duty(rootStore, storeKit)`

Duty is a standalone function that can be called anywhere in the application. Normally if you want to modify the stores, you need to have `dispatch` and `actions` on hand and can only do that inside the Controller. Duty bring store - reducer environment and theirs toolkit into an arbitrary function. 

Duty provides a more flexible way to organize your business by extracting some domain logics into another services or Configurations. Duty can be asynchronous or synchronous. If you are farmiliar with Redux `thunk`, Duty is the same thing.

Arguments:
* `rootStore` the root store configured earlier
* `storeKit` object contains tools to obtain `dispatch`, `actions`, `callOf` and other `duties` configured in store `Configuration` 

Return:
* Any value, return as normal Javascript function
```js
storeKit:
{
    dispatch, //the dispatch
    getActions, //Get Action Creators just like useDispatch() hook
    callOf,    // the tool to trigger duty
    getDuties //Get other duties defined in the store Configuration
}
```

to trigger a Duty, use `callOf` function which can be obtained via `useCallOf` in Controller or extract `callOf` directly from storeKit in Duty. Observer how they are used in the example below:
```javascript
Code Example

import { useEffect } from "react"
import { createController, useStore, useCallOf } from "react-controducer"

//Remember to add counterStore to configureRoot()
const counterConfig = {
    name: "counter",
    reducers: {
        value_updated: (store, actionPayload) => {
            store.value = actionPayload.value
            return {...store}
        }
    }
}

async function loadDataDuty(rootStore, storeKit) {
    const { dispatch, getActions } = storeKit
    const counterActions = getActions('counter')

    //Fetch data from API
    const lastValue = await API.fetchLastCountValue()
    //Update the counter store
    dispatch(counterActions.value_updated({
        value: lastValue
    }))

    //this is async function, the return value can be accessed via promise then
    return lastValue
}

const CounterController = createController(counterConfig, (props) => {
    const counter = useStore(rootStore => rootStore.counter)
    const callOf = useCallOf()

    useEffect(() => {
        //After controller did mount, fetch last counter value and update store asynchronously
        callOf(() => loadDataDuty).then((lastValue) => {
            console.log("Last value counter has been loaded: " + lastValue)
        })
    }, [])

    return {
        count: counter.value
    }
})
```

If Duty is defined in store Configuration (see `Store Configuration format` section), you will have pre-configured duties along with the store. This is a good way to organized your logics by store domain, and also help to retrieve Duty from `callOf` without importing from somewhere. See `callOf` section for more details.

### Call of Duty
> `function callOf(fnDutySelector)`

This is a tool to execute a Duty, it is in fact a function to execute a function. The framework will inject the `rootStore` and `storeKit` into Duty for execution. So code inside Duty would have full environment to perfom intended task, just like inside a controller. You can obtain `callOf` via `useCallOf()` hook or extracting 'callOf' directly from storeKit passed to Duty. 

> `function fnDutySelector(allDuties)`

A callback function to return which Duty function will be executed in by `callOf`. If the Duties are configured in the `Store Configuration`, all of them will be passed in `fnDutySelector`:
```js

    //Define high order function what return Duty function
    function addValue(number) {
    
        return (rootStore, storeKit) => {
            const { dispatch, getActions } = storeKit
            const counterStore = rootStore['counter']
            const counterActions = getActions('counter')
            
            const newValue = counterStore.value + number
            dispatch(counterActions.value_updated({
                value: newValue
            ))
        }
    }
    
    //Asume reusing the counterConfig in Duty section example
    const counterConfig = {
        ...
        duties: {
            addValue //assign Duty function to configuration
        }
    }
    
    ........
    //First way executing Duty by callOf
    callOf(() => addValue(3))
    
    ........
    //Second way executing Duty by callOf
    callOf(allDuties => allDuties['counter'].addValue(3))
```
One thing to be aware of, the `addValue(number)` is not a Duty, it is indeed a high order function which return a real Duty. That is why you have to call `addValue(3)` to get the Duty function.

In the second way, look at how a callback `fnDutySelector` arrow function works. All pre-configured duties batches from all store configurations are availabe to the `fnDutySelector`.