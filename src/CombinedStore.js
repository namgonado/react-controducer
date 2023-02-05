import _ from "lodash"
import { STORE_CONFIG_TYPE, COMBINE_STORE_TYPE } from "./common"

function combineStore({ StoreConfiguration }) {

    const { createStoreConfig } = StoreConfiguration

    function combineStores(mainStore, subStores) {
        let pathByConfig = new Map()
        let rootPath = null

        if (mainStore instanceof STORE_CONFIG_TYPE) {
            if (!_.isEmpty(mainStore.path)) {
                rootPath = [].concat(mainStore.path)
            }

            pathByConfig.set(mainStore, null)
        } else {
            const mainPaths = traversePath(mainStore, STORE_CONFIG_TYPE, COMBINE_STORE_TYPE)
            //const mergedPaths = mergePath(rootPath, mainPaths)
            pathByConfig = new Map([...pathByConfig, ...mainPaths])
        }

        if (!_.isEmpty(subStores)) {
            let subPaths = traversePath(subStores, STORE_CONFIG_TYPE, COMBINE_STORE_TYPE)
            //const mergedPaths = mergePath(rootPath, subPaths)
            pathByConfig = new Map([...pathByConfig, ...subPaths])
        }

        const configurations = []
        for (const [config, path] of pathByConfig) {
            const combinedConfig = createStoreConfig(config, path)
            combinedConfig.root = rootPath

            configurations.push(combinedConfig)
        }

        const self = {
            get root() {
                return rootPath
            },
            get traversedPaths() {
                return pathByConfig
            },
            get configByName() {
                const keyByName = _.keyBy(configurations, "name")
                return new Map([...Object.entries(keyByName)])
            },
            get configurations() {
                return configurations
            },
            resetRoot(newRoot) {
                _.forEach(configurations, config => config.root = newRoot)
            }
        }

        Object.setPrototypeOf(self, COMBINE_STORE_TYPE.prototype)

        return self
    }

    function traversePath(object, configType, combinedType) {

        let pathByObject = new Map()

        // If the object itsself is combined, no need to traverse
        if (object instanceof combinedType) {
            return object.pathByConfig
        }

        for (const [key, configure] of Object.entries(object)) {
            if (configure instanceof configType) {
                let offsetPath = [key]
                if (!_.isEmpty(configure.path)) {
                    offsetPath = [].concat(configure.path)
                }

                pathByObject.set(configure, offsetPath)
            } else if (configure instanceof combinedType) {

                let offsetPaths = configure.traversedPaths
                if (_.isEmpty(configure.root)) {
                    offsetPaths = mergePath(key, offsetPaths)
                }
                pathByObject = new Map([...pathByObject, ...offsetPaths])
            } else if (configure instanceof Object) {
                const offsetPaths = traversePath(configure, configType, combinedType)
                //console.log("tempPaths", tempPaths)
                const mergedPaths = mergePath(key, offsetPaths)
                //console.log("mergedPaths", branchPaths)
                pathByObject = new Map([...pathByObject, ...mergedPaths])
            }
        }

        return pathByObject
    }

    function mergePath(root, pathByType) {
        const mergedPaths = new Map()
        const rootPath = [].concat(root)

        for (const [object, path] of pathByType) {
            const storePath = !!path ? [].concat(path) : []
            mergedPaths.set(object, rootPath.concat(storePath))
        }

        return mergedPaths
    }

    return {
        combineStores
    }
}

export { combineStore }