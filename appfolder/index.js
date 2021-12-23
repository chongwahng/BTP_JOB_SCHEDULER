const request = require('request-promise');
const express = require('express');
const app = express();
const client_oauth = require('client-oauth2');

// Cloud Foundry environment variables containing xsuaa info
const VCAP_SERVICES = JSON.parse(process.env.VCAP_SERVICES);
const XSUAA_URL = VCAP_SERVICES.xsuaa[0].credentials.url;
const XSUAA_CLIENTID = VCAP_SERVICES.xsuaa[0].credentials.clientid;
const XSUAA_CLIENTSECRET = VCAP_SERVICES.xsuaa[0].credentials.clientsecret;
const VCAP_APPLICATION = JSON.parse(process.env.VCAP_APPLICATION);
const APP_URL = VCAP_APPLICATION.application_uris[0];

// OData service, Backend service API
const SERVICE_URL = 'https://e70506aa-ddc0-435c-aab6-7abc40008538.abap.eu10.hana.ondemand.com/sap/opu/odata/sap/ZSB_SO_HDR/header';

// configure the oauth client instance with required params 
const oauthClient = new client_oauth({
    clientId: XSUAA_CLIENTID,
    clientSecret: XSUAA_CLIENTSECRET,
    accessTokenUri: XSUAA_URL + '/oauth/token',
    authorizationUri: XSUAA_URL + '/oauth/authorize',
    redirectUri: 'https://' + APP_URL + '/callback',
    scopes: []
});

// helper method for calling OData service
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
            .then(response => {
                if (response && response.statusCode == 200) {
                    resolve({ responseBody: response.body });
                }
                reject('Error while calling OData service');
            })
            .catch(error => {
                reject(error);
            });


    });
};

// the enpoint to access our app
app.get('/getheader', function (req, res) {
    res.redirect(oauthClient.code.getUri());
});

// the endpoint to which xsuaa will redirect
app.get('/callback', function (req, res) {
    oauthClient.code.getToken(req.originalUrl)
        .then(result => {
            return _doQUERY(SERVICE_URL, result.accessToken);
        })
        .then(result => {
            res.send(result.responseBody);
        })
        .catch(error => {
            res.send('ERROR: ' + error);
        });
});

// the server
const port = process.env.PORT || 3000;  // cloud foundry will set the PORT env after deploy
app.listen(port, function () {
    console.log('=> Server running. Port: ' + port);
});