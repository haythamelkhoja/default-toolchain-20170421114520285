/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// This application uses request to submit your challenge answer to
// our challenge service checker
var request = require('request');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

app.get('/translate', function(req, res) {
  var vcapServices = require('vcap_services');
  var service = vcapServices.getCredentials('language_translator');

  if(service && service.username && service.password) {
    // Configures the Watson Language Tanslation service.
    var LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');

    var language_translator = new LanguageTranslatorV2({
      username: service.username,
      password: service.password
    });

    // Translate message.
    language_translator.translate({
      text: 'Hello IBM Bluemix Coder!', source: 'en', target: 'fr'
    }, function(err, translation) {
      if(err) {
        res.send(err);
      } else {
        // Change only the email address.
        var submission = {
          email: 'code@elkhoja.com',
          data: JSON.stringify(translation),
          app: JSON.stringify({
            services: Object.keys(appEnv.services),
            host: appEnv.app.application_uris,
            space: appEnv.app.space_id,
            started_at: appEnv.app.started_at,
            application_id: appEnv.app.application_id,
            instance_id: appEnv.app.instance_id
          })
        };

        // Uncomment
        request.post('https://code-checker.mybluemix.net/check/challengelanguagetranslation', {form: submission}, function(err, response, body) {
          res.send(body);
        });
      }
    });
  } else {
    res.send('Language Service not bound to application.');
  }
});

// Start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // Print a message when the server starts listening
  console.log('server starting on '+appEnv.url);
});
