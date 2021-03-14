HSFulda.prototype._horstlLogin = function(completionHandler) {
    let url = 'https://horstl.hs-fulda.de:443/qisserver/rds?state=user&type=1&category=auth.login';

    retrieveCredentials({
        'account': this.accountId,
        'type': 'Horstl Login',
        'requirements': [{
                'id': 'user',
                'type': 'User',
                'shouldSave': true
            },
            {
                'id': 'password',
                'type': 'Password',
                'isPassword': true,
                'shouldSave': true
            }
        ]
    }, (values) => {
        // Post the login data to the URL
        fetch(url, {
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            'body': encodeQueryParameters({
                'asdf': values['user'],
                'fdsa': values['password']
            })
        }).then((response) => {
            let content = response.content;

            // Extract Website Content
            let $ = cheerio.load(content);

            // Check whether the user information panel is available.
            let userPanel = $("[id='collapsibleHeaderActionFrom:userInformationCenter']");
            if (userPanel.length > 0) {
                // Extract information from the panel.
                let fullName = userPanel.find('h2.infoboxTitle').text().trim();
                let username = $(userPanel.find('.field-content-wrapper')[0]).text().trim();
                let nameText = `${fullName} (${username})`;
                setAccountName(nameText);
                completionHandler(true);
            } else {
                // Login failed, so the credentials should be deleted.
                setCredentials({
                    'account': this.accountId,
                    'credentials': {
                        'user': null,
                        'password': null
                    }
                })
                this._horstlLogin(completionHandler);
            }
        }).catch((error) => {
            console.log('error: ' + error);
            completionHandler(false);
        });
    })
}

HSFulda.prototype._retrieveCheerio = function(url, completionHandler, originalCompletionHandler = null) {
    fetch(url).then((response) => {
        let content = response.content;

        // Extract Website Content
        completionHandler(cheerio.load(content));
    }).catch((error) => {
        console.log('error: ' + error);
        if (originalCompletionHandler != null) {
            originalCompletionHandler(false);
        } else {
            completionHandler(false);
        }
    });
}

HSFulda.prototype.getGrades = function(completionHandler) {
    this._horstlLogin((success) => {
        if (!success) {
            completionHandler(false);
            return;
        }

        // Fetch the functions website.
        let url = 'https://horstl.hs-fulda.de/qisserver/pages/cs/sys/portal/hisinoneIframePage.faces?id=qispos_student&navigationPosition=qispos_student&recordRequest=true';
        this._retrieveCheerio(url, ($) => {

            // Fetch the inner iframe.
            let url = $('#frameWrapper_iframe_qispos_student').attr('data-src');
            this._retrieveCheerio(url, ($) => {

                // Fetch the grade studies overview.
                let url;
                for (let link of $('a.auflistung').get()) {
                    link = $(link);
                    if (link.text().trim() == 'Notenspiegel') {
                        url = link.attr('href');
                    }
                }
                this._retrieveCheerio(url, ($) => {
                    let studiengangsNames = [];
                    let urlsPerStudiengang = {};

                    let studiengaenge = $('.treelist a[href]').get();
                    for (let gang of studiengaenge) {
                        gang = $(gang);

                        let url = gang.attr('href');
                        let title = gang.find('img').attr('alt').replace('Leistungen für Abschluss', '').replace('anzeigen', '').trim();
                        urlsPerStudiengang[title] = url;
                        studiengangsNames.push(title)
                    }

                    if (studiengangsNames.length == 0) {
                        completionHandler("Kein Studiengang gefunden.");
                    } else if (studiengangsNames.length == 1) {
                        this._getGradesForSpecificStudiengangUrl(urlsPerStudiengang[studiengangsNames[0]], completionHandler);
                    } else { // Make the user choose between the studiengaenge.
                        let showAllGradesText = "Alle Noten anzeigen";
                        let options = [showAllGradesText].concat(studiengangsNames);

                        retrieveCredentials({
                            'account': this.accountId,
                            'type': 'Studiengang',
                            'requirements': [{
                                'id': 'horstl_studiengang',
                                'type': 'Studiengang',
                                'shouldSave': true,
                                'options': options
                            }]
                        }, (values) => {
                            let studiengang = values['horstl_studiengang'];

                            if (studiengang == showAllGradesText) {
                                let stillToFetch = studiengangsNames.length;
                                let grades = [];

                                let handler = (returnedGrades) => {
                                    if (!Array.isArray(returnedGrades)) {
                                        stillToFetch = -1;
                                        completionHandler("Fehler beim Laden der Noten.");
                                        return;
                                    }

                                    Array.prototype.push.apply(grades, returnedGrades);
                                    stillToFetch -= 1;

                                    if (stillToFetch == 0) {
                                        completionHandler(grades);
                                    }
                                }

                                for (let studiengangsName of studiengangsNames) {
                                    this._getGradesForSpecificStudiengangUrl(urlsPerStudiengang[studiengangsName], handler);
                                }
                            } else {
                                this._getGradesForSpecificStudiengangUrl(urlsPerStudiengang[studiengang], completionHandler);
                            }
                        });
                    }
                }, completionHandler);
            }, completionHandler);
        }, completionHandler);
    })
}

HSFulda.prototype._getGradesForSpecificStudiengangUrl = function(url, completionHandler) {
    // Fetch the grade overview matrix.
    this._retrieveCheerio(url, ($) => {

        let grades = [];

        let tableRows = $('table:last-of-type tr').get();
        let nextLoadBlocks = [];
        let gradeLoadingCompletion = () => {
            if (nextLoadBlocks.length == 0) {
                completionHandler(grades);
            } else {
                let block = nextLoadBlocks.pop();
                block();
            }
        };

        let groupCredits = 0;
        let group = null;
        for (let row of tableRows) {
            row = $(row);

            let columns = row.find('td');

            if (columns.length > 4) {
                let credits = parseInt($(columns[4]).text().trim());
                if (!$(columns[0]).attr('class').includes('tabelle1')) {
                    if (group != null) {
                        grades.push(group);
                    }

                    groupCredits = credits;
                    group = null;
                    continue;
                }

                let gradeColumn = $(columns[2]);
                let grade = {
                    id: $(columns[0]).text().trim(),
                    name: $(columns[1]).text().trim(),
                    status: $(columns[3]).text().trim() == 'bestanden' ? 'passed' : 'failed',
                    grade: gradeColumn.text().trim(),
                    credits: (credits > 0) ? credits : groupCredits,
                    date: $(columns[6]).text().trim().convertDateFromGermanFormat(),
                    numberOfTry: parseInt($(columns[5]).text().trim()),
                    overviewOfGrades: [],
                    averageGrade: ""
                };

                let links = gradeColumn.find('a');
                if (links.length > 0) {
                    group = null;

                    let link = $(links[0]).attr('href');

                    nextLoadBlocks.push(
                        () => {
                            this._retrieveCheerio(link, ($) => {
                                let tableRows = $('table[align=left] tr').get();
                                
                                let overviewOfGrades = [];
                                let averageGrade = "";
                                for (let row of tableRows) {
                                    row = $(row);
        
                                    let columns = row.find('td');
                                    if (columns.length != 2) {
                                        continue;
                                    }
        
                                    let firstColumn = $(columns[0]);
                                    if (firstColumn.attr('class').includes('tabelle1')) {
                                        overviewOfGrades.push(
                                            {
                                                grade: firstColumn.text().trim().removeMultiWhitespace(),
                                                quantity: parseInt($(columns[1]).text().trim())
                                            }
                                        )
                                    } else {
                                        averageGrade = $(columns[1]).text().trim();
                                    }
                                } 
        
                                grade['overviewOfGrades'] = overviewOfGrades;
                                grade['averageGrade'] = averageGrade;
                                grades.push(grade);
        
                                gradeLoadingCompletion();
                            });
                        }
                    )
                } else {
                    if (credits == 0 && groupCredits > 0) {
                        group = grade;
                    }
                }
            }
        }

        gradeLoadingCompletion();
    }, completionHandler);
}
