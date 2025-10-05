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

export async function restheartFindOne(
    collection: string,
    filter: object = {},
    keys?: object,
    sort?: object
) {
    const data = await restheartFind(collection, filter, keys, sort, 1, 1); // first page, 1 item

    if (!data || !Array.isArray(data)) {
        throw new Error("Unexpected RESTHeart response format");
    }

    // Return the first document (or null if none)
    return data.length > 0 ? data[0] : null;
}

export async function restheartUpdateOne(
    collection: string,
    filterOrId: string | object,
    update: object,
    options?: { arrayFilters?: object[]; upsert?: boolean }
) {
    const isId = typeof filterOrId === "string";
    let url: string;
    let body: any;

    // Base URL params
    const params = new URLSearchParams();

    // Add filter for non-ID updates
    if (!isId) {
        params.append("filter", JSON.stringify(filterOrId));
    }

    // Support arrayFilters
    if (options?.arrayFilters) {
        params.append("arrayFilters", JSON.stringify(options.arrayFilters));
    }

    // Enable upsert mode
    if (options?.upsert) {
        params.append("wm", "upsert");
    }

    // Construct URL
    url = isId
        ? `${RESTHEART_URL}/${collection}/${filterOrId}?${params.toString()}`
        : `${RESTHEART_URL}/${collection}?${params.toString()}`;

    // If called by ID, wrap body with $set to match Mongo behavior
    body = isId ? { "$set": update } : update;

    const res = await fetch(url, {
        method: "PATCH",
        headers: {
            Authorization: basicAuthHeader(),
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(`RESTHeart updateOne error: ${res.status} ${await res.text()}`);
    }

    return await res.json();
}

export async function restheartDeleteMany(
    collection: string,
    filter: object
) {
    const url = `${RESTHEART_URL}/${collection}?filter=${encodeURIComponent(JSON.stringify(filter))}`;

    const res = await fetch(url, {
        method: "DELETE",
        headers: {
            Authorization: basicAuthHeader(),
            Accept: "application/json",
        },
    });

    if (!res.ok) {
        throw new Error(`RESTHeart deleteMany error: ${res.status} ${await res.text()}`);
    }

    return await res.json();
}


export async function restheartUpdateMany(collection: string, filter: object, update: object) {
    const res = await fetch(`${RESTHEART_URL}/${collection}?filter=${encodeURIComponent(JSON.stringify(filter))}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${btoa(`${RESTHEART_USER}:${RESTHEART_PASS}`)}`
        },
        body: JSON.stringify({
            q: filter,
            u: update,
            multi: true // important flag for updateMany behavior
        })
    });

    if (!res.ok) {
        throw new Error(`restheartUpdateMany failed: ${res.statusText}`);
    }

    const data = await res.json();

    return {
        matchedCount: data.n || 0,
        modifiedCount: data.nModified || 0
    };
}

export async function restheartDeleteOne(
  collection: string,
  filterOrId: string | object
) {
  const isId = typeof filterOrId === "string";
  let url: string;
  let options: RequestInit = {
    method: "DELETE",
    headers: {
      Authorization: basicAuthHeader(),
      Accept: "application/json",
    },
  };

  if (isId) {
    // Case 1: delete by document ID
    url = `${RESTHEART_URL}/${collection}/${filterOrId}`;
  } else {
    // Case 2: delete by filter
    const params = new URLSearchParams();
    params.append("filter", JSON.stringify(filterOrId));
    url = `${RESTHEART_URL}/${collection}?${params.toString()}`;
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    throw new Error(`RESTHeart deleteOne error: ${res.status} ${await res.text()}`);
  }

  const result = await res.json();

  return {
    deletedCount: result?.n ?? 0, // RESTHeart returns { "n": <number> }
  };
}
