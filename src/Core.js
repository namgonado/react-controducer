import _ from "lodash";
import React, { forwardRef, useContext, useEffect, useMemo, useReducer } from "react";

function rootReducer(rootStore, action) {
    const { storeName, reducer } = action
    const currentStore = rootStore?.[storeName]

    const newStore = reducer && reducer(currentStore, action.payload)

    if (currentStore === newStore) {
        Registry.assignStore(rootStore)
    } else {
        Registry.assignStore({
            ...rootStore,
            [storeName]: newStore
        })
    }

    return Registry.store
}

const RegistryContext = {
    reducersByStore: null,
    dutiesByStore: {},
    actionsByStore: {},
    rootStore: undefined,
    rootDispatch: null,
    selectorsByControllerId: {},
}

const Registry = {

    assignActions: function (storeActions) {
        _.assign(RegistryContext.actionsByStore, storeActions)
    },

    assignSelector: function (controllerId, selector) {
        let selectors = RegistryContext.selectorsByControllerId[controllerId]

        if (!selectors) {
            selectors = {}
            RegistryContext.selectorsByControllerId[controllerId] = selectors
        }

        const selectorKey = `${controllerId}-selector${_.keys(selectors).length}`
        if (selectors[selectorKey]) {
            throw Error(`Duplicate key ${selectorKey}`)
        }

        selectors[selectorKey] = selector

        return selectorKey
    },

    removeSelector: function (controllerId, selectorKey) {
        const selectors = RegistryContext.selectorsByControllerId[controllerId]
        delete selectors[selectorKey]
    },

    assignStore: function (state) {
        RegistryContext.rootStore = state
    },

    assignReducers: function (allReducers) {
        RegistryContext.reducersByStore = allReducers
    },

    assignDuties: function (dutiesByStore) {
        RegistryContext.dutiesByStore = dutiesByStore
    },

    assignRootDispatch: function (rootDispatch) {
        RegistryContext.rootDispatch = rootDispatch
    },

    getSelectors(controllerId) {
        const selectorsByControllerId = RegistryContext.selectorsByControllerId
        return _.clone(selectorsByControllerId[controllerId])
    },

    get store() {
        return RegistryContext.rootStore
    },

    get dutiesByStore() {
        return RegistryContext.dutiesByStore
    },

    get actionsByStore() {
        return RegistryContext.actionsByStore
    },

    get reducersByStore() {
        return RegistryContext.reducersByStore
    },

    get rootDispatch() {
        return RegistryContext.rootDispatch
    }
}

function buildStoreActions(configs) {
    const patches = {};

    for (const config of Object.values(configs)) {

        const actions = {}
        for (const reducerName in (config.reducers || {})) {

            actions[reducerName] = (actionPayload) => {

                return {
                    storeName: config.name,
                    name: reducerName,
                    payload: actionPayload
                }
            }
        }

        patches[config.name] = actions
    }

    return patches;
}

export function DutyExecutor(duty, options) {

    const start = (callback) => {
        if (typeof callback === "function") {

            if (!options?.offStart) {
                callback()
            }

        }
    }

    let finishedCallback;
    const finished = (callback) => {
        if (typeof callback === "function") {
            finishedCallback = callback
        }
    }

    let result = duty(Registry.store, storeKit(), start, finished)

    if (result instanceof Promise) {
        result = result.then(value => {

            if (finishedCallback && !options?.offFinished) {
                const finished = finishedCallback(value)

                if (finished instanceof Promise) {
                    return finished.then(() => value)
                }
            }

            return value
        })
    } else if (finishedCallback && !options?.offFinished) {
        finishedCallback(result)
    }

    return result
}

function storeKit() {
    return {
        dispatch,
        callOf: getCallOf(),
        getActions: (storeName) => {
            const { actionsByStore: allActions } = Registry
            return !storeName ? allActions : allActions[storeName]
        },
        getDuties: (storeName) => {
            const { dutiesByStore } = Registry
            return !storeName ? dutiesByStore : dutiesByStore[storeName]
        }
    }
}

export function getCallOf(store) {

    return (getDuty, options) => {
        const { dutiesByStore } = Registry
        const storeName = store || options?.store
        const configedDuties = !storeName ? dutiesByStore : dutiesByStore[storeName]

        const duty = getDuty(configedDuties)
        return DutyExecutor(duty, storeName, options)
    }
}

export function dispatch(action) {
    const { reducersByStore, rootDispatch } = Registry
    let payload
    if (typeof action == "object") {
        payload = {
            storeName: action.storeName,
            reducer: reducersByStore?.[action.storeName]?.[action.name],
            payload: action.payload
        }
    }

    if (rootRendering) {
        const dispatchLater = () => rootDispatch(payload)
        dispatchQueue.push(dispatchLater)
    } else {
        rootDispatch(payload)
    }
}

function buildReducers(configs) {
    const allReducers = {}
    for (const config of Object.values(configs)) {
        allReducers[config.name] = config.reducers
    }

    return allReducers
}

function buildDuties(configs) {
    const dutiesByStore = {}
    for (const config of Object.values(configs)) {
        dutiesByStore[config.name] = config.duties
    }

    return dutiesByStore
}

let rootRendering = false
const dispatchQueue = []

export function configureRoot(configs) {
    if (rootContext) {
        throw new Error("Root controller is unique for the whole app, you might configure root more than one...")
    }
    const RootContext = getRootContext()

    function initializeLocalStore() {
        const store = {}
        for (const config of Object.values(configs)) {
            store[config.name] = config.initialState
        }

        Registry.assignStore(store)
        return Registry.store;
    }

    Registry.assignReducers(buildReducers(configs))

    Registry.assignDuties(buildDuties(configs))

    //Build store action creators and copy to Registry
    Registry.assignActions(buildStoreActions(configs))

    const initialStore = initializeLocalStore()

    return function (props) {
        const [rootStore, rootDispatch] = useReducer(rootReducer, initialStore);
        useMemo(() => {
            rootRendering = true
        }, [rootStore])

        useEffect(() => {
            const queue = dispatchQueue.slice()
            dispatchQueue.splice(0, dispatchQueue.length)
            
            for (const dispatchCall of queue) {
                dispatchCall()
            }
            rootRendering = false
        }, [rootStore])

        useMemo(() => {
            Registry.assignRootDispatch(rootDispatch)
        }, [rootDispatch])

        return (
            <>
                <RootContext.Provider value={rootStore}>
                    {props.children}
                </RootContext.Provider>
            </>
        )
    }
}

let rootContext = null;

export function getRootContext() {
    if (!rootContext) {
        rootContext = React.createContext({});
    }

    return rootContext;
}

export default {
    getRootContext,
    Registry
}