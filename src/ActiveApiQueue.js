import _ from "lodash";
import ActiveApiDeferredQueue from "./DeferredActionQueue";

const offlineQueue = {
    get: async () => 0,
    create: async (_id, payload) => payload,
    post: async (_id, payload) => payload,
    patch: async (_id, payload) => payload,
    remove: async () => 0
};

export default {
    create
};

function create(config) {
    if (config.isOffline) {
        return offlineQueue;
    }

    const Api = config.api;
    const DeferredQueue = ActiveApiDeferredQueue.create();
    const debouncedPatch = _.debounce(doPatch, config.patchDebounceTime || 3000);

    return {
        get,
        create,
        post,
        patch,
        remove
    };

    async function get(path) {
        return Api.get(path);
    }

    async function create(path, value, id) {
        if (id) {
            setQueue(id, "create", path, value);
        }
        try {
            const response = await Api.post(path, value);
            resolveQueue(id, "create");

            return response;
        } catch (error) {
            DeferredQueue.rejectPromise(id, "create");
            throw error;
        }
    }

    async function post(path, value, id) {
        setQueue(id, "post", path, value);

        await DeferredQueue.getPromise(id, "create");
        debouncedPatch.flush();
        await DeferredQueue.getPromise(id, "update");

        try {
            const response = await Api.post(path, value);
            resolveQueue(id, "post");

            return response;
        } catch (error) {
            DeferredQueue.rejectPromise(id, "post");
            throw error;
        }
    }

    async function patch(path, value, id) {
        const oldUpdate = DeferredQueue.get(id, "update");
        const oldValue = _.get(oldUpdate, "value", {});

        const payload = {
            ...oldValue,
            ...value
        };

        setQueue(id, "update", path, payload);

        try {
            debouncedPatch(id, path, payload);
        } catch (error) {
            throw error;
        }
    }

    async function remove(path, id) {
        setQueue(id, "remove", path);

        await DeferredQueue.getPromise(id, "create");
        debouncedPatch.flush();
        await DeferredQueue.getPromise(id, "update");
        await DeferredQueue.getPromise(id, "post");

        try {
            await Api.delete(path);
            resolveQueue(id, "remove");
        } catch (error) {
            throw error;
        }
    }

    async function doPatch(id, path, payload) {
        await DeferredQueue.getPromise(id, "create");

        try {
            await Api.patch(path, payload);

            resolveQueue(id, "update");
        } catch (error) {
            DeferredQueue.rejectPromise(id, "update");
            throw error;
        }
    }

    function setQueue(id, type, path, value) {
        DeferredQueue.set(id, type, path, value);
    }

    function resolveQueue(id, type) {
        DeferredQueue.resolvePromise(id, type);
    }
}
