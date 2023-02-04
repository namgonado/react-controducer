# react-controducer
A react library to help front-end developers build React application with **stores, reducers and controllers** patterns. This is a pure React library, lightweight and easily adaptable to any current React based application. It doens't introduce any new technology but utilize the built-in React core functions to ensure the performance and integrity of React Framework.

`react-controducer` not only provides stores, reducers, but also bringing Controller into the store-reducer cycle and centralizing the management of React view components. If you're familiar with the Redux syntax, the controller will give you the same effect but with React's native rules.
## Contact & Questions
Owner: <namgonado@gmail.com>
## Features

- Define configurable stores across application
- Define Reducers and Actions set for each store
- Define Controllers that can "consume" one or many stores and processing data for React components group
- Define Duty, an independent executable unit that can be called from anywhere in the application
- Built-in Hooks for store, controllers, duties
## Installation
The library require React ^17.0.0 or later, lodash 4 or later versions to run
```shell
npm install --save react@^17.0.0
npm install --save lodash@^4.0.0
```
then install Controducer
```ssh
npm install --save react-controducer
```

## Document
- Introduction: https://yoopage.org/universal/voyage/1/planet/1/spaceship/1?view=spaceship
- Getting started - Quick Start Guide: https://yoopage.org/universal/voyage/1/planet/1/spaceship/3?view=spaceship
- How to configure multiple nested store: https://yoopage.org/universal/voyage/1/planet/1/spaceship/10?view=spaceship
- Create Duty, an excutable asynchronous function outside controller: https://yoopage.org/universal/voyage/1/planet/1/spaceship/4?view=spaceship
- API Reference: https://yoopage.org/universal/voyage/1/planet/2?view=planet