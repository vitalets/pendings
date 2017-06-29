# Pendings

[![Build Status](https://travis-ci.org/vitalets/pendings.svg?branch=master)](https://travis-ci.org/vitalets/pendings)
[![npm](https://img.shields.io/npm/v/pendings.svg)](https://www.npmjs.com/package/pendings)
[![license](https://img.shields.io/npm/l/pendings.svg)](https://www.npmjs.com/package/pendings)

> Better control of pending [Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)

*Pendings* is a library for advanced control of single promise (or list of promises) by providing direct access `resolve` / `reject` callbacks.

## Installation
```bash
npm install pendings --save
```

## Example
When working with Promises sometimes we need to store `resolve` / `reject` callbacks for future fulfillment: 
```js
class MyClass {
    waitSomeEvent() { 
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.request();
        });
    }
    
    onEvent(event) {
        this.resolve(event.data);
    }
    
    onError(event) {
        this.reject(event.data);
    }
}

```
This library allows to reduce boilerplate code by automatically storing `resolve` / `reject` callbacks:

```js
const Pending = require('pendings').Pending;

class MyClass {
    constructor() {
        this.pending = new Pending();
    }    

    waitSomeEvent() { 
        return this.pending.call(() => this.request());
    }
    
    onEvent(event) {
        this.pending.resolve(event.data);
    }
    
    onError(event) {
        this.pending.reject(event.data);
    }
}
```
Moreover, it is useful when working with list of pending promises. 
The unique `id` is generated for each promise and allows to fulfill it later: 
```js
const Pendings = require('pendings');

class MyClass {
    constructor() {
        this.pendings = new Pendings();
    }    

    sendDataAndWaitResponse(data) { 
        return this.pendings.add(id => {
            data.id = id;
            this.send(data);
        });
    }
    
    onEvent(event) {
        const data = event.data;
        this.pendings.resolve(data.id, data);
    }
    
    onError(event) {
        const data = event.data;        
        this.pendings.reject(data.id, data);
    }
}
```

## API

{{>main}}

## License
MIT @ [Vitaliy Potapov](https://github.com/vitalets)
