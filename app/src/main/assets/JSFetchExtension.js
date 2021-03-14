
class Headers {
    constructor(map) {
        this.map = map || {};
    }
    
    append(key, value) {
        if (key == undefined) {
            console.log("key: " + key);
        }
        if (value == undefined) {
            console.log("value: " + value);
        }
        if (this.map == undefined) {
            console.log("map: " + this.map);
        }
        
        this.map[key] = value;
    }
    
    delete(key) {
        delete this.map[key];
    }
    
    entries() {
        const result = [];
        for (let key in this.map) {
            result.push([key, this.map[key]]);
        }
        return result;
    }
    
    get(key) {
        return this.map[key];
    }
    
    has(key) {
        return (key in this.map);
    }
    
    keys() {
        const result = [];
        for (let key in this.map) {
            result.push(key);
        }
        return result;
    }
    
    set(name, value) {
        this.map[name] = value;
    }
    
    values(name, value) {
        const result = [];
        for (let key in this.map) {
            result.push(this.map[key]);
        }
        return result;
    }
}


class Response {
    constructor(url, headers, redirected, status, content) {
        this.headers = headers;
        this.ok = status >= 200 && status < 300;
        this.redirected = redirected;
        this.status = status;
        this.url = url;
        this.content = content;
        
        // TODO: Implement Body, statusText?
        this.body = null;
        this.bodyUsed = true;
    }

    clone() {
        return new Response(this.url, this.headers, this.redirected, this.status, this.content);
    }

    json() {
        return Promise.resolve(JSON.parse(this.content));
    }

    text() {
        return Promise.resolve(this.content);
    }

    // TODO: Implement
    arrayBuffer() {
        return Promise.reject(new Error("arrayBuffer not implemented"));
    }

    blob() {
        return Promise.reject(new Error("blob not implemented"));
    }

    formData() {
        return Promise.reject(new Error("formData not implemented"));
    }

    error() {
        return Promise.reject(new Error("Response.error not implemented"));
    }

    redirect() {
        return Promise.reject(new Error("Response.redirect not implemented"));
    }
}
