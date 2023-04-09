import _ from "lodash";
import React, { forwardRef, useContext, useEffect, useMemo, useReducer, memo, useId, useState, useRef } from "react";

function controller({ Core }) {

    const ControllerContexts = {}

    const ControllerRegistry = {
        assignContext(controllerName, context) {
            ControllerContexts[controllerName] = context
        },

        removeContext(controllerName) {
            delete ControllerContexts[controllerName]
        },

        getContext(controllerName) {
            return ControllerContexts[controllerName]
        }

    }

    function createController(config, controllerCallback) {
        const controllerName = typeof config === "object" ? config.name : config
        let innerCount = 0
        const ControllerContext = React.createContext({
            name: controllerName
        })

        ControllerRegistry.assignContext(controllerName, ControllerContext)

        const MemoziredControllerContext = React.memo(function (props) {
            const { instance } = props
            ControllerFiber.currentId = instance.current.id
            const computedValue = controllerCallback({
                ...props
            })
            ControllerFiber.currentId = null

            const contextValue = {
                name: controllerName,
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
            //This code does nothing but listening the change from rootContext
            const root = useContext(Core.getRootContext())

            //And tracking instance for each time controller component are mounted
            const controllerInstance = useRef({})
            if (!controllerInstance.current.id) {
                controllerInstance.current.id = `controller-${controllerName}${innerCount}`
                innerCount++
            }

            useEffect(() => {
                const currentContext = ControllerRegistry.getContext(controllerName)
                if (ControllerContext !== currentContext) {
                    throw new Error(`Controller need to have unique name ${controllerName}. You might have created controllers with duplicate name`)
                }
            })

            const usedStores = getUsedStores(controllerName, controllerInstance.current.id)

            return (
                <MemoziredControllerContext {...props} instance={controllerInstance} usedStores={usedStores}></MemoziredControllerContext>
            )
        }

        //For legacy withControler function
        Controller.context = ControllerContext

        return Controller
    }

    function withController(Component, Controllers) {

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
        if (_.isEmpty(prevShallows) && !_.isEmpty(nextShallows)) {
            return false
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

    function shallow(value) {
        const shallowInstance = {
            get isShallow() { return true },
            get value() { return value || {} }
        }

        Object.setPrototypeOf(shallowInstance, shallow.prototype)
        return shallowInstance
    }

    const ControllerFiber = {
        currentId: null,
        currrentControllerName: null
    }

    return {
        ControllerRegistry,
        ControllerFiber,

        createController,
        withController,

        shallow,
    }
}

export { controller }