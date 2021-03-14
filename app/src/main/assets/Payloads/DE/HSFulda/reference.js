// Include Modules
const cheerio = modules.cheerio

function encodeQueryParameters(parameters) {
      var result = "";

      for (let key in parameters) {
            var value = parameters[key]

            if (result.length > 0) {
                  result += "&"
            }

            result += `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      }

      return result;
}

function getAllRegexMatches(regexString, target) {
      let regex = new RegExp(regexString);

      let match = regex.exec(target);

      let matches = [];
      while (match) {
            matches.push(match);

            match = regex.exec(target);
      }

      return matches;
}

function generateUserAccountId(account) {
      let id = account.type + ":";

      id += encodeQueryParameters(account.details);

      return id.toLowerCase();
}

String.prototype.replaceAll = function (string, replacement) {
      let source = this;

      while (source.includes(string)) {
            source = source.replace(string, replacement);
      }

      return source;
}

String.prototype.removeAll = function (string) {
      if (Array.isArray(string)) {
            let source = this;

            for (const substring of string) {
                  source = source.removeAll(substring);
            }

            return source;
      }

      return this.replaceAll(string, "");
}

String.prototype.everyNumberToInt = function () {
      let result = "";

      for (var i = 0; i < this.length; i++) {
            let char = this.charAt(i);

            if ("-0123456789".includes(char)) {
                  result += char;
            }
      }

      return parseInt(result);
}

String.prototype.removeAllWhitespace = function () {
      return this.replace(/\s/g, '');
}

class HSFulda {

      constructor(loginId) {
            // this.link = "https://banking.ing-diba.de";
            this.loginId = loginId;
      }

      // TODO: Cookie Storage?
      login(completionHandler) {
            /*fetch(this.link + "/app/login", {})
                  .then((response) => {
                        let content = response.content;

                        this._loginInputData(content, completionHandler);
                  }).catch((error) => {
                        console.log("error: " + error);
                  });*/
      }

      _loginInputData(content, completionHandler) {
            // Extract Website Content
            let $ = cheerio.load(content);

            // Extract the link
            let link = $("form").attr("action");

            if (link == null) {
                  // TODO: Error
                  return
            }

            // Add url to link
            link = this.link + "/app/" + link;

            retrieveCredentials({
                  "login": this.loginId,
                  "type": "login",
                  "requirements": [
                        {
                              "id": "user",
                              "type": "user",
                              "shouldSave": true
                        },
                        {
                              "id": "password",
                              "type": "password",
                              "isPassword": true,
                              "shouldSave": true
                        }
                  ]
            }, (values) => {
                  // Use the extracted url and post the login data to it
                  fetch(link, {
                        "method": "POST",
                        "headers": {
                              "Content-Type": "application/x-www-form-urlencoded"
                        },
                        "body": encodeQueryParameters({
                              "zugangskennung:zugangskennung": values["user"],
                              "pin:pin": values["password"]
                        })
                  }).then((response) => {
                        let content = response.content;

                        this._loginInputDibaPIN(content, completionHandler)
                  }).catch((error) => {
                        console.log("error: " + error);
                  });
            })
      }

      _loginInputDibaPIN(content, completionHandler) {
            // Extract Website Content
            let $ = cheerio.load(content);

            // Extract the link
            let link = $("form").attr("action");

            // Extract the random token
            let token = $("input[type=hidden]").attr("value");

            if (link == null) {
                  // TODO: Error
                  return
            }
            if (token == null) {
                  // TODO: Error
                  return
            }

            link = link.replace("../../", "");

            // Require ING Key
            retrieveCredentials({
                  "login": this.loginId,
                  "type": "pin",
                  "requirements": [
                        {
                              "id": "dibakey",
                              "name": "DiBa Key",
                              "type": "pin",
                              "numberOfDigits": 6,
                              "shouldSave": true
                        }
                  ]
            }, (values) => {
                  let key = values['dibakey'];

                  fetch(this.link + "/app/" + link, {
                        "method": "POST",
                        "headers": {
                              "Content-Type": "application/x-www-form-urlencoded"
                        },
                        "body": encodeQueryParameters({
                              "key:key:keypadinput:values:0:inputvalue": key.charAt(0),
                              "key:key:keypadinput:values:1:inputvalue": key.charAt(1),
                              "key:key:keypadinput:values:2:inputvalue": key.charAt(2),
                              "key:key:keypadinput:values:3:inputvalue": key.charAt(3),
                              "key:key:keypadinput:values:4:inputvalue": key.charAt(4),
                              "key:key:keypadinput:values:5:inputvalue": key.charAt(5),
                              "token:form:token": token,
                              "weiter_finish": ""
                        })
                  }).then((response) => {
                        let content = response.content;

                        // TODO: Handle Error Responses
                        let success = content.includes("log_out.meta.link_intern");

                        completionHandler(success, content);
                  }).catch((error) => {
                        console.log("error: " + error);
                  })
            })
      }

      fetchData(lastDates, completionHandler) {
            this.login((success, body) => {
                  if (!success) {
                        completionHandler(false);
                  }

                  // Define the variable to store all accounts
                  let accounts = [];

                  // Extract Website Content
                  let $ = cheerio.load(body);

                  // Iterate over all accounts
                  let accountRows = $('.g2p-account__row').get();
                  this._fetchAccounts($, accountRows, lastDates, completionHandler);
            });
      }

      _fetchAccounts($, remainingRows, lastDates, completionHandler, processedRows = []) {
            // Get the row
            let row = $(remainingRows.shift());

            // Extract the link
            let link = row.attr('href');

            // Extract other attributes
            let name = row.find('.g2p-account__headline').text();
            let iban = row.find('.g2p-account__iban').text().removeAll(" ");
            let balance = row.find('.g2p-account__balance').text().everyNumberToInt();

            let accountData = {
                  "name": name,
                  "type": "IBAN",
                  "details": {
                        "iban": iban,
                        "bic": "INGDDEFFXXX"
                  }
            };

            let accountId = generateUserAccountId(accountData);
            let userAccountData = {
                  "id": accountId,
                  "account": accountData,
                  "balance": balance,
                  "currency": "EUR" // TODO: Dynamic?
            };

            // Fetch all data for the account
            this._fetchAccount(link, userAccountData, lastDates[accountId] || 0, (account) => {
                  if (account) {
                        processedRows.push(account);
                  }

                  if (remainingRows.length > 0) {
                        this._fetchAccounts($, remainingRows, lastDates, completionHandler, processedRows);
                  } else {
                        completionHandler(processedRows);
                  }
            })
      }

      _fetchAccount(link, account, lastDate, completionHandler) {
            fetch(this.link + "/app/" + link).then((response) => {
                  let content = response.content;

                  // Extract Website Content
                  let $ = cheerio.load(content);

                  // Iterate over all information
                  let informationRows = $('.g2p-banking-header__row');
                  informationRows.each((index, row) => {
                        // Get the row
                        row = $(row);

                        let rowText = row.text().trim();
                        let amount = row.find('.g2p-amount').text().everyNumberToInt();

                        // Extract the row contents by name
                        if (rowText.startsWith("Dispokreditrahmen")) {
                              account["overdraftFacility"] = amount;
                        } else if (rowText.startsWith("Vorgemerkte Umsätze")) {
                              account["notedSales"] = amount;
                        } else if (rowText.startsWith("Verfügbarer Betrag")) {
                              account["availableAmount"] = amount;
                        }
                  });

                  this._fetchAllTransactions(link, content, lastDate, (transactions) => {
                        if (!transactions) {
                              completionHandler(false);
                              return;
                        }

                        account['transactions'] = transactions;

                        completionHandler(account);
                  });
            }).catch((error) => {
                  console.log("error: " + error);

                  completionHandler(false);
            });
      }

      _extractLink(content, id) {
            let urlExp = new RegExp('"u":".\/(.+?)","c":"' + id + '","e":"click"', "g");
            let urlMatch = urlExp.exec(content);

            if (urlMatch == null || urlMatch[1] == undefined) {
                  return false;
            }

            return urlMatch[1];
      }

      _fetchAllTransactions(url, content, lastDate, completionHandler) {
            // Extract Website Content
            let $ = cheerio.load(content);

            let lastFetchedDate = this._convertDate($(".g2p-transaction-group__title").last().text());
            let shouldStopLoading = (lastFetchedDate < lastDate);

            // Iterate over all information
            let loadMoreRow = $('.g2p-transaction__card__load-more');

            if (loadMoreRow.get().length > 0 && !shouldStopLoading) {
                  // Extract the load more link from javascript
                  let loadMoreId = loadMoreRow.attr("id");
                  let link = this._extractLink(content, loadMoreId);

                  if (!link) {
                        completionHandler(false);
                        return;
                  }

                  fetch(this.link + "/app/" + link).then((response) => {
                        let newContent = response.content;

                        this._fetchAllTransactions(link, newContent, lastDate, completionHandler);
                  }).catch((error) => {
                        console.log("error: " + error);
                  });

                  return;
            }

            // Extract all transaction cards
            let allTransactionCards = $('.g2p-transaction-summary');
            let transactions = [];
            let remaining = allTransactionCards.length;
            allTransactionCards.each((index, card) => {
                  card = $(card);

                  this._loadTransaction(card, content, url, (transaction) => {
                        if (transaction) {
                              transactions.push(transaction);
                        }

                        if (--remaining == 0) {
                              completionHandler(transactions);
                        }
                  });
            });
      }

      _convertDate(date) {
            let components = date.split('.');
            return new Date(components[2], parseInt(components[1]) - 1, components[0]);
      }

      _loadTransaction(card, fullContent, url, completionHandler) {
            let amount = card.find('.g2p-transaction-summary__amount').text().everyNumberToInt();
            let otherPartyName = card.find('.g2p-transaction-summary__recipient').text();
            let transaction = {
                  "amount": amount,
                  "otherParty": {
                        'name': otherPartyName
                  },
                  "date": Date()
            };
            transaction["type"] = card.find('.g2p-transaction-summary__type').text().trim();

            let link = this._extractLink(fullContent, card.attr('id'));

            if (!link) {
                  let $ = cheerio.load(card.next().html());
                  this._extractInformationForCard($, transaction, completionHandler);
                  return;
            }

            fetch(this.link + "/app/" + link, {
                  headers: {
                        "Wicket-Ajax": "true",
                        "Wicket-Ajax-BaseURL": "umsatzanzeige?x="
                  }
            }).then((response) => {
                  let content = response.content;

                  // Extract Website Content
                  let $ = cheerio.load(content);

                  this._extractInformationForCard($, transaction, completionHandler);
            }).catch((error) => {
                  completionHandler(false);
                  console.log("error: " + error);
            });
      }

      _extractInformationForCard($, transaction, completionHandler) {
            let information = {};

            // Iterate over all information
            let transactionDetailItems = $('.g2p-transaction-details__item');
            transactionDetailItems.each((index, item) => {
                  item = $(item);

                  let label = item.find('.g2p-transaction-details__label').text().trim();
                  let value = item.find('.g2p-transaction-details__value').text().trim();

                  switch (label) {
                        case '': break;
                        case 'Bank': break;
                        case 'IBAN': {
                              transaction['otherParty']['type'] = 'IBAN';
                              transaction['otherParty']['details'] = {
                                    "iban": value.removeAllWhitespace()
                              };
                              break;
                        }
                        case 'Verwendungszweck': {
                              if (value == "-") {
                                    break;
                              }
                              transaction['reason'] = value;
                              break;
                        }
                        case 'Buchungstag': {
                              transaction['date'] = this._convertDate(value);
                              break;
                        }
                        case 'Vorauss. Buchungstag': {
                              transaction['date'] = this._convertDate(value);
                              break;
                        }
                        case 'Valuta': {
                              transaction['valueDate'] = this._convertDate(value);
                              break;
                        }
                        default: {
                              information[label] = value;
                        }
                  }
            });

            transaction['additionalInformation'] = information;

            completionHandler(transaction);
      }
}

HSFulda;

