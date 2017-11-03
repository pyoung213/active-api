import ActiveApi from "../src/ActiveApi";

describe("ActiveApi", () => {
    describe("get", () => {
        it("should get", () => {
            const sut = ActiveApi.create({ url: "endpoint/:id" });
            spyOn(sut, "_fetchIfExpired");
            spyOn(sut, "_constructKey").and.returnValue("key");
            spyOn(sut.SessionCache, "get");

            sut.get({ id: 1 });

            expect(sut._fetchIfExpired).toHaveBeenCalled();
            expect(sut._constructKey).toHaveBeenCalledWith({ id: 1 });
            expect(sut.SessionCache.get).toHaveBeenCalledWith("key");
        });
    });

    describe("getById", () => {
        it("should return if no id supplied", () => {
            const sut = ActiveApi.create({ url: "endpoint/:id" });
            spyOn(sut, "get");

            sut.getById();

            expect(sut.get).not.toHaveBeenCalled();
        });

        it("should call get with object", () => {
            const sut = ActiveApi.create({ url: "endpoint/:id" });
            spyOn(sut, "get");

            sut.getById(1);

            expect(sut.get).toHaveBeenCalledWith({ id: 1 });
        });
    });

    describe("refresh", () => {
        it("should call fetch", () => {
            const sut = ActiveApi.create({ url: "endpoint/:id" });
            spyOn(sut, "_fetch");

            sut.refresh();

            expect(sut._fetch).toHaveBeenCalled();
        });
    });

    describe("create", () => {
        it("should allow to create array of objects if offline", () => {
            const sut = ActiveApi.create({ url: "endpoint/:id", isOffline: true });
            spyOn(sut.SessionCache, "set");
            spyOn(sut.SessionCache, "get");

            sut.create([{ id: 1 }]);

            expect(sut.SessionCache.set).toHaveBeenCalled();
            expect(sut.SessionCache.get).toHaveBeenCalled();
        });

        it("should return created object if it has an id", () => {
            const sut = ActiveApi.create({ url: "endpoint/:id", isOffline: true });

            const result = sut.create({ id: 1 });

            expect(result).toEqual({ id: 1 });
        });

        it("should return a promise if no id", () => {
            const sut = ActiveApi.create({ url: "endpoint/:id", isOffline: false });

            const result = sut.create({ name: 2 });
            expect(result.then).toBeDefined();
        });
    });

    describe("_doCreate", () => {
        it("should create and merge correctly", async () => {
            const sut = ActiveApi.create({ url: "endpoint/:id" });
            spyOn(sut.ApiQueue, "create");
            spyOn(sut, "_transformResponse").and.returnValue({ id: 1 });
            spyOn(sut.SessionCache, "get").and.returnValue({ name: "name" });
            spyOn(sut.SessionCache, "set");

            const result = await sut._doCreate("endpoint", { id: 1 });

            expect(sut.ApiQueue.create).toHaveBeenCalled();
            expect(sut._transformResponse).toHaveBeenCalled();
            expect(sut.SessionCache.get).toHaveBeenCalled();

            expect(result).toEqual({ id: 1, name: "name" });
        });
    });

    describe("update", () => {
        it("should update object", () => {
            const sut = ActiveApi.create({ url: "endpoint/:id" });
            spyOn(sut.ApiQueue, "patch").and.returnValue({ catch: () => 0 });
            spyOn(sut.SessionCache, "setObject");
            spyOn(sut.Alert, "success");

            sut.update(1, { name: "name" });

            expect(sut.ApiQueue.patch).toHaveBeenCalled();
            expect(sut.Alert.success).toHaveBeenCalled();
            expect(sut.SessionCache.setObject).toHaveBeenCalled();
        });
    });

    describe("remove", () => {
        it("should remove from session and make api call", () => {
            const sut = ActiveApi.create({ url: "endpoint/:id" });
            spyOn(sut.ApiQueue, "remove").and.returnValue({ catch: () => 0 });
            spyOn(sut.SessionCache, "remove");
            spyOn(sut.Alert, "success");

            sut.remove(1);

            expect(sut.ApiQueue.remove).toHaveBeenCalled();
            expect(sut.Alert.success).toHaveBeenCalled();
            expect(sut.SessionCache.remove).toHaveBeenCalled();
        });
    });

    // describe("_constructKey", () => {
    //     it("should return key with no id", () => {
    //         const sut = ActiveApi.create({
    //             url: "endpoint/:id"
    //         });
    //
    //         const key = sut._constructKey();
    //         expect(key).toEqual("endpoint");
    //     });
    //
    //     it("should return key with no id and params", () => {
    //         const sut = ActiveApi.create({
    //             url: "endpoint/:id"
    //         });
    //
    //         const key = sut._constructKey({ search: "search" });
    //         expect(key).toEqual("endpoint?search=search");
    //     });
    //
    //     it("should return key that is just an id", () => {
    //         const sut = ActiveApi.create({
    //             url: "endpoint/:id"
    //         });
    //
    //         const key = sut._constructKey({ id: 1 });
    //         expect(key).toEqual(1);
    //     });
    //
    //     it("should return key with id and params", () => {
    //         const sut = ActiveApi.create({
    //             url: "endpoint/:id"
    //         });
    //
    //         const key = sut._constructKey({ id: 1, limit: "limit" });
    //         expect(key).toEqual("endpoint/1?limit=limit");
    //     });
    // });
    //
    // describe("_constructUrl", () => {
    //     it("should construct url with no id", () => {
    //         const sut = ActiveApi.create({
    //             url: "endpoint/:id"
    //         });
    //
    //         const key = sut._constructUrl();
    //         expect(key).toEqual("endpoint");
    //     });
    //
    //     it("should construct url with id", () => {
    //         const sut = ActiveApi.create({
    //             url: "endpoint/:id"
    //         });
    //
    //         const key = sut._constructUrl({ id: 1 });
    //         expect(key).toEqual("endpoint/1");
    //     });
    //
    //     it("should construct url with params", () => {
    //         const sut = ActiveApi.create({
    //             url: "endpoint/:id"
    //         });
    //
    //         const key = sut._constructUrl({ search: "search" });
    //         expect(key).toEqual("endpoint?search=search");
    //     });
    //
    //     it("should construct url with params and id", () => {
    //         const sut = ActiveApi.create({
    //             url: "endpoint/:id"
    //         });
    //
    //         const key = sut._constructUrl({ id: 1, search: "search" });
    //         expect(key).toEqual("endpoint/1?search=search");
    //     });
    // });
});
