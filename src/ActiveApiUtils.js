import _ from "lodash";

const replaceAllParams = /(?::[a-z]\w*\/?)\s*/gi;

export default {
    removeParamsFromUrl,
    replaceUrlParamsWith,
    removeParamsThatMatchUrl,
    isParamInUrl,
    serializeParams
};

function removeParamsFromUrl(url = "") {
    const cleanedUrl = url.replace(replaceAllParams, "");

    return _.trimEnd(cleanedUrl, "/");
}

function replaceUrlParamsWith(url, params) {
    let newUrl = url;
    _.each(params, (value, key) => {
        newUrl = newUrl.replace(`:${key}`, value);
    });

    return this.removeParamsFromUrl(newUrl);
}

function removeParamsThatMatchUrl(url, params) {
    return _.omitBy(params, (_value, key) => {
        return this.isParamInUrl(url, key);
    });
}

function isParamInUrl(url, param) {
    const escapedParam = _.escapeRegExp(param);
    const pattern = new RegExp(`/:${escapedParam}(/|(\\s*$))`);

    return pattern.test(url);
}

function serializeParams(params) {
    return _(params)
        .keys()
        .sortBy()
        .map((key) => {
            return `${key}=${params[key]}`;
        })
        .value()
        .join("&");
}
