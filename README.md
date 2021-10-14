# firestore-multibatch-typescript
Replacement for [Firestore.WriteBatch](https://firebase.google.com/docs/reference/js/firebase.firestore.WriteBatch) that makes it easy without worrying about [500 batch operations limit](https://firebase.google.com/docs/firestore/quotas) written in typescript.

With this replacement you do not have to worry about the max limit of 500 writes per batch. Just add batches and call batch.commit() when you are finished.

This is an adaptation from [https://github.com/stpch/firestore-multibatch](https://github.com/stpch/firestore-multibatch) library to TypeScript.

## Installation

Simply drag this file anywhere inside your **src** folder and call it from your file.

## Usage

```ts
import * as admin from 'firebase-admin'
// import multiBatch
import { MultiBatch } from "./multiBatch";

admin.initializeApp({/* ... */});

const db = admin.firestore();
const batch = new MultiBatch(db); // Instead of db.batch()

// Perform batch operations same as with db.batch()
for (let i = 0; i < 1000; i++) {
    batch.set(db.collection('test').doc(), {foo: 'bar'});
}

// with async/await but can also be used with simple promise.then()
const result = await batch.commit();
```
