# Pendings

[![Build Status](https://travis-ci.org/vitalets/pendings.svg?branch=master)](https://travis-ci.org/vitalets/pendings)
[![npm](https://img.shields.io/npm/v/pendings.svg)](https://www.npmjs.com/package/pendings)
[![license](https://img.shields.io/npm/l/pendings.svg)](https://www.npmjs.com/package/pendings)

> Better control of [Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise)

*Pendings* is a library for more flexible control over promises. It is useful in event-based code
where you need to manually store `resolve` / `reject` callbacks for later fulfillment.
It reduces boilerplate code and allows to split business logic from promise manipulation.

## Installation
```bash
npm install pendings --save
```

## Usage (single promise)
Typical situation with promises in event-based code:
```js
class Foo {
    constructor() {
      this.promise = null;
      this.resolve = null;
      this.reject = null;
    }
    asyncRequest() {
        if (this.promise) { // if promise already exists - return it
            return this.promise;
        }
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
            this.send();
        });
        return this.promise;
    }
    onSuccess(data) {
        this.resolve(data);
    }
}    
```    
[Pending](#Pending) class allows to do it simpler:   
```js
const Pending = require('pendings').Pending;

class Foo {
    constructor() {
        this.pending = new Pending();
    }
    asyncRequest() { 
        return this.pending.call(() => this.send());
    }
    onSuccess(data) {
        this.pending.resolve(data);
    }
}
```
## Usage (list of promises)
[Pendings](#Pendings) class is useful for dynamic list of promises. 
Each promise gets unique `id` (manually or auto-generated) and can be resolved later by that id.
```js
const Pendings = require('pendings');

class Foo {
    constructor() {
        this.pendings = new Pendings();
    }    

    asyncRequest() { 
        return this.pendings.add(id => {
            this.send({id, foo: 'bar'}); // mark request with unique generated `id`
        });
    }
    
    onSuccess(data) {
        this.pendings.resolve(data.id, data); // resolve by `id`
    }
    
    onError(data) {
        this.pendings.reject(data.id, data); // reject by `id`
    }
}
```

## API

{{>main}}

## License
MIT @ [Vitaliy Potapov](https://github.com/vitalets)
