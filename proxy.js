var httpProxy = require('http-proxy')
  , http = require('http')
  , concat = require('./concat')
  , stream = require('./stream');
var request = require('request');


var proxy = httpProxy.createProxyServer();

// for /concat/:playlist_id, the proxy should kick in
// 1. given the playlist id fetch the list of steps from step up
// 2. given the array of steps, create the final movie
// 3. when its been concat, respond to client with {ready: true, hash: 3546788}

// for the rest of the request, it should pass them to stepup.io

var server = http.createServer(function(req, res) {

  console.log(req.url);

  if (req.url.indexOf('concat') > -1) {

    // make request to get the playlist information
    if (req.headers['range']) {
      stream.byteRangeRequest(req, res)
    } else {
      // get playlist infor
      var id = req.url.split('/')[2];
      request('http://www.stepup.io/playlists/' + id + '.json', function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body) // Print the google web page.
          concat.concat(JSON.parse(body).steps, function() {
//      res.writeHead(200, { 'Content-Type': 'application/json' });
//      res.write(JSON.stringify({"ok": true}));
//      res.end();
            stream.byteRangeRequest(req, res)
          });
        }
      })


    }




  } else if (req.url.indexOf('stream') > -1) {
    stream.byteRangeRequest(req, res)
  } else {
    proxy.web(req, res, {
      target: 'http://www.stepup.io',
      headers: {
        host: 'www.stepup.io'
      }
    });
  }

});

server.listen(process.env.PORT || 4000);