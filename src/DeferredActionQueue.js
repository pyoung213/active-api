import _ from "lodash";

export default {
    create
};

function create() {
    const deferredQueue = {};

    return {
        get,
        set,
        remove,
        getPromise,
        resolvePromise,
        rejectPromise,
        getCleanedQueue
    };

    function get(id, type) {
        return _.get(deferredQueue, [id, type]);
    }

    function getPromise(id, type) {
        return _.get(deferredQueue, [id, type, "promise"]);
    }

    function set(id, type, path, value) {
        const payload = {
            path,
            value
        };

        payload.promise = new Promise((resolve, reject) => {
            payload.resolve = resolve;
            payload.reject = reject;
        });

        _.set(deferredQueue, [id, type], payload);
    }

    function resolvePromise(id, type) {
        const resolve = _.get(deferredQueue, [id, type, "resolve"], () => 0);
        resolve();
        remove(id, type);
    }

    function rejectPromise(id, type) {
        const reject = _.get(deferredQueue, [id, type, "reject"], () => 0);
        reject();
    }

    function remove(id, type) {
        if (!type) {
            delete deferredQueue[id];

            return;
        }

        const queue = _.get(deferredQueue, id, {});
        delete queue[type];
    }

    function getCleanedQueue() {
        return _.mapValues(deferredQueue, (ids) => {
            return _.mapValues(ids, (item) => {
                return _.omit(item, ["promise", "resolve", "reject"]);
            });
        });
    }
}
