import moment from "moment";
import ActiveApiSessionCache from "../src/ActiveApiSessionCache";

describe("ActiveApiSessionCache", () => {
    let sut;
    let mockDataArray;
    let mockDataObject;
    let mockConfig;

    beforeEach(() => {
        mockDataArray = [
            {
                id: 1,
                text: "mockText 1",
                config: {
                    players: [
                        {
                            id: 1
                        }
                    ]
                }
            },
            {
                id: 2,
                text: "mockText 2",
                config: {
                    players: [
                        {
                            id: 1
                        },
                        {
                            id: 2
                        }
                    ]
                }
            }
        ];

        mockDataObject = {
            id: 3,
            text: "mockText 3",
            config: {
                players: [
                    {
                        id: 3
                    }
                ]
            }
        };
        mockConfig = {
            feed: "testFeed",
            url: "someUrl/",
            sessionExpiration: "5 minutes"
        };

        sut = ActiveApiSessionCache.create(mockConfig);
    });

    describe("get", () => {
        it("should get an item out of cache", () => {
            sut.set(mockConfig.key, mockDataArray);
            const cachedItem = sut.get(mockConfig.key);
            expect(cachedItem).toEqual(mockDataArray);
        });
    });

    describe("set", () => {
        it("should set an item in cache", () => {
            const key = "mockKey";
            sut.set(key, mockDataArray);
            expect(sut.masterCache[key]).toEqual(mockDataArray);
        });

        it("should set array and create id reference", () => {
            sut.set(mockConfig.key, mockDataArray);

            expect(sut.get(mockDataArray[0].id)).toEqual(mockDataArray[0]);
        });

        it("should set object", () => {
            sut.set(mockDataObject.id, mockDataObject);
            expect(sut.get(mockDataObject.id)).toEqual(mockDataObject);
        });

        it("should return false for expired cache", () => {
            sut.set(mockConfig.key, mockDataArray);
            expect(sut.isExpired()).toBe(false);
        });

        it("should merge new data when setting", () => {
            sut.set(mockConfig.key, mockDataArray);
            const newData = [{
                id: 1,
                text: "new",
                config: {
                    players: [
                        {
                            id: 1
                        }
                    ]
                }
            }];
            const mergedData = [
                {
                    id: 1,
                    text: "new",
                    config: {
                        players: [
                            {
                                id: 1
                            }
                        ]
                    }
                },
                {
                    id: 2,
                    text: "mockText 2",
                    config: {
                        players: [
                            {
                                id: 1
                            },
                            {
                                id: 2
                            }
                        ]
                    }
                }
            ];
            sut.set(mockConfig.key, newData);
            expect(sut.get(mockConfig.key)).toEqual(mergedData);
        });

        it("should add time to expiration when setting new content", () => {
            const beforeTime = sut.expirationTime();
            sut.set(mockConfig.key, mockDataArray);
            const afterTime = sut.expirationTime();

            expect(beforeTime).not.toEqual(afterTime);
        });
    });

    describe("isExpired", () => {
        it("should return true for expired cache", () => {
            const config = {
                feed: "testFeed",
                url: "someUrl/",
                key: "someKey",
                sessionExpiration: "alwaysExpired"

            };

            const CreatedApiCache = ActiveApiSessionCache.create(config);
            CreatedApiCache.set(mockConfig.key, mockDataArray);
            expect(CreatedApiCache.isExpired()).toBe(true);
        });
    });

    describe("remove", () => {
        it("should find and remove a cache item from list", () => {
            const key1 = "someKey1";
            const key2 = "someKey2";
            sut.set(key1, mockDataArray);
            sut.set(key2, mockDataArray);

            const removeId = mockDataArray[0].id;

            sut.remove(removeId);
            expect(sut.masterCache[removeId]).toBeUndefined();
            expect(sut.masterCache[key1][0].id).not.toEqual(removeId);
            expect(sut.masterCache[key2][0].id).not.toEqual(removeId);
        });
    });

    describe("force expire", () => {
        it("should force expire cache", () => {
            sut.setExpiration(moment().add(5, "minutes"));

            expect(sut.isExpired()).toEqual(false);

            sut.forceExpire();

            expect(sut.isExpired()).toEqual(true);
        });
    });

    describe("_getDefaultExpiration", () => {
        it("should return moment value if expiration is undefined", () => {
            const config = {
                feed: "testFeed",
                url: "someUrl/"
            };

            const CreatedApiCache = ActiveApiSessionCache.create(config);
            const expirationTime = CreatedApiCache._getDefaultExpiration();

            expect(expirationTime.isValid()).toEqual(true);
        });

        it("should return moment value if expiration is always expired", () => {
            const config = {
                feed: "testFeed",
                url: "someUrl/",
                sessionExpiration: "alwaysExpired"
            };

            const CreatedApiCache = ActiveApiSessionCache.create(config);
            const expirationTime = CreatedApiCache._getDefaultExpiration();

            expect(expirationTime.isValid()).toEqual(true);
        });

        it("should return moment value if expiration is defined", () => {
            const config = {
                feed: "testFeed",
                url: "someUrl/",
                sessionExpiration: "2 days"
            };

            const CreatedApiCache = ActiveApiSessionCache.create(config);
            const expirationTime = CreatedApiCache._getDefaultExpiration();

            expect(expirationTime.isValid()).toEqual(true);
        });
    });

    describe("unshift", () => {
        it("should unshift object onto array", () => {
            sut.set("key", [{
                id: 1
            }, {
                id: 2
            }]);

            sut.unshift("key", {
                id: 5
            });

            expect(sut.masterCache.key).toEqual([{
                id: 5
            }, {
                id: 1
            }, {
                id: 2
            }]);
        });
    });

    describe("push", () => {
        it("should push object onto array", () => {
            sut.set("key", [{
                id: 1
            }, {
                id: 2
            }]);

            sut.push("key", {
                id: 5
            });

            expect(sut.masterCache.key).toEqual([{
                id: 1
            }, {
                id: 2
            }, {
                id: 5
            }]);
        });
    });
});
