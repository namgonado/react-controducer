import _ from "lodash";
import Core from "./Core";
import { ControllerFiber, shallow } from "./Hooks";

import React, { forwardRef, useContext, useEffect, useMemo, useReducer, memo, useId, useState } from "react";

let controllerCount = 0

const ControllerContexts = {}

export const ControllerRegistry = {
    assignContext(controllerName, context) {
        if (ControllerContexts[controllerName]) {
            throw new Error("Controller need to have unique name ${controllerName}...")
        }

        ControllerContexts[controllerName] = context
    },

    getContext(name) {
        return ControllerContexts[name]
    }
}

export function createController(config, controllerCallback) {
    const storeName = typeof config === "object" ? config.name : config
    const controllerId = `controller-${storeName}${controllerCount}`
    controllerCount++

    const ControllerContext = React.createContext({
        name: storeName
    })

    ControllerRegistry.assignContext(storeName, ControllerContext)

    const MemoziredControllerContext = React.memo(function (props) {

        ControllerFiber.currentId = controllerId
        ControllerFiber.currrentControllerName = storeName
        const computedValue = controllerCallback({
            ...props
        })
        ControllerFiber.currentId = null
        ControllerFiber.currrentControllerName = null

        const contextValue = {
            name: storeName,
            provider: true,
            controller: computedValue
        }

        return (
            <ControllerContext.Provider value={contextValue}>
                {props.children}
            </ControllerContext.Provider>
        )
    }, areEqual)

    function areEqual(prevProps, nextProps) {
        const { directs: prevDirects, shallows: prevShallows } = prevProps.usedStores
        const { directs: nextDirects, shallows: nextShallows } = nextProps.usedStores

        return areEqualShallow(prevDirects, nextDirects)
            && checkShallowsOk(prevShallows, nextShallows)
            && checkOwnPropsOk(prevProps, nextProps)
    }
    function Controller(props) {
        const root = useContext(Core.getRootContext())

        useEffect(() => {
        }, [])

        const usedStores = getUsedStores(storeName, controllerId)

        return (
            <MemoziredControllerContext {...props} usedStores={usedStores}></MemoziredControllerContext>
        )
    }

    Controller.context = ControllerContext

    return Controller
}

export function withController(Component, Controllers) {

    return forwardRef(function (props, ref) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        //var handlers = _.mapValues(Controllers, controller => useContext(controller.context))
        var handlers = {}
        for (const [key, controller] of Object.entries(Controllers)) {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const contextValue = useContext(controller.context);
            handlers[key] = contextValue.controller
        }

        return (
            <Component {...props} {...handlers} ref={ref} />
        )
    })
}

function getUsedStores(storeName, controllerId) {
    const selectors = Core.Registry.getSelectors(controllerId) || {}
    let directs = {}
    let shallows = {}
    const rootStore = Core.Registry.store

    if (storeName) {
        directs[storeName] = rootStore[storeName]
    }

    for (const [key, selector] of Object.entries(selectors)) {
        const selectedStore = selector(rootStore, shallow)

        if ((selectedStore instanceof shallow) && selectedStore.isShallow) {
            shallows[key] = selectedStore.value
        } else {
            directs[key] = selectedStore
        }
    }

    return { directs, shallows }
}

function checkShallowsOk(prevShallows, nextShallows) {
    if (!prevShallows && !nextShallows) {
        return true
    }


    return _.every(
        _.keys(prevShallows),
        selectorKey => areEqualShallow(prevShallows[selectorKey], nextShallows[selectorKey])
    )
}

function checkOwnPropsOk(prevProps, nextProps) {
    const { usedStores: ignore1, ...ownPrevProps } = prevProps
    const { usedStores: ignore2, ...ownNextProps } = nextProps

    return areEqualShallow(ownPrevProps, ownNextProps)
}

function areEqualShallow(object, other) {
    const differentKeys = _.xor(_.keys(object), _.keys(other))

    if (!_.isEmpty(differentKeys)) {
        return false
    }

    return _.every(_.keys(object), key => object[key] === other[key])
}