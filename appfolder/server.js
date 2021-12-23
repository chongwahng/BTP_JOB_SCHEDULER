'use strict';

const oauthClient = require('client-oauth2');
const request = require('request-promise');
const express = require('express');
const env = require("dotenv").config();
const app = express();

const SERVICE_URL = 'https://e70506aa-ddc0-435c-aab6-7abc40008538.abap.eu10.hana.ondemand.com/sap/opu/odata/sap/ZSB_SO_HDR/header';

// Cloud xsuaa service: accessed via VCAP prerequisite: bind app to xsuaa service 
const VCAP_SERVICES = JSON.parse(process.env.VCAP_SERVICES);
const XSUAA_URL = VCAP_SERVICES.xsuaa[0].credentials.url;
const XSUAA_CLIENTID = VCAP_SERVICES.xsuaa[0].credentials.clientid;
const XSUAA_CLIENTSECRET = VCAP_SERVICES.xsuaa[0].credentials.clientsecret;

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
                reject({ message: 'Error: failed to get access token', error: error });
                return;
            })
            .then((result) => {
                resolve({

                    accessToken: result.accessToken
                });
            });
    });
}

const _doQUERY = function (serviceUrl, accessToken) {
    return new Promise(function (resolve, reject) {
        const options = {
            url: serviceUrl,
            resolveWithFullResponse: true,
            headers: {
                Authorization: 'Bearer ' + accessToken,
                Accept: 'application/json'
            }
        };

        request(options)
            .then((response) => {
                if (response && response.statusCode == 200) {
                    resolve({ responseBody: response.body });
                }
                reject({ message: 'Error while calling OData service' });
            })
            .catch((error) => {
                reject({ message: 'Error occurred while calling OData service', error: error });
            });
    });
};

// the server
const port = process.env.PORT || 3000;  // cloud foundry will set the PORT env after deploy
app.listen(port, function () {
    console.log('=> Server running. Port: ' + port);
    console.log(port);
})

// server endpoint: on incoming request, call Backend service API and render the result in browser
app.get('/', function (req, res) {

    _getAccessToken()
        .then((result) => {

            return _doQUERY(SERVICE_URL, result.accessToken);
        })
        .then((result) => {

            res.send('<h2>RESULT:</h2>Called OData service QUERY and received response: <p>' + JSON.stringify(result.responseBody) + '</p>');
        })
        .catch((error) => {
            console.log(error.message + ' Reason: ' + error.error);
            res.send('ERROR: ' + error.message + ' - FULL ERROR: ' + error.error);
        });
});