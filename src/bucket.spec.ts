import { Bucket } from "./bucket";

let sampleBucket = {
    Id: 1,
    Name: "Bucket 1",
    Order: 1,
    Color: 'green',
    data: [{
        Id: 1
    }, {
        Id: 3
    }, {
        Id: 4
    }]
};

let sampleBucket2 = {
    Id: 2,
    Name: "Bucket 2",
    Order: 2,
    Color: 'red',
    data: [{
        Id: 1
    }, {
        Id: 2
    }, {
        Id: 4
    }]
};

describe('Bucket', () => {
    describe('getIntersection', () => {
        it('should return a new bucket that represents intersection of buckets', (done) => {
            let bucket1 = (JSON.parse(JSON.stringify(sampleBucket)));
            let bucket2 = (JSON.parse(JSON.stringify(sampleBucket2)));

            let intersection = Bucket.getIntersection(bucket1, bucket2, (intersection, newBucket1, newBucket2) => {
                expect(intersection).toEqual({
                    Id: null,
                    Name: "Bucket 1 ∩ Bucket 2",
                    Order: null,
                    Color: null,
                    data: [{
                        Id: 1
                    }, {
                        Id: 4
                    }]
                })

                done();
            });
        });

        it('should callback with mutually exclusive buckets', (done) => {
            let bucket1 = JSON.parse(JSON.stringify(sampleBucket));
            let bucket2 = JSON.parse(JSON.stringify(sampleBucket2));

            let intersection = Bucket.getIntersection(bucket1, bucket2, (intersection, newBucket1, newBucket2) => {
                expect(intersection).toEqual({
                    Id: null,
                    Name: "Bucket 1 ∩ Bucket 2",
                    Order: null,
                    Color: null,
                    data: [{
                        Id: 1
                    }, {
                        Id: 4
                    }]
                })

                expect(newBucket1.data).toEqual([{
                    Id: 3
                }])

                expect(newBucket2.data).toEqual([{
                    Id: 2
                }])

                done();
            });
        });
    });
});