import _ from "lodash";

const alertDefault = {
    success: () => 0,
    error: () => 0
};

export default {
    create,
    GET: "GET",
    CREATE: "CREATE",
    REMOVE: "REMOVE",
    UPDATE: "UPDATE"
};

function create(config) {
    const alert = config.alertService || alertDefault;

    return {
        success,
        error
    };

    function success(type) {
        _.each(config.dependents, (dependent) => {
            dependent.SessionCache.forceExpire();
            dependent.Alert.success(config.feed, type);
        });

        return alert.success(config.feed, type);
    }

    function error(type, error) {
        return alert.error(config.feed, type, error);
    }
}
