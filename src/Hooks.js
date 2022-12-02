import _ from "lodash"
import { useContext, useEffect, useMemo, useState } from "react"
import Core, { dispatch, getCallOf } from "./Core"
import {ControllerRegistry} from "./Controller"

export function useStore(selector) {
    const constrollerId = ControllerFiber.currentId
    if (!_.toString(constrollerId)) {
        throw new Error("useStore hook must be called insde controller component...")
    }

    useEffect(() => {
        let selectorKey

        if (typeof selector === "function") {
            let foundKey
            const foundDuplicate = _.some(_.values(Core.Registry.getSelectors(constrollerId)), (func, key) => {
                foundKey = key
                return typeof func === "function" && func === selector
            })

            if (foundDuplicate) {
                throw new Error(`Duplicate selector found ${foundKey}. You might call the same selector two times in the same component, otherwise there maybe something else wrong...`)
            }

            selectorKey = Core.Registry.assignSelector(constrollerId, selector)
        }

        return () => {
            if (selectorKey) {
                Core.Registry.removeSelector(constrollerId, selectorKey)
            }
        }
    }, [])

    let selectedStore
    if (typeof selector === "function") {
        const rootStore = Core.Registry.store
        selectedStore = selector(rootStore, shallow)

        if ((selectedStore instanceof shallow) && selectedStore.isShallow) {
            selectedStore = selectedStore.value
        }
    }

    return selectedStore
}

export function useCallOf() {
    const dutiesByStore = Core.Registry.dutiesByStore
    const constrollerId = ControllerFiber.currentId

    if (!_.toString(constrollerId)) {
        throw new Error("useCallOf hook must be called inside controller component...")
    }

    return getCallOf()
}

/* export function useDuties(useName) {
    const dutiesByStore = Core.Registry.dutiesByStore
    const constrollerId = ControllerFiber.currentId

    if (!_.toString(constrollerId)) {
        throw new Error("useCallOf hook must be called inside controller component...")
    }

    //const configedDuties = useName ? dutiesByStore[useName] : dutiesByStore

    return (getDuty, options) => {
        //const storeName = useName || defaultStore
        const duty = getDuty(dutiesByStore)
        return DutyExecutor(duty, options)
    }
}
 */
export function useDispatch(useName) {
    const actionsByStore = Core.Registry.actionsByStore
    const defaultStore = ControllerFiber.currrentControllerName
    if (!_.toString(defaultStore)) {
        throw new Error("useDispatch hook must be called inside controller component...")
    }

    const actions = useName ? actionsByStore[useName] : actionsByStore

    return [dispatch, actions]
}

export function useController(name) {
    const context = ControllerRegistry.getContext(name)
    const contextValue = useContext(context)
    const consumer = useMemo(() => {{}}, [])

    if (!contextValue || !contextValue.provider) {
        throw new Error(`useController hook can only be called inside react component which is under controller ${name}`)
    }
    
    return contextValue.controller
}

export function shallow(value) {
    const shallowInstance = {
        get isShallow() { return true },
        get value() { return value || {} }
    }

    Object.setPrototypeOf(shallowInstance, shallow.prototype)
    return shallowInstance
}

export const ControllerFiber = {
    currentId: null,
    currrentControllerName: null
}