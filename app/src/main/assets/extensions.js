// Include Cheerio
const cheerio = modules.cheerio;

function encodeQueryParameters(parameters) {
    var result = '';

    for (let key in parameters) {
        var value = parameters[key]

        if (result.length > 0) {
            result += '&'
        }

        result += `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }

    return result;
}

function getAllRegexMatches(regexString, target) {
    let regex = new RegExp(regexString, "g");
    return target.match(regex);
}

// Pass any URL to this, relative or not, along with the URL to the document in which the URL was obtained and this method will return an absolute URL.
function resolveFullURL(relativePath, documentURL) {
    if (relativePath.includes('://')) {
        return relativePath;
    } else if (relativePath.startsWith('/')) {
        // Until before first single slash ("https://test.com/toast/index.html" => "https://test.com")
        let relativeDocumentURL = documentURL.match(/\w+:\/\/[^\/]+/);
        return relativeDocumentURL + relativePath;
    } else {
        // Until last slash ("https://test.com/toast/index.html" => "https://test.com/toast/")
        let relativeDocumentURL = documentURL.match(/.+\//);
        return relativeDocumentURL + relativePath;
    }
}

String.prototype.removeSpaceAfterNewline = function() {
    return this.replace(/\n +/g, '\n');
}

String.prototype.removeMultiWhitespace = function() {
    return this.replace(/\s+/g, ' ');
}

String.prototype.replaceAll = function(string, replacement) {
    let source = this;

    while (source.includes(string)) {
        source = source.replace(string, replacement);
    }

    return source;
}

String.prototype.removeAll = function(string) {
    if (Array.isArray(string)) {
        let source = this;

        for (const substring of string) {
            source = source.removeAll(substring);
        }

        return source;
    }

    return this.replaceAll(string, '');
}

String.prototype.removeAllWhitespace = function() {
    return this.replace(/\s/g, '');
}

String.prototype.everyNumberToInt = function() {
    let result = '';

    for (var i = 0; i < this.length; i++) {
        let char = this.charAt(i);

        if ('-0123456789'.includes(char)) {
            result += char;
        }
    }

    return parseInt(result);
}

String.prototype.convertDateFromGermanFormat = function() {
    let components = this.split('.');
    return new Date(components[2], parseInt(components[1]) - 1, components[0]);
}

Date.prototype.toShortISOString = function() {
    return this.toISOString().slice(0, 10);
}