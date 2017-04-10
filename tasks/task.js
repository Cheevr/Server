/**
 * Holds information about one tasks with all its workers
 */
class Task {
    constructor(file) {
        this.file = file;
        this.workers = [];
        this._broadcastProxy = new Proxy(this, {
            get: (obj, method) => {
                return (...args) => {
                    // TODO use Promise to return array of responses
                    for (let worker of obj.workers) {
                        worker[method](...args);
                    }
                }
            }
        });
        let idx = 0;
        this._roundRobinProxy = new Proxy(this, {
            get: (obj, method) => {
                return (...args) => {
                    // TODO use Promise to return response
                    idx = idx++ % obj.workers.length;
                    obj.workers[idx][method](...args);
                }
            }
        });
    }

    /**
     * Returns a proxy that will call a method on all workers of a given task.
     * @returns {Proxy}
     */
    get broadcast() {
        return this._broadcastProxy;
    }

    /**
     * Returns a proxy that will call a method on one of the workers for the given task ID, based round robin algorithm.
     * @returns {Proxy}
     */
    get roundRobin() {
        return this._roundRobinProxy;
    }
}

module.exports = Task;
