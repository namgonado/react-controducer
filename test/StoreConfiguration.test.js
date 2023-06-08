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
    const configs = [{ root: "root", name: "store1" }];
    let storeConfig = parseConfigs(configs);
    expect(storeConfig).toBeInstanceOf(Map);
    expect(storeConfig.get("store1")).toBeInstanceOf(STORE_CONFIG_TYPE);
    expect(storeConfig.get("store1").name).toBe("store1");
  });

  it("should return duplicate error", () => {
    // const {createStoreConfig, parseConfigs} = storeConfiguration();
    const configs = [
      { root: "root", name: "store1" },
      { root: "root1", name: "store1" },
    ];
    try {
      parseConfigs(configs);
    } catch (err) {
      expect(err.message).toEqual("Duplicate store name: store1");
    }
  });
});

describe("createStoreConfig", () => {
  it("should return a storeConfig", () => {
    const { createStoreConfig } = storeConfiguration();
    const storeConfig = createStoreConfig(
      { root: "root", name: "name" },
      "pathToRoot/"
    );

    expect(storeConfig).toHaveProperty("name", "name");
    expect(storeConfig).toBeInstanceOf(STORE_CONFIG_TYPE);
  });
  it("should return a storeConfig", () => {
    expect(counterConfig).toHaveProperty("name", "counter");
    expect(counterConfig).toBeInstanceOf(STORE_CONFIG_TYPE);
  });
});

const { createStoreConfig } = storeConfiguration();
export const counterConfig = createStoreConfig({
  name: "counter",
  path: "counter",
  initialState: { value: 0 },
  reducers: {
    increase_value: (store, actionPayload) => {
      return { value: store.value + 1 };
    },
    decrease_value: (store, actionPayload) => {
      return { value: store.value - 1 };
    },
  },
});
