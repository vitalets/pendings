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

## Classes

<dl>
<dt><a href="#Pendings">Pendings</a></dt>
<dd></dd>
<dt><a href="#Pending">Pending</a></dt>
<dd></dd>
</dl>

<a name="Pendings"></a>

## Pendings
**Kind**: global class  

* [Pendings](#Pendings)
    * [new Pendings([options])](#new_Pendings_new)
    * [.add(fn, [options])](#Pendings+add) ⇒ <code>Promise</code>
    * [.set(id, fn, [options])](#Pendings+set) ⇒ <code>Promise</code>
    * [.has(id)](#Pendings+has) ⇒ <code>Boolean</code>
    * [.resolve(id, [value])](#Pendings+resolve)
    * [.reject(id, [reason])](#Pendings+reject)
    * [.fulfill(id, [value], [reason])](#Pendings+fulfill)
    * [.tryResolve(id, [value])](#Pendings+tryResolve)
    * [.tryReject(id, [reason])](#Pendings+tryReject)
    * [.tryFulfill(id, [value], [reason])](#Pendings+tryFulfill)
    * [.rejectAll([reason])](#Pendings+rejectAll)
    * [.getPromise(id)](#Pendings+getPromise) ⇒ <code>Promise</code> \| <code>undefined</code>
    * [.generateId()](#Pendings+generateId) ⇒ <code>String</code>

<a name="new_Pendings_new"></a>

### new Pendings([options])
Constructor.


| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>Object</code> |  |
| [options.timeout] | <code>Number</code> | default timeout for all promises |

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

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> \| <code>Number</code> |  |
| fn | <code>function</code> |  |
| [options] | <code>Object</code> |  |
| [options.timeout] | <code>Number</code> | custom timeout for particular promise |

<a name="Pendings+has"></a>

### pendings.has(id) ⇒ <code>Boolean</code>
Checks if pending promise with specified `id` exists.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> \| <code>Number</code> | 

<a name="Pendings+resolve"></a>

### pendings.resolve(id, [value])
Resolves pending promise by `id` with specified `value`.
Throws if promise does not exist.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> \| <code>Number</code> | 
| [value] | <code>\*</code> | 

<a name="Pendings+reject"></a>

### pendings.reject(id, [reason])
Rejects pending promise by `id` with specified `reason`.
Throws if promise does not exist.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> \| <code>Number</code> | 
| [reason] | <code>\*</code> | 

<a name="Pendings+fulfill"></a>

### pendings.fulfill(id, [value], [reason])
Rejects pending promise by `id` if `reason` is truthy, otherwise resolves with `value`.
Throws if promise does not exist.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> \| <code>Number</code> | 
| [value] | <code>\*</code> | 
| [reason] | <code>\*</code> | 

<a name="Pendings+tryResolve"></a>

### pendings.tryResolve(id, [value])
Resolves pending promise by `id` with specified `value` if it exists.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> \| <code>Number</code> | 
| [value] | <code>\*</code> | 

<a name="Pendings+tryReject"></a>

### pendings.tryReject(id, [reason])
Rejects pending promise by `id` with specified `reason` if it exists.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> \| <code>Number</code> | 
| [reason] | <code>\*</code> | 

<a name="Pendings+tryFulfill"></a>

### pendings.tryFulfill(id, [value], [reason])
Rejects pending promise by `id` if `reason` is truthy, otherwise resolves with `value`.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> \| <code>Number</code> | 
| [value] | <code>\*</code> | 
| [reason] | <code>\*</code> | 

<a name="Pendings+rejectAll"></a>

### pendings.rejectAll([reason])
Rejects all pending promises with specified `reason`. Useful for cleanup.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| [reason] | <code>\*</code> | 

<a name="Pendings+getPromise"></a>

### pendings.getPromise(id) ⇒ <code>Promise</code> \| <code>undefined</code>
Returns promise of pending object with specified `id`.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  

| Param | Type |
| --- | --- |
| id | <code>String</code> \| <code>Number</code> | 

<a name="Pendings+generateId"></a>

### pendings.generateId() ⇒ <code>String</code>
Generates unique ID. Can be overwritten.

**Kind**: instance method of [<code>Pendings</code>](#Pendings)  
<a name="Pending"></a>

## Pending
**Kind**: global class  

* [Pending](#Pending)
    * [new Pending()](#new_Pending_new)
    * [.promise](#Pending+promise) ⇒ <code>Promise</code>
    * [.isFulfilled](#Pending+isFulfilled) ⇒ <code>Boolean</code>
    * [.call(fn, [timeout])](#Pending+call) ⇒ <code>Promise</code>
    * [.resolve([value])](#Pending+resolve)
    * [.reject([reason])](#Pending+reject)
    * [.fulfill([value], [reason])](#Pending+fulfill)

<a name="new_Pending_new"></a>

### new Pending()
Constructor.

<a name="Pending+promise"></a>

### pending.promise ⇒ <code>Promise</code>
Returns promise itself.

**Kind**: instance property of [<code>Pending</code>](#Pending)  
<a name="Pending+isFulfilled"></a>

### pending.isFulfilled ⇒ <code>Boolean</code>
Returns is promise fulfilled or not.

**Kind**: instance property of [<code>Pending</code>](#Pending)  
<a name="Pending+call"></a>

### pending.call(fn, [timeout]) ⇒ <code>Promise</code>
Calls `fn`, returns new promise and holds `resolve` / `reject` callbacks.

**Kind**: instance method of [<code>Pending</code>](#Pending)  

| Param | Type | Default |
| --- | --- | --- |
| fn | <code>function</code> |  | 
| [timeout] | <code>Number</code> | <code>0</code> | 

<a name="Pending+resolve"></a>

### pending.resolve([value])
Resolves pending promise with specified `value`.

**Kind**: instance method of [<code>Pending</code>](#Pending)  

| Param | Type |
| --- | --- |
| [value] | <code>\*</code> | 

<a name="Pending+reject"></a>

### pending.reject([reason])
Rejects pending promise with specified `reason`.

**Kind**: instance method of [<code>Pending</code>](#Pending)  

| Param | Type |
| --- | --- |
| [reason] | <code>\*</code> | 

<a name="Pending+fulfill"></a>

### pending.fulfill([value], [reason])
Rejects if `reason` is truthy, otherwise resolves with `value`.

**Kind**: instance method of [<code>Pending</code>](#Pending)  

| Param | Type |
| --- | --- |
| [value] | <code>\*</code> | 
| [reason] | <code>\*</code> | 


## License
MIT @ [Vitaliy Potapov](https://github.com/vitalets)
