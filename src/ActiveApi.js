// @providesModule AA-ActiveApi

import _ from "lodash";
import moment from "moment";
import ActiveApiAlert from "./ActiveApiAlert";
import ActiveApiSessionCache from "./ActiveApiSessionCache";
import ActiveApiQueue from "./ActiveApiQueue";
import Utils from "./ActiveApiUtils";

export default {
    create
};

function create(config) {
    const SessionCache = ActiveApiSessionCache.create(config);
    const Alert = ActiveApiAlert.create(config);
    const ApiQueue = ActiveApiQueue.create(config);

    const fetching = {};
    let lastTimePulled = moment();

    _.set(config, "dependents", []);

    const service = {
        isAvailable,
        isExpired,
        get,
        getById,
        refresh,
        create,
        update,
        remove,
        action,

        dependents: config.dependents,

        _transformResponse,
        _fetchIfExpired,
        _fetch,
        _doCreate,
        _doPollingFetch,
        _constructKey,
        _constructUrl,
        SessionCache,
        Alert,
        ApiQueue,
        get _masterCache() {
            return SessionCache.masterCache;
        }
    };

    createDependancies();
    createPolling(service);

    return service;

    function createDependancies() {
        _.each(config.dependencies, (dependency) => {
            dependency.dependents.push(service);
        });
    }

    function createPolling(service) {
        if (!config.pollingTime) {
            return;
        }

        const split = _.split(config.pollingTime, " ");
        const milliseconds = moment.duration(Number(split[0]), split[1]).asMilliseconds();

        setInterval(() => {
            service._doPollingFetch();
        }, milliseconds);
    }

    function isAvailable(id) {
        const params = id
            ? {
                id
            }
            : undefined;

        this._fetchIfExpired(params);

        const constructedKey = this._constructKey(params);

        return !!SessionCache.get(constructedKey);
    }

    function isExpired() {
        return SessionCache.isExpired();
    }

    function get(params, options) {
        if (config.getReturnPromise) {
            return this._fetchIfExpired(params, options);
        }

        this._fetchIfExpired(params, options);

        const constructedKey = this._constructKey(params);

        return SessionCache.get(constructedKey);
    }

    function getById(id) {
        if (!id) {
            return;
        }

        return this.get({
            id
        });
    }

    async function refresh(params) {
        await this._fetch(params);
    }

    function create(payload) {
        const url = this._constructUrl();

        if (_.isArray(payload) && config.isOffline) {
            SessionCache.set(url, payload);

            return SessionCache.get(url);
        }

        if (payload.id) {
            SessionCache.set(payload.id, payload);
            this._doCreate(url, payload);

            Alert.success(ActiveApiAlert.CREATE);

            return SessionCache.get(payload.id);
        }

        return new Promise(async (resolve, reject) => {
            try {
                const response = await this._doCreate(url, payload);
                resolve(response);
                Alert.success(ActiveApiAlert.CREATE);
            } catch (error) {
                Alert.error(ActiveApiAlert.CREATE, error);
                reject(error);
            }
        });
    }

    async function _doCreate(url, payload) {
        const response = await ApiQueue.create(url, payload);
        const cookedResponse = await this._transformResponse(response);
        const oldPayload = SessionCache.get(cookedResponse.id);

        const merged = _.merge(cookedResponse, oldPayload);

        const key = this._constructKey();
        SessionCache.unshift(key, merged);

        return cookedResponse;
    }

    function update(id, payload) {
        const url = this._constructUrl({ id });
        try {
            ApiQueue.patch(url, payload, id)
                .catch((error) => {
                    throw error;
                });

            SessionCache.setObject(id, payload);
            Alert.success(ActiveApiAlert.UPDATE);
        } catch (error) {
            Alert.error(ActiveApiAlert.UPDATE, error);
            throw error;
        }
    }

    function remove(id) {
        const url = this._constructUrl({ id });

        try {
            SessionCache.remove(id);
            Alert.success(ActiveApiAlert.REMOVE);

            ApiQueue.remove(url, id)
                .catch((error) => {
                    throw error;
                });
        } catch (error) {
            Alert.error(ActiveApiAlert.REMOVE, error);
            throw error;
        }
    }

    async function action(actionName, id, payload) {
        const urlBase = this._constructUrl({ id });
        const url = `${urlBase}/${actionName}`;

        try {
            const response = await ApiQueue.post(url, payload, id);
            const cookedResponse = await this._transformResponse(response);

            const setObject = SessionCache.set(cookedResponse.id, cookedResponse);

            Alert.success(ActiveApiAlert.ACTION);

            return setObject;
        } catch (error) {
            Alert.error(ActiveApiAlert.ACTION, error);
            throw error;
        }
    }

    async function _fetchIfExpired(params, options = {}) {
        const newKey = this._constructKey(params);

        if (SessionCache.get(newKey)) {
            const isExpired = SessionCache.isExpired();
            if (!isExpired && !options.forceRefresh) {
                return SessionCache.get(newKey);
            }
        }

        return await this._fetch(params);
    }

    async function _doPollingFetch() {
        const url = this._constructKey({
            since: lastTimePulled.toISOString()
        });

        lastTimePulled = moment();

        const response = await ApiQueue.get(url);
        if (_.isEmpty(response)) {
            return;
        }

        const cookedData = await this._transformResponse(response);

        const newKey = this._constructKey();
        SessionCache.update(newKey, cookedData);

        Alert.success(ActiveApiAlert.GET);
    }

    async function _fetch(params = {}) {
        let url = this._constructUrl(params);

        if (config.forceGetAll) {
            const key = this._constructKey();
            if (!_.isEmpty(SessionCache.get(key))) {
                return;
            }

            url = this._constructUrl();
        }

        if (fetching[url]) {
            return;
        }

        fetching[url] = true;

        try {
            const response = await ApiQueue.get(url);
            const cookedData = await this._transformResponse(response);

            let newKey = this._constructKey(params);

            if (config.forceGetAll && params.id) {
                newKey = this._constructKey();
            }

            SessionCache.set(newKey, cookedData);

            Alert.success(ActiveApiAlert.GET);

            return response;
        } catch (error) {
            Alert.error(ActiveApiAlert.GET, error);
            throw error;
        } finally {
            fetching[url] = false;
        }
    }

    async function _transformResponse(response) {
        if (!config.transformResponse) {
            return response;
        }

        return config.transformResponse(response);
    }

    function _constructKey(params = {}) {
        if (_.keys(params).length === 1 && params.id) {
            return params.id;
        }

        return this._constructUrl(params);
    }

    function _constructUrl(params = {}) {
        const urlWithParams = Utils.replaceUrlParamsWith(config.url, params);
        const cleanedUrl = Utils.removeParamsFromUrl(urlWithParams);
        const searchParams = Utils.removeParamsThatMatchUrl(params);
        const serializedParams = Utils.serializeParams(searchParams);

        return serializedParams ?
            `${cleanedUrl}?${serializedParams}` :
            cleanedUrl;
    }
}
