import _ from "lodash"
import { useContext, useEffect, useMemo, useState } from "react"

function hooks({Core, Controller}) {

    const { dispatch, getCallOf } = Core
    const { ControllerRegistry, shallow, ControllerFiber } = Controller

    function useStore(selector) {
        const constrollerId = ControllerFiber.currentId
        if (!_.toString(constrollerId)) {
            throw new Error("useStore hook must be called insde controller component...")
        }

        const selectorKey = useMemo(() => {
            let selectorKey

            if (typeof selector === "function") {
                let foundKey
                const foundDuplicate = _.some(_.values(Core.Registry.getSelectors(constrollerId)), (func, key) => {
                    foundKey = key
                    return typeof func === "function" && func === selector
                })

                if (foundDuplicate) {
                    throw new Error(`Duplicate selector found ${foundKey}. You might hook the same selector two times in a controller, otherwise there maybe something else wrong...`)
                }

                selectorKey = Core.Registry.assignSelector(constrollerId, selector)
            }

            return selectorKey
        }, [])

        useEffect(() => {
            //Remove registed selectors when the controller unmount
            return () => {
                if (selectorKey) {
                    Core.Registry.removeSelector(constrollerId, selectorKey)
                }
            }
        }, [])

        //Retrieve selector from cache and execute on rootStore
        let selectedStore
        const cachedSelector = Core.Registry.getSelector(constrollerId, selectorKey)
        if (typeof cachedSelector === "function") {
            const rootStore = Core.Registry.store
            selectedStore = cachedSelector(rootStore, shallow)

            if ((selectedStore instanceof shallow) && selectedStore.isShallow) {
                selectedStore = selectedStore.value
            }
        }

        return selectedStore
    }

     function useCallOf() {
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
     function useDispatch(useName) {
        const actionsByStore = Core.Registry.actionsByStore
        const defaultStore = ControllerFiber.currentId
        if (!_.toString(defaultStore)) {
            throw new Error("useDispatch hook must be called inside controller component...")
        }

        const actions = useName ? actionsByStore[useName] : actionsByStore

        return [dispatch, actions]
    }

     function useController(name) {
        const context = ControllerRegistry.getContext(name)
        const contextValue = useContext(context)
        const consumer = useMemo(() => { { } }, [])

        if (!contextValue || !contextValue.provider) {
            throw new Error(`useController hook can only be called inside react component which is under controller ${name}`)
        }

        return contextValue.controller
    }

    return {
        useController,
        useDispatch,
        useCallOf,
        useStore
    }
}

export {hooks}