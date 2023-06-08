import {parseConfigs, storeConfiguration} from "../src/StoreConfiguration.js";
import { COMBINE_STORE_TYPE, STORE_CONFIG_TYPE } from "../src/common.js";

describe("parseConfig", () => {
  it("should return a object attached with configByName field", () => {
    const configByName = new Map();
    configByName.set("config", "value");

    const config = new COMBINE_STORE_TYPE();
    config.configByName = configByName;

    const result = parseConfigs(config);
    expect(result).toBe(configByName);
  });

  it("should return a Map of store", () => {
    // const {createStoreConfig, parseConfigs} = storeConfiguration();
    const configs = [{root: "root", name: "store1"}];
    let storeConfig = parseConfigs(configs);
    expect(storeConfig).toBeInstanceOf(Map);
    expect(storeConfig.get("store1")).toBeInstanceOf(STORE_CONFIG_TYPE)
    expect(storeConfig.get("store1").name).toBe("store1")
  });
});

describe("createStoreConfig", () => {
  it("should return a storeConfig", () => {
    const {createStoreConfig} = storeConfiguration();
    const storeConfig = createStoreConfig({root: "root", name:"name"}, "pathToRoot/");

    expect(storeConfig).toHaveProperty("name", "name");
    expect(storeConfig).toBeInstanceOf(STORE_CONFIG_TYPE);
  });
});
