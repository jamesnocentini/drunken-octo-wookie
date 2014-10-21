var auth_string = "mongodb://stepup:hfny32oiunxj23@linus.mongohq.com:10074/stepup";
var MongoClient = require('mongodb').MongoClient;
var db;

module.exports = {

  connect: function(callback) {

    return MongoClient.connect(auth_string, function(err, database) {

      console.log('[Mongodb] connected');

      if(database) {
        db = database;
        callback(database);
      }

    })

  },

  db: db

};