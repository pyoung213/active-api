import _ from "lodash";
import moment from "moment";

const ALongLongTimeAgo = moment("1986-08-13:00:00Z");

export default {
    create
};

function create(config) {
    const masterCache = {};
    let cacheExpiration = ALongLongTimeAgo;

    return {
        get,
        set,
        setArray,
        setObject,
        remove,
        unshift,
        push,
        forceExpire,
        isExpired,
        expirationTime,
        masterCache,
        setExpiration,
        _getDefaultExpiration
    };

    function get(key) {
        return masterCache[key];
    }

    function set(key, data) {
        setExpiration(_getDefaultExpiration());

        if (_.isArray(data)) {
            return setArray(key, data);
        }

        return setObject(key, data);
    }

    function push(key, data) {
        const cache = get(key) || [];

        return set(key, cache.push(data));
    }

    function unshift(key, data) {
        const cache = get(key) || [];

        return set(key, [data].concat(cache));
    }

    function setObject(key, data) {
        if (!masterCache[key]) {
            masterCache[key] = {};
        }

        _.assign(masterCache[key], data);

        return masterCache[key];
    }

    function setArray(key, array) {
        if (!masterCache[key]) {
            masterCache[key] = [];
        }
        const keyBy = config.keyBy || "id";
        const newItems = _.map(array, item => setObject(item[keyBy], item));
        _.assign(masterCache[key], newItems);
    }

    function remove(key) {
        delete masterCache[key];

        // find all references in arrays and remove them.
        _.forOwn(masterCache, (item, itemKey) => {
            if (!_.isArray(item)) {
                return;
            }
            masterCache[itemKey] = _.reject(item, (object) => {
                return _.isEqual(_.toString(object.id), _.toString(key));
            });
        });
    }

    function setExpiration(expirationTime) {
        cacheExpiration = expirationTime;
    }

    function forceExpire() {
        setExpiration(ALongLongTimeAgo);
    }

    function expirationTime() {
        return cacheExpiration;
    }

    function isExpired() {
        return moment().isAfter(expirationTime());
    }

    function _getDefaultExpiration() {
        const sessionExpiration = config.sessionExpiration;
        if (!sessionExpiration) {
            return moment().add(1, "year");
        }

        if (sessionExpiration === "alwaysExpired") {
            return moment().subtract(1, "year");
        }

        const split = _.split(sessionExpiration, " ");

        return moment().add(Number(split[0]), split[1]);
    }
}
