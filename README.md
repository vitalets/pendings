# Pendings

[![Build Status](https://travis-ci.org/vitalets/pendings.svg?branch=master)](https://travis-ci.org/vitalets/pendings)
[![npm](https://img.shields.io/npm/v/pendings.svg)](https://www.npmjs.com/package/pendings)
[![license](https://img.shields.io/npm/l/pendings.svg)](https://www.npmjs.com/package/pendings)

> Better control of [Promises]

*Pendings* is a wrapping library over [Promises] providing flexible control of promise lifecycle. 
It is useful for event-based code where you need to manually store `resolve` / `reject` callbacks for later fulfillment.
It reduces boilerplate code and allows to split business logic from promise manipulation.

## Installation
```bash
npm install pendings --save
```

## Features
* automatically store `resolve` / `reject` callbacks for later fulfillment
* automatically return existing promise for all calls until promise is fulfilled
* automatic reject promise after configured `timeout`
* flexible manipulation with list of promises: dynamic insert and `waitAll()` method

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

## Classes

<dl>
<dt><a href="#Pending">Pending</a></dt>
<dd></dd>
<dt><a href="#Pendings">Pendings</a></dt>
<dd></dd>
<dt><a href="#TimeoutError">TimeoutError</a></dt>
<dd></dd>
</dl>

<a name="Pending"></a>

## Pending
**Kind**: global class  

* [Pending](#Pending)
    * [new Pending([options])](#new_Pending_new)
    * [.promise](#Pending+promise) ⇒ <code>Promise</code>
    * [.value](#Pending+value) ⇒ <code>\*</code>
    * [.isResolved](#Pending+isResolved) ⇒ <code>Boolean</code>
    * [.isRejected](#Pending+isRejected) ⇒ <code>Boolean</code>
    * [.isFulfilled](#Pending+isFulfilled) ⇒ <code>Boolean</code>
    * [.isPending](#Pending+isPending) ⇒ <code>Boolean</code>
    * [.onFulfilled](#Pending+onFulfilled)
    * [.call(fn, [options])](#Pending+call) ⇒ <code>Promise</code>
    * [.resolve([value])](#Pending+resolve)
    * [.reject([value])](#Pending+reject)
    * [.fulfill([resolveValue], [rejectValue])](#Pending+fulfill)
    * [.reset([error])](#Pending+reset)

<a name="new_Pending_new"></a>

### new Pending([options])
Creates instance of single pending promise. It holds `resolve / reject` callbacks for future fulfillment.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.timeout] | <code>Number</code> | <code>0</code> |  |
| [options.autoReset] | <code>String</code> | <code>&#x27;never&#x27;</code> | condition for auto-reset pending to initial state. Possible values: - `never`: calling `.call()` will return existing promise except first call. - `fufilled`: calling `.call()` will return existing promise while promise is pending. - `rejected`: calling `.call()` will return existing promise while promise is pending or if it was resolved. If promise was rejected, `.call()` will construct and return new promise. - `resolved`: calling `.call()` will return existing promise while promise is pending or if it was rejected. If promise was resolved, `.call()` will construct and return new promise. |

<a name="Pending+promise"></a>

### pending.promise ⇒ <code>Promise</code>
Returns promise itself.

**Kind**: instance property of [<code>Pending</code>](#Pending)  
<a name="Pending+value"></a>

### pending.value ⇒ <code>\*</code>
Returns value with that promise was fulfilled (resolved or rejected).

**Kind**: instance property of [<code>Pending</code>](#Pending)  
<a name="Pending+isResolved"></a>

### pending.isResolved ⇒ <code>Boolean</code>
Returns true if promise resolved.

**Kind**: instance property of [<code>Pending</code>](#Pending)  
<a name="Pending+isRejected"></a>

### pending.isRejected ⇒ <code>Boolean</code>
Returns true if promise rejected.

**Kind**: instance property of [<code>Pending</code>](#Pending)  
<a name="Pending+isFulfilled"></a>

### pending.isFulfilled ⇒ <code>Boolean</code>
Returns true if promise fulfilled (resolved or rejected).

**Kind**: instance property of [<code>Pending</code>](#Pending)  
<a name="Pending+isPending"></a>

### pending.isPending ⇒ <code>Boolean</code>
Returns true if promise is pending.

**Kind**: instance property of [<code>Pending</code>](#Pending)  
<a name="Pending+onFulfilled"></a>

### pending.onFulfilled
Callback called when promise is fulfilled (resolved or rejected).

**Kind**: instance property of [<code>Pending</code>](#Pending)  

| Param | Type |
| --- | --- |
| fn | <code>function</code> | 

<a name="Pending+call"></a>

### pending.call(fn, [options]) ⇒ <code>Promise</code>
For the first time this method calls `fn` and returns new promise. Also holds `resolve` / `reject` callbacks
to allow fulfill promise via `pending.resolve()` and `pending.reject()`. All subsequent calls of `.call(fn)`
will return the same promise, which can be still pending or already fulfilled.
To reset this behavior use `.reset()`. If `options.timeout` is specified, the promise will be automatically
rejected after `timeout` milliseconds with `TimeoutError`.

**Kind**: instance method of [<code>Pending</code>](#Pending)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fn | <code>function</code> |  |  |
| [options] | <code>Object</code> |  |  |
| [options.timeout] | <code>Number</code> | <code>0</code> | timeout after which promise will be automatically rejected |

<a name="Pending+resolve"></a>

### pending.resolve([value])
Resolves pending promise with specified `value`.

**Kind**: instance method of [<code>Pending</code>](#Pending)  

| Param | Type |
| --- | --- |
| [value] | <code>\*</code> | 

<a name="Pending+reject"></a>

### pending.reject([value])
Rejects pending promise with specified `value`.

**Kind**: instance method of [<code>Pending</code>](#Pending)  

| Param | Type |
| --- | --- |
| [value] | <code>\*</code> | 

<a name="Pending+fulfill"></a>

### pending.fulfill([resolveValue], [rejectValue])
Helper method: rejects if `rejectValue` is truthy, otherwise resolves with `resolveValue`.

**Kind**: instance method of [<code>Pending</code>](#Pending)  

| Param | Type |
| --- | --- |
| [resolveValue] | <code>\*</code> | 
| [rejectValue] | <code>\*</code> | 

<a name="Pending+reset"></a>

### pending.reset([error])
Resets to initial state.

**Kind**: instance method of [<code>Pending</code>](#Pending)  

| Param | Type | Description |
| --- | --- | --- |
| [error] | <code>Error</code> | custom rejection error if promise is in pending state. |

<a name="Pendings"></a>

## Pendings
**Kind**: global class  

* [Pendings](#Pendings)
    * [new Pendings([options])](#new_Pendings_new)
    * [.count](#Pendings+count) ⇒ <code>Number</code>
    * [.add(fn, [options])](#Pendings+add) ⇒ <code>Promise</code>
    * [.set(id, fn, [options])](#Pendings+set) ⇒ <code>Promise</code>
    * [.has(id)](#Pendings+has) ⇒ <code>Boolean</code>
    * [.resolve(id, [value])](#Pendings+resolve)
    * [.reject(id, [value])](#Pendings+reject)
    * [.fulfill(id, [resolveValue], [rejectValue])](#Pendings+fulfill)
    * [.tryResolve(id, [value])](#Pendings+tryResolve)
    * [.tryReject(id, [value])](#Pendings+tryReject)
    * [.tryFulfill(id, [resolveValue], [rejectValue])](#Pendings+tryFulfill)
    * [.rejectAll([value])](#Pendings+rejectAll)
    * [.waitAll()](#Pendings+waitAll) ⇒ <code>Promise</code>
    * [.clear()](#Pendings+clear)
    * [.generateId()](#Pendings+generateId) ⇒ <code>String</code>

<a name="new_Pendings_new"></a>

### new Pendings([options])
Manipulation of list of promises.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  |  |
| [options.autoRemove] | <code>Number</code> | <code>false</code> | automatically remove fulfilled promises from list |
| [options.timeout] | <code>Number</code> | <code>0</code> | default timeout for all promises |
| [options.idPrefix] | <code>String</code> | <code>&#x27;&#x27;</code> | prefix for generated promise IDs |

<a name="Pendings+count"></a>

### pendings.count ⇒ <code>Number</code>
Returns count of pending / fulfilled promises in the list.

**Kind**: instance property of [<code>Pendings</code>](#Pendings)  
<a name="Pendings+add"></a>

### pendings.add(fn, [options]) ⇒ <code>Promise</code>
Calls `fn` and returns new promise. `fn` gets generated unique `id` as parameter.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type | Description |
| --- | --- | --- |
| fn | <code>function</code> |  |
| [options] | <code>Object</code> |  |
| [options.timeout] | <code>Number</code> | custom timeout for particular promise |

<a name="Pendings+set"></a>

### pendings.set(id, fn, [options]) ⇒ <code>Promise</code>
Calls `fn` and returns new promise with specified `id`.
If promise with such `id` already pending - it will be returned.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | <code>String</code> |  |  |
| fn | <code>function</code> |  |  |
| [options] | <code>Object</code> |  |  |
| [options.timeout] | <code>Number</code> | <code>0</code> | custom timeout for particular promise |

<a name="Pendings+has"></a>

### pendings.has(id) ⇒ <code>Boolean</code>
Checks if promise with specified `id` is exists in the list.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> | 

<a name="Pendings+resolve"></a>

### pendings.resolve(id, [value])
Resolves pending promise by `id` with specified `value`.
Throws if promise does not exist or is already fulfilled.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> | 
| [value] | <code>\*</code> | 

<a name="Pendings+reject"></a>

### pendings.reject(id, [value])
Rejects pending promise by `id` with specified `value`.
Throws if promise does not exist or is already fulfilled.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> | 
| [value] | <code>\*</code> | 

<a name="Pendings+fulfill"></a>

### pendings.fulfill(id, [resolveValue], [rejectValue])
Rejects pending promise by `id` if `reason` is truthy, otherwise resolves with `value`.
Throws if promise does not exist or is already fulfilled.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> | 
| [resolveValue] | <code>\*</code> | 
| [rejectValue] | <code>\*</code> | 

<a name="Pendings+tryResolve"></a>

### pendings.tryResolve(id, [value])
Resolves pending promise by `id` with specified `value` if it exists.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> | 
| [value] | <code>\*</code> | 

<a name="Pendings+tryReject"></a>

### pendings.tryReject(id, [value])
Rejects pending promise by `id` with specified `value` if it exists.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> | 
| [value] | <code>\*</code> | 

<a name="Pendings+tryFulfill"></a>

### pendings.tryFulfill(id, [resolveValue], [rejectValue])
Rejects pending promise by `id` if `reason` is truthy, otherwise resolves with `value`.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> | 
| [resolveValue] | <code>\*</code> | 
| [rejectValue] | <code>\*</code> | 

<a name="Pendings+rejectAll"></a>

### pendings.rejectAll([value])
Rejects all pending promises with specified `value`. Useful for cleanup.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| [value] | <code>\*</code> | 

<a name="Pendings+waitAll"></a>

### pendings.waitAll() ⇒ <code>Promise</code>
Waits for all promises to fulfill and returns object with resolved/rejected values.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  
**Returns**: <code>Promise</code> - promise resolved with object `{resolved: {id: value, ...}, rejected: {id: value, ...}}`  
<a name="Pendings+clear"></a>

### pendings.clear()
Removes all items from list.
If there is waitAll promise - it will be resolved with empty results.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  
<a name="Pendings+generateId"></a>

### pendings.generateId() ⇒ <code>String</code>
Generates unique ID. Can be overwritten.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  
<a name="TimeoutError"></a>

## TimeoutError
**Kind**: global class  
<a name="new_TimeoutError_new"></a>

### new TimeoutError(timeout)
Timeout error for pending promise.


| Param | Type |
| --- | --- |
| timeout | <code>Number</code> | 


## License
MIT @ [Vitaliy Potapov](https://github.com/vitalets)

[Promises]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
