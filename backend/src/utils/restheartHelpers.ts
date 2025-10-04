const RESTHEART_URL = "http://192.168.1.2:8080";
const RESTHEART_USER = "admin";
const RESTHEART_PASS = "secret";

function basicAuthHeader() {
    return "Basic " + btoa(`${RESTHEART_USER}:${RESTHEART_PASS}`);
}

export async function restheartFind(
    collection: string,
    filter: object = {},
    keys?: object,
    sort?: object,
    page?: number,
    pagesize?: number
) {
    const params = new URLSearchParams();

    if (Object.keys(filter).length) {
        params.append("filter", JSON.stringify(filter));
    }
    if (keys) {
        params.append("keys", JSON.stringify(keys));
    }
    if (sort) {
        params.append("sort", JSON.stringify(sort));
    }
    if (page) {
        params.append("page", page.toString());
    }
    if (pagesize) {
        params.append("pagesize", pagesize.toString());
    }

    const res = await fetch(`${RESTHEART_URL}/${collection}?${params.toString()}`, {
        headers: {
            Authorization: basicAuthHeader(),
            Accept: "application/json",
        },
    });

    if (!res.ok) {
        throw new Error(`RESTHeart error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return data;
}


export async function restheartInsert(
    collection: string,
    documents: object | object[]
) {
    const res = await fetch(`${RESTHEART_URL}/${collection}?wm=upsert`, {
        method: "POST",
        headers: {
            Authorization: basicAuthHeader(),
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(Array.isArray(documents) ? documents : [documents]),
    });

    if (!res.ok) {
        throw new Error(`RESTHeart insert error: ${res.status} ${await res.text()}`);
    }

    return await res.json();
}

export async function restheartUpdate(
    collection: string,
    filterOrId: object | string,
    update: object
) {
    // Determine whether to update a single document (by ID) or many (by filter)
    const isId = typeof filterOrId === "string";
    const url = isId
        ? `${RESTHEART_URL}/${collection}/${filterOrId}`
        : `${RESTHEART_URL}/${collection}?filter=${encodeURIComponent(JSON.stringify(filterOrId))}`;

    const res = await fetch(url, {
        method: "PATCH",
        headers: {
            Authorization: basicAuthHeader(),
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({ "$set": update }),
    });

    if (!res.ok) {
        throw new Error(`RESTHeart update error: ${res.status} ${await res.text()}`);
    }

    return await res.json();
}
