Example.prototype.MensaID = 'mensa';
Example.prototype.ImbisID = 'imbis';

function getStartOfWeek(d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

function getEndOfWeek(d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() + (day == 0 ? 0 : (7 - day)); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

function getDateByOffsettingToday(offset) {
    let date = new Date();
    date.setDate(date.getDate() + offset);
    return date;
}

Example.prototype.getMensas = function(completionHandler) {
    let availability = {
        start: getStartOfWeek(getDateByOffsettingToday(1)),
        end: getEndOfWeek(getDateByOffsettingToday(8)),
    };

    completionHandler([{
            id: this.MensaID,
            name: 'Mensa',
            icon: 'house',
            location: {
                latitude: 48.8360,
                longitude: 10.0970
            },
            availability: availability,
            additionalInfos: [{
                name: "Opening Hours",
                text: "Monday-Friday:\n08:00-18:00\n\nSaturday:\n09:00-16:00"
            }]
        },
        {
            id: this.ImbisID,
            name: 'Imbisstand',
            icon: 'car',
            location: {
                latitude: 48.8370,
                longitude: 10.0978
            },
            availability: availability,
            additionalInfos: [{
                name: "Opening Hours",
                text: "Monday-Friday:\n12:00-16:00\n\nSaturday:\nClosed"
            }]
        }
    ]);
}

Example.prototype.getMensaFood = function(mensaIds, date, completionHandler) {
    if (mensaIds.length == 0) {
        completionHandler([]);
        return
    }

    let mensaFood = undefined;
    let imbisFood = undefined;

    let closure = function() {
        if (mensaFood === undefined || imbisFood === undefined || completionHandler === undefined) {
            return;
        }
        mensaFood = mensaFood || [];
        imbisFood = imbisFood || [];

        Array.prototype.push.apply(mensaFood, imbisFood);

        completionHandler(mensaFood);
    };

    if (mensaIds.includes(this.mensaID)) {
        mensaFood = [{
            "name": "Kartoffelpüree",
            "subtitle": "mit Kartoffeln aus ökol. Anbau DE-ÖKO-007",
            "group": "Spezialbeilage",
            "imageUrl": "https://www.studentenwerk-giessen.de/assets/components/phpthumbof/cache/r96e1rs8m_img_4023.01022f164679dde7289ab9253736b941.jpg",
            "imageUrlBig": "https://www.maxmanager.de/daten-extern/sw-giessen/html/fotos/big/r96e1rs8m_img_4023.jpg",
            "prices": {
                "student": "0,70"
            },
            "mensa": this.MensaID
        }];
        closure();
    } else {
        mensaFood = [];
    }
    if (mensaIds.includes(this.ImbisID)) {
        imbisFood = [{
            "name": "Beilagenauswahl",
            "subtitle": "feine Erbsen | Blumenkohl polnisch mit Ei und Bröseln | Ofengemüse | Reis | Schupfnudeln | Waldpilzrahmsauce | Kürbis-Limettensauce",
            "group": "Beilagen",
            "imageUrl": "https://www.studentenwerk-giessen.de/assets/components/phpthumbof/cache/9m1ec1c1c_beilagen.01022f164679dde7289ab9253736b941.jpg",
            "imageUrlBig": "https://www.maxmanager.de/daten-extern/sw-giessen/html/fotos/big/9m1ec1c1c_beilagen.jpg",
            "prices": {},
            "mensa": this.ImbisID
        }];
        closure();
    } else {
        imbisFood = [];
    }
}