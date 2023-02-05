import _, { keyBy } from "lodash"
import { COMBINE_STORE_TYPE, STORE_CONFIG_TYPE} from "./common"

export function parseConfigs(configs) {
    const configByName = new Map()

    if (configs instanceof COMBINE_STORE_TYPE) {
        return configs.configByName
    }

    for (const [key, config] of Object.entries(configs)) {
        let storeConfig
        if (config instanceof STORE_CONFIG_TYPE) {
            storeConfig = config
        } else if (config instanceof COMBINE_STORE_TYPE) {
            storeConfig = config.configurations
        } else {
            storeConfig = createStoreConfig(config)
        }

        addConfigurations(configByName, storeConfig, key)
    }

    return configByName
}

function storeConfiguration() {

    function createStoreConfig(config, pathToRoot) {

        if (!config.name) {
            throw new Error("Store configuration must contain name attribute")
        }

        let root = !_.isEmpty(config.path) ? config.path : null;

        const self = {
            ...config,
            get path() {
                //Path = name + external pathToRoot
                let path = _.isEmpty(this.root) ? [] : [].concat(this.root)

                if (pathToRoot) {
                    path = path.concat(pathToRoot)
                }

                return path
            },
            get root() {
                return root
            },
            set root(newRoot) {
                root = newRoot
            },
            clone() {
                const clone = createStoreConfig(config, pathToRoot)
                clone.root = _.cloneDeep(this.root)
                return clone
            }
        }

        Object.setPrototypeOf(self, STORE_CONFIG_TYPE.prototype)

        return self
    }

    function addConfigurations(configByName, configs, rootKey) {

        _.forEach([].concat(configs), (config, index, collection) => {
            //The config object doesn't contain root, take the key as store name 
            const storeConfig = config.clone()
            if (_.isEmpty(storeConfig.root)) {
                storeConfig.root = rootKey
            }

            if (configByName.has(storeConfig.name)) {
                throw new Error(`Duplicate store name: ${storeConfig.name}`)
            } else {
                configByName.set(storeConfig.name, storeConfig)
            }
        })
    }

    return {
        createStoreConfig
    }
}

export { storeConfiguration }