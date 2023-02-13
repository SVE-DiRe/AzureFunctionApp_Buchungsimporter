import { AzureFunction, Context, HttpRequest } from '@azure/functions'
const needle = require('needle')

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    // Token Eingabe Parameter
    let token = req.query.token
    // Projeknummer Eingabe Parameter
    let project = req.query.project != "" && req.query.project != undefined ? req.query.project : ""
    // json Buchung Eingabe Parameter
    let jsonBody = req.body

    // jsonBody in json Scopevisio Buchungsformat umformen
    // konvertiere Datum zu Unix Timestamp inklusive Millisekunden
    const timestamp = 
    Math.floor(new Date(jsonBody["service_period_to"]).getTime())
    ? Math.floor(new Date(jsonBody["service_period_to"]).getTime())
    : Math.floor(new Date(jsonBody["date"]).getTime())
    const id = jsonBody["identifier"]
    const grossTotal = Math.abs(parseFloat(jsonBody["net_total"]))
    //const tax = parseInt(jsonBody["tax"])
    const reversal: boolean = jsonBody["reversal"]

    // ToDo : if reversal --> Konten vertauschen und vatkey in erster statt zweiter Zeile
    let accSoll = "70800"
    let accHaben = "89700"
    
    //DEBUG
    //let accSoll = "017900"
    //let accHaben = "400000"

    if (reversal == true) { // Konten tauschen und vatkey in erste Zeile schreiben

      accSoll = "89700"
      accHaben = "70800"
      
      //DEBUG
      //accSoll = "400000"
      //accHaben = "017000"
      //let vatkKey1 = ""
      //let vatkKey2 = ""
      //let vatkKey2 = "U" + tax
    } else {

      accSoll = "70800"
      accHaben = "89700"

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
            "amount": grossTotal*-1,
            "rowText": "Abschlagsrechnung " + id,
            "dimensions": [
              {
                "dimensionId": "dimension_3",
                "dimensionAccountNumber": project
              }
            ]
          }
        ]
    }


    // Anfrage an REST API mit needle
    const options = {
        headers: {
            Authorization: `Bearer ${token}`,
            "content-type": 'application/json'
        }
    }
    let url = "https://appload.scopevisio.com/rest/postings/new"
    // Buchung importieren
    const resp = await needle("post", url, input, options)
    const result = await resp.body


    // Antwort ausgeben  
    context.res ={
        body:result
    }

}

export default httpTrigger