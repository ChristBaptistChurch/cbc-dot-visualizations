import { Bucket } from "./bucket";
import { Filter } from "./filter";

export function parseColor(input) {
    var div = document.createElement('div'), m;
    div.style.color = input;
    m = div.style.color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (m) return [m[1], m[2], m[3]];
    else return null;
}

export const EntityTypeURLs = {
    15: '/api/People/DataView/', // People
    16: '/api/Groups/DataView/', // Group
    113: '/api/Workflows/DataView/', // Workflows
    240: '/api/ConnectionRequests/DataView/', // ConnectionRequests
    258: '/api/Registrations/DataView/', // Registrations
    313: '/api/RegistrationRegistrants/DataView/' // Registration Registrants
}

export function FillDVBucketsOrFilters(bucketOrFilters: Bucket[] | Filter[], entityTypeId): Promise<Array<Bucket | Filter>> {
    let promises = [];

    for (let item of bucketOrFilters) {
        promises.push(new Promise((resolve, reject) => {
            fetch(EntityTypeURLs[entityTypeId] + item.Id + "?$select=Id&$orderby=Id", { credentials: "include" }).then((response) => {
                response.json().then((json) => {
                    item.data = json;
                    resolve(item);
                })
            })
        }));
    }

    return Promise.all(promises);
}