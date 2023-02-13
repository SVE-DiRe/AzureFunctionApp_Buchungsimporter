"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const needle = require('needle');
const httpTrigger = function (context, req) {
    return __awaiter(this, void 0, void 0, function* () {
        // Token Eingabe Parameter
        let token = req.query.token;
        // Projeknummer Eingabe Parameter
        let project = req.query.project != "" && req.query.project != undefined ? req.query.project : "";
        // json Buchung Eingabe Parameter
        let jsonBody = req.body;
        // jsonBody in json Scopevisio Buchungsformat umformen
        // konvertiere Datum zu Unix Timestamp inklusive Millisekunden
        const timestamp = Math.floor(new Date(jsonBody["service_period_to"]).getTime())
            ? Math.floor(new Date(jsonBody["service_period_to"]).getTime())
            : Math.floor(new Date(jsonBody["date"]).getTime());
        const id = jsonBody["identifier"];
        const grossTotal = Math.abs(parseFloat(jsonBody["net_total"]));
        //const tax = parseInt(jsonBody["tax"])
        const reversal = jsonBody["reversal"];
        // ToDo : if reversal --> Konten vertauschen und vatkey in erster statt zweiter Zeile
        let accSoll = "70800";
        let accHaben = "89700";
        //DEBUG
        //let accSoll = "017900"
        //let accHaben = "400000"
        if (reversal == true) { // Konten tauschen und vatkey in erste Zeile schreiben
            accSoll = "89700";
            accHaben = "70800";
            //DEBUG
            //accSoll = "400000"
            //accHaben = "017000"
            //let vatkKey1 = ""
            //let vatkKey2 = ""
            //let vatkKey2 = "U" + tax
        }
        else {
            accSoll = "70800";
            accHaben = "89700";
            //DEBUG
            //accSoll = "017000"
            //accHaben = "400000"
            //let vatkKey1 = ""
            //let vatkKey2 = ""
            //let vatkKey2 = "U" + tax
        }
        // input posting
        const input = {
            "adjustVatKey": false,
            "autoCreateTax": true,
            "rows": [
                {
                    "postingDate": timestamp,
                    "documentDate": timestamp,
                    "documentNumber": id,
                    "externalDocumentNumber": id,
                    "account": accSoll,
                    "amount": grossTotal,
                    "documentText": "Abschlagsrechnung " + id,
                    "rowText": "Abschlagsrechnung " + id,
                    "dimensions": [
                        {
                            "dimensionId": "dimension_3",
                            "dimensionAccountNumber": project
                        }
                    ]
                },
                {
                    "postingDate": timestamp,
                    "documentDate": timestamp,
                    "documentNumber": id,
                    "externalDocumentNumber": id,
                    "account": accHaben,
                    "amount": grossTotal * -1,
                    "rowText": "Abschlagsrechnung " + id,
                    "dimensions": [
                        {
                            "dimensionId": "dimension_3",
                            "dimensionAccountNumber": project
                        }
                    ]
                }
            ]
        };
        // Anfrage an REST API mit needle
        const options = {
            headers: {
                Authorization: `Bearer ${token}`,
                "content-type": 'application/json'
            }
        };
        let url = "https://appload.scopevisio.com/rest/postings/new";
        // Buchung importieren
        const resp = yield needle("post", url, input, options);
        const result = yield resp.body;
        // Antwort ausgeben  
        context.res = {
            body: result
        };
    });
};
exports.default = httpTrigger;
//# sourceMappingURL=index.js.map