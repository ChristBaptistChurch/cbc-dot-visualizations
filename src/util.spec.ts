import { FillDVBucketsOrFilters, EntityTypeURLs } from "./util";
import { Bucket } from "./bucket";

describe('FillDVBucketsOrFilters', () => {
    it('should return a promise that resolves when all buckets are fetched', (done) => {
        spyOn(window,'fetch').and.callFake((input: RequestInfo, init: RequestInit) => {
            return new Promise((resolve, reject) => {
                resolve(<any>{
                    json: () => new Promise((resolve, reject) => { resolve([]); })
                });
            });
        });

        let buckets: Bucket[] = [
            {
                Id: 1,
                Name: "Bucket 1",
                Color: "blue",
                Order: 1,
                data: []
            },

            {
                Id: 2,
                Name: "Bucket 2",
                Color: "red",
                Order: 2,
                data: []
            }
        ] 

        FillDVBucketsOrFilters(buckets, 15).then((responses) => {
            expect(responses).toEqual([{
                Id: 1,
                Name: "Bucket 1",
                Color: "blue",
                Order: 1,
                data: []
            },
            {
                Id: 2,
                Name: "Bucket 2",
                Color: "red",
                Order: 2,
                data: []
            }]);
            done();
        });

        expect(window.fetch).toHaveBeenCalledTimes(2);
    });

    it('should call different URLs depending on the entity type', () => {
        spyOn(window,'fetch');

        let buckets: Bucket[] = [
            {
                Id: 1,
                Name: "Bucket 1",
                Color: "blue",
                Order: 1,
                data: []
            },

            {
                Id: 2,
                Name: "Bucket 2",
                Color: "red",
                Order: 2,
                data: []
            }
        ];

        // Person entity type
        FillDVBucketsOrFilters(buckets, 15);
        expect(window.fetch).toHaveBeenCalledWith(EntityTypeURLs[15] + "1?$select=Id&$orderby=Id", { credentials: "include" })

        // Group entity type
        FillDVBucketsOrFilters(buckets, 16);
        expect(window.fetch).toHaveBeenCalledWith(EntityTypeURLs[16] + "2?$select=Id&$orderby=Id", { credentials: "include" })
    });
});