const oauthClient = require("client-oauth2")
const express = require("express");
const request = require("request-promise");
const env = require("dotenv").config();
const e = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const SERVICE_URL = "https://e70506aa-ddc0-435c-aab6-7abc40008538.abap.eu10.hana.ondemand.com/sap/opu/odata/sap/ZSB_SO_HDR/header";

const VCAP_SERVICES = JSON.parse(process.env.VCAP_SERVICES);
const XSUAA_CLIENTID = VCAP_SERVICES.xsuaa[0].credentials.clientid;
const XSUAA_CLIENTSECRET = VCAP_SERVICES.xsuaa[0].credentials.clientsecret;
const XSUAA_URL = VCAP_SERVICES.xsuaa[0].credentials.url;

const _getAccessToken = () => {
    return new Promise((resolve, reject) => {
        const client = new oauthClient({
            accessTokenUri: XSUAA_URL + '/oauth/token',
            clientId: XSUAA_CLIENTID,
            clientSecret: XSUAA_CLIENTSECRET,
            scopes: []
        });

        client.owner.getToken(process.env.USER_EMAIL, process.env.PASSWORD)
            .catch((error) => {
                reject({ message: 'Error in getting access token', error: error });
            })
            .then((result) => {
                resolve({
                    accessToken: result.accessToken
                });
            })
    });
}

const makeQuery = (serviceUrl, accessToken) => {
    return new Promise((resolve, reject) => {
        const options = {
            url: serviceUrl,
            resolveWithFullResponse: true,
            headers: {
                Authorization: "Bearer " + accessToken,
                Accept: "application/json"
            }

        }

        request(options)
            .then((response) => {
                if (response && response.statusCode == 200) {
                    resolve({
                        responseBody: response.body
                    });
                }
                reject({ message: 'Error while calling RAP Service' });
            })
            .catch((error) => {
                reject({
                    message: 'Failed to receive RAP details',
                    error: error
                })
            })
    });
}
app.get('/header', (req, res) => {

    _getAccessToken()
        .then((result) => {
            return makeQuery(SERVICE_URL, result.accessToken)
        })
        .then((result) => {
            res.send('<p> Result from RAP Service' + JSON.stringify(result.responseBody) + '</p>');
        })
        .catch((error) => {
            res.send('ERROR' + error.message + 'FULL ERROR' + error.error)
        });
})
app.listen(PORT, console.log(`Listening on port ${PORT}`));
