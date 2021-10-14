import * as Firestore from "@google-cloud/firestore";

// Adapted from https://github.com/stpch/firestore-multibatch to Typescript

// Max batch operations (see https://firebase.google.com/docs/firestore/quotas)
const BATCH_LIMIT = 500;

/**
 * Provides the same batch operations as {@link Firestore.WriteBatch}
 * but uses multiple batch instances to work around Firestore's batch limit.
 */
class MultiBatch {
    // declare properties here
    db: Firestore.Firestore;
    limit: number;
    batches: [Firestore.WriteBatch]
    operations: number;

    /**
     * Constructor for MultiBatch as a replacement for Firestore Batch.
     * @param {Firestore.Firestore} db - the db reference so we can write to the correct database
     * @param {number} limit - Limit writes per batch. Max is 500. If no limit is sent we will use 500.
     */
    constructor(db: Firestore.Firestore, limit: number = BATCH_LIMIT) {
        this.db = db;
        this.limit = limit < BATCH_LIMIT ? limit : BATCH_LIMIT;
        this.batches = [db.batch()];
        this.operations = 0;
    }

    /**
     * Returns the latest Firestore Batch were we can add write operations to.
     * @return {Firestore.WriteBatch} - the last available WriteBatch were we can add write operations to.
     */
    getBatch(): Firestore.WriteBatch {
        // if we had not filled in the batch yet return the latest one
        if (this.operations < this.limit) {
            return this.batches[this.batches.length - 1];
        }

        // otherwise we generate a new batch , push it to batch array and reset operations to 0
        const batch = this.db.batch();
        this.batches.push(batch);
        this.operations = 0;

        // return the latest available batch
        return batch;
    }

    /**
     * Commit all the batches in the batches array to execute all the write operations.
     * @return {Promise} - returns a promise with the execution of all the batches
     */
    async commit(): Promise<void | Firestore.WriteResult[][]> {
        // execute all the batches
        await Promise.all(this.batches.map((batch) => batch.commit()));
        // reset batches and operations so we can get started again
        this.batches = [this.db.batch()];
        this.operations = 0;
    }

    /**
     * Executes a delete write on the batch
     * @param {Firestore.DocumentReference} ref - reference of the document to execute the delete action on
     * @return {MultiBatch} - returns multibatch instance
     */
    delete(ref: Firestore.DocumentReference): MultiBatch {
        this.getBatch().delete(ref);
        this.operations++;

        return this;
    }

    /**
     * Executes a document set data write on the batch with options if we assign them
     * @param {Firestore.DocumentReference} ref - reference of the document to execute the set data action on
     * @param {Firestore.DocumentData} data - the document data to write on the operation
     * @param {Firestore.SetOptions?} options (optional) - any set options for this write. Ex: {merge: true}
     * @return {MultiBatch} - returns multibatch instance
     */
    set(ref: Firestore.DocumentReference, data: Firestore.DocumentData, options?: Firestore.SetOptions): MultiBatch {
        // we dont need options for example if we are creating a document
        // so if options is undefined ignore it from the call
        if (options == undefined) {
            this.getBatch().set(ref, data);
        } else {
            this.getBatch().set(ref, data, options);
        }

        this.operations++;

        return this;
    }

    /**
     * Executes a document update data write on the batch
     * @param {Firestore.DocumentReference} ref - reference of the document to execute the set data action on
     * @param {Firestore.UpdateData} data - the document data to write on the operation
     * @return {MultiBatch}
     */
    update(ref: Firestore.DocumentReference, data: Firestore.UpdateData): MultiBatch {
        this.getBatch().update(ref, data);
        this.operations++;

        return this;
    }
}

export { MultiBatch, BATCH_LIMIT};
