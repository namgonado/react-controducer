import { core } from "./Core"
import { controller } from "./Controller"
import { hooks } from "./Hooks"
import { storeConfiguration } from "./StoreConfiguration"
import { combineStore } from "./CombinedStore"

const Core = core()
const Controller = controller({ Core })
const Hooks = hooks({ Core, Controller })
const StoreConfiguration = storeConfiguration()
const CombinedStore = combineStore({ StoreConfiguration })

export const { configureRoot } = Core
export const { createController, withController } = Controller
export const { useStore, useCallOf, useDispatch, useController } = Hooks
export const { combineStores } = CombinedStore
export const { createStoreConfig } = StoreConfiguration