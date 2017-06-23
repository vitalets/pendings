# Pendings

[![Build Status](https://travis-ci.org/vitalets/pendings.svg?branch=master)](https://travis-ci.org/vitalets/pendings)
[![npm](https://img.shields.io/npm/v/pendings.svg)](https://www.npmjs.com/package/pendings)
[![license](https://img.shields.io/npm/l/pendings.svg)](https://www.npmjs.com/package/pendings)

> Better control of pending promises

*Pendings* provides better control of pending [Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)
by automatic managing their `resolve` / `reject` callbacks.

## Installation
```bash
npm install pendings --save
```

## Example
In promise-based classes sometimes we need to store `resolve` / `reject` callbacks for future promise fulfillment. 
E.g.:
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
*Pendings* library allows to simplify it:

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
Moreover, it is useful for list of pending promises. 
The unique `id` is generated for each promise and allows to fulfill it: 
```js
const Pendings = require('pendings');

class MyClass {
    constructor() {
        this.pendings = new Pendings();
    }    

    sendDataAndWait(data) { 
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

* `Pendings` - controls list of promises
  * `.add(fn)` - calls `fn` and returns new promise. `fn` gets unique `id` as parameter. 
  * `.set(id, fn)` - calls `fn` and returns new promise with specified `id`.
  * `.resolve(id, value)` - resolves pending promise by `id` with specified `value`
  * `.reject(id, reason)` - rejects pending promise by `id` with specified `reason`
  * `.fulfill(id, reason)` - rejects pending promise if `reason` is specified, otherwise resolves with empty value 
  
* `Pending` - controls single promise
  * `.call(fn)` - calls `fn` and returns new promise
  * `.resolve(value)` - resolves pending promise
  * `.reject(reason)` - reject pending promise
  * `.fulfill(reason)` - rejects pending promise if `reason` is specified, otherwise resolves with empty value

## License
MIT @ [Vitaliy Potapov](https://github.com/vitalets)
