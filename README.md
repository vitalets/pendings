# Pendings

[![Build Status](https://travis-ci.org/vitalets/pendings.svg?branch=master)](https://travis-ci.org/vitalets/pendings)
[![npm](https://img.shields.io/npm/v/pendings.svg)](https://www.npmjs.com/package/pendings)
[![license](https://img.shields.io/npm/l/pendings.svg)](https://www.npmjs.com/package/pendings)

> Better control of pending promises

*Pendings* provides better control of pending [Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)
by automatic managing their `resolve | reject` callbacks.

## Motivation
Imagine you are devepoling promise-based WebSocket wrapper.
It has `open()` method that returns `Promise` and resolves when WebSocket `onopen` event comes.
To achieve that you may store `resolve | reject` callbacks as class properties and fulfill them later:
```js
class MyWebSocket {
    /**
     * @returns {Promise} 
     */
    open(url) { 
        return new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            const ws = new WebSocket(url);
            ws.onopen = event => this.onWebSocketOpen(event);
            ws.onerror = event => this.onWebSocketError(event);
        });
    }
    
    onWebSocketOpen(event) {
        this.resolve(event);
    }
    
    onWebSocketError(event) {
        this.reject(event);
    }
}

```
*Pendings* library allows to automatically store `resolve | reject` callbacks:

```js
const Pending = require('pendings').Pendig;

class MyWebSocket {
    constructor() {
        this.pending = new Pending();
    }
    /**
     * @returns {Promise} 
     */
    open(url) { 
        return this.pending.call(() => {
            this.ws = new WebSocket(url);
            this.ws.onopen = event => this.onWebSocketOpen(event);
            this.ws.onerror = event => this.onWebSocketError(event);
        });
    }
    
    onWebSocketOpen(event) {
        this.pending.resolve(event);
    }
    
    onWebSocketError(event) {
        this.pending.reject(event);
    }
}

// usage
new MyWebSocket().open()
  .then(() => console.log('WebSocket opened'));

```
This is even more handy when you have *several pending promises*. 
Then each pending promise has own unique `id` that allows to resolve it when needed: 
```js
const Pendings = require('pendings');

class MyWebSocket {
    constructor() {
        this.pendings = new Pendings();
    }
    /**
     * @returns {Promise} 
     */
    send(data) { 
        return this.pendings.add(id => {
            data.id = id;
            this.ws.send(JSON.stringify(data));
        });
    }
    
    onWebSocketMessage(event) {
        const id = event.data.id;
        this.pendings.resolve(id, event.data);
    }
}

// usage
myWebSocket.send({foo: 'bar'})
  .then(data => console.log('response:', data)); 

```

## Installation
```bash
npm install pendings --save
```

## API

* `Pendings` - controls list of pending promises
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
