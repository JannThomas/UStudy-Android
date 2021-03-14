HSFulda.prototype.MensaURL = "https://www.studentenwerk-giessen.de/xhr/speiseplan-wochentag.html";
HSFulda.prototype.TruckURL = "https://jannthomas.com/hsfulda/foodtruck/";
HSFulda.prototype.TruckEverydayFilename = "everyday.json";
HSFulda.prototype.TruckDailyFilenames = [
    "monday.json",
    "tuesday.json",
    "wednesday.json",
    "thursday.json",
    "friday.json"
]
HSFulda.prototype.MensaInfoURL = "https://www.studentenwerk-giessen.de/essen-trinken/fulda/mensa-hochschule-fulda.html";
HSFulda.prototype.TruckInfoURL = "https://www.studentenwerk-giessen.de/essen-trinken/fulda/5-days-a-week-campus-streetfood.html";
HSFulda.prototype.MensaID = '34';
HSFulda.prototype.TruckID = 'ft';

function getStartOfWeek(d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

function getEndOfWeek(d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() + (day == 0 ? 0 : (7-day)); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

function getDateByOffsettingToday(offset) {
    let date = new Date();
    date.setDate(date.getDate() + offset);
    return date;
}

HSFulda.prototype.getMensas = function (completionHandler) {

    this._getMensaAdditionalInfo(this.MensaInfoURL, (mensaAdditionalInfos) => {
        this._getMensaAdditionalInfo(this.TruckInfoURL, (truckAdditionalInfos) => {

            let availability = {
                start: getStartOfWeek(getDateByOffsettingToday(1)),
                end: getEndOfWeek(getDateByOffsettingToday(8)),
            };

            completionHandler([
                {
                    id: this.MensaID,
                    name: 'Mensa',
                    icon: 'house',
                    location: {
                        latitude: 50.5656,
                        longitude: 9.6869
                    },
                    availability: availability,
                    additionalInfos: mensaAdditionalInfos
                },
                {
                    id: this.TruckID,
                    name: 'Foodtruck',
                    icon: 'car',
                    location: {
                        latitude: 50.5648,
                        longitude: 9.6860
                    },
                    availability: availability,
                    additionalInfos: truckAdditionalInfos
                }
            ]);
        }, completionHandler);
    }, completionHandler);
}

HSFulda.prototype._getMensaAdditionalInfo = function(url, completionHandler, originalCompletionHandler) {
    fetch(url)
    .then((response) => {
        let content = response.content;

        // Extract Website Content
        let $ = cheerio.load(content);
        $('br').replaceWith('\n');

        let openingHourParagraphs = $('.randspalte.my-3 .mt-3 > p').get();

        let additionalInfos = [];
        for (let paragraph of openingHourParagraphs) {
            paragraph = $(paragraph);

            let titleEl = paragraph.find('strong');
            if (titleEl) {
                let info = {
                    name: titleEl.text().trim()
                }

                titleEl.remove();
                let text = paragraph.text().trim().removeSpaceAfterNewline();
                if (text.length > 0) {
                    info["text"] = text;
                }

                additionalInfos.push(info);
            }
        }

        completionHandler(additionalInfos);
    }).catch((error) => {
        console.log('error: ' + error);
        originalCompletionHandler(false);
    });
}

HSFulda.prototype.getMensaFood = function (mensaIds, date, completionHandler) {
    if (mensaIds == null || mensaIds.length == 0) {
        completionHandler([]);
        return
    }

    let mensaFood = undefined;
    let truckFood = undefined;

    let closure = function(){
        if (mensaFood === undefined || truckFood === undefined) {
            return;
        }
        mensaFood = mensaFood || [];
        truckFood = truckFood || [];

        Array.prototype.push.apply(mensaFood, truckFood);

        completionHandler(mensaFood);
    };

    if (mensaIds.includes(this.MensaID)) {
        this._getStandardMensaFood(date, function(ret) {
            mensaFood = ret;
            closure();
        });
    } else {
        mensaFood = [];
    }
    if (mensaIds.includes(this.TruckID)) {
        this._getFoodtruckFood(date, function(ret) {
            truckFood = ret;
            closure();
        });
    } else {
        truckFood = [];
    }
}

HSFulda.prototype._getFoodtruckFood = function (date, completionHandler) {
    let day = date.getDay() - 1;
    if (day < 0 || day > 4) {
        completionHandler([]);
        return;
    }

    let everydayFood;
    let dailyFood;

    let closure = () => {
        if (everydayFood === undefined || dailyFood === undefined) {
            return;
        }
        everydayFood = everydayFood || [];
        dailyFood = dailyFood || [];

        Array.prototype.push.apply(dailyFood, everydayFood);

        for (let item of dailyFood) {
            item['mensa'] = this.TruckID;
        }
        completionHandler(dailyFood);
    };

    this._getFoodtruckFromUrl(this.TruckURL + this.TruckEverydayFilename, function(ret) {
        everydayFood = ret;
        closure();
    });
    this._getFoodtruckFromUrl(this.TruckURL + this.TruckDailyFilenames[day], function(ret) {
        dailyFood = ret;
        closure();
    });
}

HSFulda.prototype._getFoodtruckFromUrl = function (url, completionHandler) {
    fetch(url)
    .then((response) => {
        let content = response.content;
        try {
            let food = JSON.parse(content);

            completionHandler(food);
        }
        catch(err) {
            console.log("error parsing everyday truck food:" + err);
            console.log(content);
            completionHandler(false);
        }
    }).catch((error) => {
        console.log('error: ' + error);
        completionHandler(false);
    });
}

HSFulda.prototype._getStandardMensaFood = function (date, completionHandler) {
    fetch(this.MensaURL, {
        'method': 'POST',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' // Wichtig für korrekte Funktionsweise
        },
        'body': encodeQueryParameters({
            'resources_id': this.MensaID, // ID der Mensa Fulda
            'date': date.toShortISOString()
        })
    }).then((response) => {
        let content = response.content;

        // An Helferfunktion übergeben
        this._extractStandardMensaFood(content, completionHandler);
    }).catch((error) => {
        console.log('error: ' + error);
        completionHandler(false);
    });
}

HSFulda.prototype._extractStandardMensaFood = function (content, completionHandler) {
    // Extract Website Content
    let $ = cheerio.load(content);
    $('br').replaceWith('\n');

    let mealGroups = $('.splGroupWrapper').get();

    let meals = [];

    for (let group of mealGroups) {
        group = $(group);
        let groupName = $(group.find("div div div")[0]).text().trim();

        let mealRows = group.find('.rowMeal').get();
        for (let mealRow of mealRows) {
            let row = $(mealRow);

            // Retrieve name and subtitle
            let textEl = row.find('div.order-sm-1');
            textEl.find('sup').remove();
            let nameEl = textEl.find('span');
            let name = nameEl.text().trim().removeMultiWhitespace();
            nameEl.remove();
            let subtitle = textEl.text().trim().removeMultiWhitespace();

            let imageUrl = row.find('img.splfoto').attr('src');
            if (imageUrl != undefined) {
                imageUrl = resolveFullURL(imageUrl, this.MensaURL);
            }
            let imageUrlBig = row.find('img.hide').attr('src');
            if (imageUrlBig != undefined) {
                imageUrlBig = resolveFullURL(imageUrlBig, this.MensaURL);
            }

            let pricesEl = row.find('div:last-child');
            let priceMatches = getAllRegexMatches('\\d+,\\d{2}', pricesEl.text());
            let prices = {};

            // Patch prices if they are in the description
            if (!priceMatches) {
                let matches = [...subtitle.matchAll(/([\w\s]+).+?([\w\s]+\d+,\d{2})/g)];
                if (matches.length > 0 && matches[0].length == 3) {
                    subtitle = matches[0][1];
                    priceMatches = [matches[0][2].trim()];
                }
            }

            // Add prices
            if (priceMatches && priceMatches.length > 0) {
                prices = {
                    'student': priceMatches[0],
                    'worker': priceMatches[1] || priceMatches[0],
                    'guest': priceMatches[2] || priceMatches[0],
                };
            }

            // TODO: Allergenes
            //let allergenes = row.find('.kennzKommaliste').text().trim().split(",");
            
            meals.push({
                name: name,
                subtitle: subtitle,
                group: groupName,
                imageUrl: imageUrl,
                imageUrlBig, imageUrlBig,
                prices: prices,
                mensa: this.MensaID
            });
        }
    }

    completionHandler(meals);
}