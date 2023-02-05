import _ from "lodash";
import React, { forwardRef, useContext, useEffect, useMemo, useReducer } from "react";
import { parseConfigs } from "./StoreConfiguration"

function core() {

    const RegistryContext = {
        reducersByStore: null,
        dutiesByStore: {},
        actionsByStore: {},
        rootStore: undefined,
        configrations: null,
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

        assignConfigurations: function (configurations) {
            RegistryContext.configurationByName = configurations
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

        getStoreConfig(storeName) {
            return RegistryContext.configurationByName?.get(storeName)
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

        for (const config of configs.values()) {

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

    function DutyExecutor(duty, options) {

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

    function getCallOf(store) {

        return (getDuty, options) => {
            const { dutiesByStore } = Registry
            const storeName = store || options?.store
            const configedDuties = !storeName ? dutiesByStore : dutiesByStore[storeName]

            const duty = getDuty(configedDuties)
            return DutyExecutor(duty, storeName, options)
        }
    }

    function dispatch(action) {
        const { reducersByStore, rootDispatch } = Registry
        let payload
        if (Array.isArray(action)) {
            payload = new ChainActions(action)
        } else if (typeof action == "object") {
            payload = toRootPayload(action)
        } else {
            throw new Error("An Action must be of Array of Object type")
        }

        if (rootRendering) {
            const dispatchLater = () => rootDispatch(payload)
            dispatchQueue.push(dispatchLater)
        } else {
            rootDispatch(payload)
        }
    }

    function toRootPayload(action) {
        const { reducersByStore } = Registry

        return {
            storeName: action.storeName,
            reducer: reducersByStore?.[action.storeName]?.[action.name],
            payload: action.payload
        }
    }

    function ChainActions(actions) {

        if (!Array.isArray(actions)) {
            throw new Error("Chain Actions must be type of Array")
        }

        const chain = {
            get actions() {
                return actions
            }
        }

        return Object.setPrototypeOf(chain, ChainActions.prototype)
    }

    function rootReducer(rootStore, action) {
        const { storeName, reducer } = action

        if (action instanceof ChainActions) {
            rootStore = reduceChainActions(rootStore, action)
        } else {
            rootStore = reduceSingleAction(rootStore, action)
        }

        Registry.assignStore(rootStore)
        return Registry.store
    }

    function reduceChainActions(rootStore, chainActions) {

        for (const actionX of chainActions.actions) {
            let action = actionX
            if (actionX instanceof Function) {
                action = actionX(rootStore)
            }

            const rootPayload = toRootPayload(action)
            rootStore = reduceSingleAction(rootStore, rootPayload)
        }

        return rootStore
    }

    function reduceSingleAction(rootStore, action) {
        const { storeName, reducer } = action
        const storeConfig = Registry.getStoreConfig(storeName)
        const actionStore = _.get(rootStore, storeConfig.path)

        //Reduce the store
        const newActionStore = reducer && reducer(actionStore, action.payload)

        //Create new rootStore if reducer return new store reference
        if (newActionStore !== actionStore) {
            rootStore = {
                ...rootStore
            }

            _.set(rootStore, storeConfig.path, newActionStore)
        }

        return rootStore
    }

    function buildReducers(configByName) {
        const allReducers = {}
        for (const config of configByName.values()) {
            allReducers[config.name] = config.reducers
        }

        return allReducers
    }

    function buildDuties(configs) {
        const dutiesByStore = {}
        for (const config of configs.values()) {
            dutiesByStore[config.name] = config.duties
        }

        return dutiesByStore
    }

    function initializeLocalStore(configurationByName) {
        const store = {}
        for (const config of configurationByName.values()) {
            _.set(store, config.path, config.initialState)
        }

        Registry.assignStore(store)
        return Registry.store;
    }

    let rootRendering = false
    const dispatchQueue = []

    function configureRoot(configs) {
        if (rootContext) {
            throw new Error("Root controller is unique for the whole app, you might have configured root more than one...")
        }
        const RootContext = getRootContext()

        const configurationByName = parseConfigs(configs)
        Registry.assignConfigurations(configurationByName)

        Registry.assignReducers(buildReducers(configurationByName))

        Registry.assignDuties(buildDuties(configurationByName))

        //Build store action creators and copy to Registry
        Registry.assignActions(buildStoreActions(configurationByName))

        const initialStore = initializeLocalStore(configurationByName)

        return function (props) {
            const [rootStore, rootDispatch] = useReducer(rootReducer, initialStore);
            useMemo(() => {
                rootRendering = true
            }, [rootStore])

            useEffect(() => {
                rootRendering = false
                const queue = dispatchQueue.slice()
                dispatchQueue.splice(0, dispatchQueue.length)

                for (const dispatchCall of queue) {
                    dispatchCall()
                }
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

    function getRootContext() {
        if (!rootContext) {
            rootContext = React.createContext({});
        }

        return rootContext;
    }

    return {
        configureRoot,
        getRootContext,
        DutyExecutor,
        getCallOf,
        dispatch,
        Registry
    }

}

export { core }