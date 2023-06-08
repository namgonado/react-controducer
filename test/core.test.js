import { core } from "../src/Core";
import { COMBINE_STORE_TYPE } from "../src/common";
import React from "react";

function getConfigs(type) {
  if (type === COMBINE_STORE_TYPE) {
    const configByName = new Map();
    configByName.set("config", "value");

    const config = new COMBINE_STORE_TYPE();
    config.configByName = configByName;
    return config;
  }
}

describe("core", () => {
  it("should create a React Context when use COMBINE_STORE_TYPE ", () => {
    const {
      configureRoot,
      getRootContext,
      DutyExecutor,
      getCallOf,
      dispatch,
      Registry,
    } = new core();

    const configs = getConfigs(COMBINE_STORE_TYPE);
    configureRoot(configs);
    const rootContext = getRootContext();

    const anotherContext = React.createContext({});
    expect(typeof rootContext).toEqual(typeof anotherContext);
  });
});
