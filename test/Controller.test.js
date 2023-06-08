import { createController, useDispatch, useStore } from "../src";
import { counterConfig } from "./StoreConfiguration.test";
import { controller } from "../src/Controller";

describe("Controller", () => {
  it("happy case", () => {
    const CounterController = createController(counterConfig, (props) => {
      const counter = useStore((rootStore) => rootStore.counter);
      const [dispatch, counterActions] = useDispatch(counterConfig.name);

      return {
        count: counter.value,
        increase: () => {
          dispatch(counterActions.increase_value());
        },
        decrease: () => {
          dispatch(counterActions.decrease_value());
        },
      };
    });

    expect(CounterController).not.toEqual(null);
  });
});
