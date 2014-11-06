var httpProxy = require('http-proxy')
  , http = require('http')
  , fs = require('fs')
  , concat = require('./concat')
  , stream = require('./stream')
  , mongo = require('./mongo')
  , request = require('request');

var proxy = httpProxy.createProxyServer();

  mongo.connect(function(db) {

    var server = http.createServer(function(req, res) {

      routes(req, res, db);

    });

    server.listen(process.env.PORT || 4000);

  });



function routes(req, res, db) {

  if (req.url.indexOf('concat') > -1) { // concat playlist. call concat.js

    if (req.headers['range']) {

      stream.byteRangeRequest(req, res);

    } else {

      var id = req.url.split('/')[2];
      request('http://www.stepup.io/playlists/' + id + '.json', function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body) // Print the google web page.
          concat.concat(JSON.parse(body), id, function() {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({"ok": true}));
            res.end();
//            stream.byteRangeRequest(req, res, id)
          });
        }
      });

    }
  } else if (req.url.indexOf('image') > -1) {
    var playlist_id = req.url.split('/')[2];
    var file = req.url.split('/')[3];
    var full_file_name = './tmp/'  + playlist_id + '_' + file

    if (!fs.existsSync(full_file_name)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify({ 'status': 'not found' }));
      res.end();
      return
    }
    var img = fs.readFileSync(full_file_name);
    res.writeHead(200, {'Content-Type': 'image/png' });
    res.end(img, 'binary');
  } else if (req.url.indexOf('stream') > -1) {

    var id = req.url.split('/')[2];
    stream.byteRangeRequest(req, res, id)

  } else if (req.url.indexOf('register_token') > -1) {
    console.log(req.body);
    var data = JSON.parse(req.body);
    db.collection('tokes').findOne({token: data.token}, function(err, res_mongo1) {
      if(res_mongo1) {
        db.collection('tokens').update({token: data.token}, data, function(err, updated_user) {
          console.log('Updated token for '+data.user_id+' ['+data.token+']');
          res.send('token existed, updated user_id');
        })
      } else {
        db.collection('tokens').insert(data, function(err, res_mongo2) {
          if (err) throw err;
          console.log('Added token for '+data.user_id+' ['+data.token+']');
          res.send('added token with user_id');
        });
      }

    });

  } else {

    proxy.web(req, res, {
      target: 'http://www.stepup.io',
      headers: {
        host: 'www.stepup.io'
      }
    });

  }

}
