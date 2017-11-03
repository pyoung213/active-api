import _ from "lodash";
import ActiveApi from "../src/ActiveApi";
import Api from "../TestUtils/MockApi";
import Alert from "../TestUtils/MockAlert";
import TestUtilities from "../TestUtils/TestUtilities";

const mockUrl = "fooBarUrl";
const mockConfig = {
    feed: "testFeed",
    url: `${mockUrl}/:id`,
    sessionExpiration: "5 minutes",
    api: Api,
    alertService: Alert
};

describe("Integration", () => {
    let sut;
    let mockDataArray;

    beforeEach(() => {
        sut = ActiveApi.create(mockConfig);

        mockDataArray = [
            {
                id: 1,
                text: "mockText 1"
            },
            {
                id: 2,
                text: "mockText 2"
            }
        ];
    });

    describe("Get", () => {
        it("should get all and make an http request", async () => {
            spyOn(Api, "get").and.returnValue(Promise.resolve({}));
            spyOn(Alert, "success");

            sut.get();

            await TestUtilities.letAsyncHappen();

            expect(Api.get).toHaveBeenCalledWith(mockUrl);
            expect(Alert.success).toHaveBeenCalledWith(mockConfig.feed, "GET");
        });

        it("should get one", async () => {
            spyOn(Api, "get").and.returnValue(Promise.resolve({}));

            const config = {
                feed: "testFeed",
                url: "someUrl/:id",
                sessionExpiration: "5 mintues",
                api: Api
            };

            const NewApiCache = ActiveApi.create(config);

            NewApiCache.get({ id: 1 });
            await TestUtilities.letAsyncHappen();

            expect(Api.get).toHaveBeenCalledWith("someUrl/1");
        });

        // it("should get fill in all keys", async () => {
        //     spyOn(Api, "get").and.returnValue(Promise.resolve({}));
        //
        //     const config = {
        //         feed: "testFeed",
        //         url: "someUrl/:sport/:id",
        //         sessionExpiration: "5 mintues",
        //         api: Api
        //     };
        //
        //     const NewApiCache = ActiveApi.create(config);
        //
        //     NewApiCache.get({ id: 1, sport: "nfl" });
        //     await TestUtilities.letAsyncHappen();
        //
        //     expect(Api.get).toHaveBeenCalledWith("someUrl/nfl/1");
        // });

        it("should force a get all when cache is expired", async () => {
            spyOn(Api, "get").and.returnValue(Promise.resolve([{
                id: 1
            }]));

            const config = {
                feed: "testFeed",
                url: "someUrl/:id",
                sessionExpiration: "5 minutes",
                api: Api
            };

            const NewApiCache = ActiveApi.create(config);

            NewApiCache.get({ id: 1 });
            await TestUtilities.letAsyncHappen();

            expect(Api.get).toHaveBeenCalledWith("someUrl/1");

            NewApiCache.get({ id: 1 });
            await TestUtilities.letAsyncHappen();

            expect(Api.get.calls.count()).toEqual(1);
        });

        it("should force a get all when cache is expired", async () => {
            spyOn(Api, "get").and.returnValue(Promise.resolve([{
                id: 1
            }]));

            const config = {
                feed: "testFeed",
                url: "someUrl/:id",
                sessionExpiration: "5 minutes",
                api: Api
            };

            const NewApiCache = ActiveApi.create(config);

            NewApiCache.get({ id: 1 });
            await TestUtilities.letAsyncHappen();

            expect(Api.get).toHaveBeenCalledWith("someUrl/1");

            NewApiCache.get({ id: 1 });
            await TestUtilities.letAsyncHappen();

            expect(Api.get.calls.count()).toEqual(1);
        });

        it("should get from cache", async () => {
            spyOn(Api, "get").and.returnValue(Promise.resolve({}));
            spyOn(Alert, "success");

            sut.get();
            await TestUtilities.letAsyncHappen();

            sut.get();
            await TestUtilities.letAsyncHappen();

            expect(Api.get.calls.count()).toEqual(1);
            expect(Alert.success).toHaveBeenCalled();
        });

        it("should get a specific id from cache", async () => {
            spyOn(Api, "get").and.returnValue(Promise.resolve(mockDataArray));
            spyOn(Alert, "success");

            sut.get();
            await TestUtilities.letAsyncHappen();

            sut.get({
                id: 1
            });
            await TestUtilities.letAsyncHappen();

            expect(Api.get.calls.count()).toEqual(1);
            expect(Alert.success).toHaveBeenCalled();
        });

        it("should make http request if cache is expired", async () => {
            spyOn(Api, "get").and.returnValue(Promise.resolve({}));

            const config = {
                feed: "testFeed",
                url: "someUrl/:id",
                api: Api,
                sessionExpiration: "alwaysExpired"
            };

            const NewApiCache = ActiveApi.create(config);

            NewApiCache.get();
            await TestUtilities.letAsyncHappen();

            NewApiCache.get();
            await TestUtilities.letAsyncHappen();

            expect(Api.get.calls.count()).toEqual(2);
        });

        it("should force get", async () => {
            spyOn(Api, "get").and.returnValue(Promise.resolve({}));
            spyOn(Alert, "success");
            const options = {
                forceRefresh: true
            };
            sut.get({}, options);
            await TestUtilities.letAsyncHappen();

            sut.get({}, options);
            await TestUtilities.letAsyncHappen();

            expect(Api.get.calls.count()).toEqual(2);
            expect(Alert.success).toHaveBeenCalled();
        });

        it("should still force get on expired cache", async () => {
            spyOn(Api, "get").and.returnValue(Promise.resolve({}));

            const config = {
                feed: "testFeed",
                url: "someUrl/:id",
                api: Api,
                sessionExpiration: "alwaysExpired"
            };

            const NewApiCache = ActiveApi.create(config);
            const options = {
                forceRefresh: true
            };
            NewApiCache.get({}, options);
            await TestUtilities.letAsyncHappen();

            expect(Api.get.calls.count()).toEqual(1);
        });

        it("should cook data", async () => {
            spyOn(Api, "get").and.returnValue(Promise.resolve(mockDataArray));

            const config = {
                feed: "testFeed",
                url: "rosters/:id",
                api: Api,
                transformResponse: (data) => {
                    return _.map(data, (item) => {
                        const newItem = {
                            ...item,
                            cook: item.id + 10
                        };

                        return newItem;
                    });
                }
            };

            const NewApiCache = ActiveApi.create(config);

            NewApiCache.get();
            await TestUtilities.letAsyncHappen();

            const mockedObject = mockDataArray[0];
            const cookedData = {
                ...mockedObject,
                cook: mockedObject.id + 10
            };

            expect(NewApiCache.getById(1)).toEqual(cookedData);
        });
    });
});
