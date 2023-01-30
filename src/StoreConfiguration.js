import _ from "lodash"

function STORE_CONFIG_TYPE() {}
Object.freeze(STORE_CONFIG_TYPE.prototype)

function createStoreConfig(config, pathToRoot) {

    if (!config.name) {
        throw new Error("Store configuration must contain name attribute")
    }

    const root = config.path || null;

    const self = {
        ...config,
        get path() {
            //Path = name + external pathToRoot
            let path = [this.root]

            if (pathToRoot) {
                path = path.concat[pathToRoot]
            }

            return path
        },
        get root() { 
            return root
        },
        set root(newRoot) {
            root = newRoot
        }
    }

    Object.setPrototypeOf(self, STORE_CONFIG_TYPE.prototype)

    return self
}

function parseConfigs(configs) {
    const configByName = new Map()

    for (const [key, config] of Object.entries(configs)) {
        let storeConfig
        if (config instanceof STORE_CONFIG_TYPE) {
            storeConfig = config
        } else {
            storeConfig = createStoreConfig(config)
        }

        //The config object doesn't contain root, take the key as store name 
        if (!storeConfig.root) {
            storeConfig = _.cloneDeep(storeConfig)
            storeConfig.root = key
        }

        if (configByName.has(storeConfig.name)) {
            throw new Error(`Duplicate store name: ${storeConfig.name}`)
        } else {
            configByName.set(storeConfig.name, storeConfig)
        }
    }

    return configByName
}

export default {
    createStoreConfig,
    parseConfigs,
    
    STORE_CONFIG_TYPE
}
