import ActiveApiUtils from "../src/ActiveApiUtils";

describe("ActiveApiUtils", () => {
    describe("removeParamsFromUrl", () => {
        it("should remove id from url", () => {
            const url = "comments/:id";
            const newUrl = ActiveApiUtils.removeParamsFromUrl(url);
            expect(newUrl).toEqual("comments");
        });

        it("should return url", () => {
            const url = "comments";
            const newUrl = ActiveApiUtils.removeParamsFromUrl(url);
            expect(newUrl).toEqual("comments");
        });

        it("should remove all keys from url", () => {
            const url = "comments/:id/:something";
            const newUrl = ActiveApiUtils.removeParamsFromUrl(url);
            expect(newUrl).toEqual("comments");
        });

        it("should remove all keys from url", () => {
            const url = "comments/:id/else/:something";
            const newUrl = ActiveApiUtils.removeParamsFromUrl(url);
            expect(newUrl).toEqual("comments/else");
        });
    });

    describe("replaceUrlParamsWith", () => {
        it("should replace url id with provided id", () => {
            const url = "comments/:id";
            const newUrl = ActiveApiUtils.replaceUrlParamsWith(url, { id: 1234 });

            expect(newUrl).toEqual("comments/1234");
        });

        it("should replace url param and remove others", () => {
            const url = "comments/:id/:param/";
            const newUrl = ActiveApiUtils.replaceUrlParamsWith(url, { param: 1234 });

            expect(newUrl).toEqual("comments/1234");
        });

        it("should replace url all params", () => {
            const url = "comments/:id/:param/";
            const newUrl = ActiveApiUtils.replaceUrlParamsWith(url, { id: 1, param: 1234 });

            expect(newUrl).toEqual("comments/1/1234");
        });
    });

    describe("removeParamsThatMatchUrl", () => {
        it("should return omited params", () => {
            const url = "comments/:id/:param/";
            const newParams = ActiveApiUtils.removeParamsThatMatchUrl(url, { id: 1, param: 1234 });

            expect(newParams).toEqual({});
        });

        it("should return omited params", () => {
            const url = "comments/:id";
            const newParams = ActiveApiUtils.removeParamsThatMatchUrl(url, { id: 1, param: 1234 });

            expect(newParams).toEqual({ param: 1234 });
        });
    });

    describe("isParamInUrl", () => {
        it("should be in url", () => {
            const result = ActiveApiUtils.isParamInUrl("url/:id", "id");

            expect(result).toBeTruthy();
        });

        it("should not be in url", () => {
            const result = ActiveApiUtils.isParamInUrl("url/:id2", "id");

            expect(result).toBeFalsy();
        });

        it("should not be in url", () => {
            const result = ActiveApiUtils.isParamInUrl("url/id", "id");

            expect(result).toBeFalsy();
        });
    });

    describe("serializeParams", () => {
        it("should serialize params", () => {
            const params = {
                search: "search",
                filter: "filter"
            };
            const serializeParams = ActiveApiUtils.serializeParams(params);
            expect(serializeParams).toEqual("filter=filter&search=search");
        });
    });
});
