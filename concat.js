//var steps = [{"id":"b235e42042ed1025","url":"https://www.youtube.com/watch?v=IoiSWRS7Q-c","image_url":"http://img.youtube.com/vi/IoiSWRS7Q-c/1.jpg","video_url":"/videos/b235e42042ed1025","start_at":36.588391670056346,"end_at":42.588391670056346,"annotation":null,"title":"Daniel Ek: Don't Say Yes to Everything","playlist_order":1},{"id":"18d9745ab89c6284","url":"https://www.youtube.com/watch?v=x7OFDxR6HDI","image_url":"http://img.youtube.com/vi/x7OFDxR6HDI/1.jpg","video_url":"/videos/18d9745ab89c6284","start_at":119.8,"end_at":125.7,"annotation":null,"title":"Daniel Ek: Execution is 95 Percent","playlist_order":2},{"id":"41aac254d9b0afe2","url":"https://www.youtube.com/watch?v=D55XlVKjzPw","image_url":"http://img.youtube.com/vi/D55XlVKjzPw/1.jpg","video_url":"/videos/41aac254d9b0afe2","start_at":27.0,"end_at":33.0,"annotation":null,"title":"Daniel Ek CEO of Spotify | Charlie Rose","playlist_order":3},{"id":"ef3a68bb789b40eb","url":"https://www.youtube.com/watch?v=cZwMeZ3BSlg","image_url":"http://img.youtube.com/vi/cZwMeZ3BSlg/1.jpg","video_url":"/videos/ef3a68bb789b40eb","start_at":11.522883679493365,"end_at":17.52288367949336,"annotation":null,"title":"Spotify CEO Daniel Ek: Don't Be in Music Industry for Money","playlist_order":4},{"id":"c7cc193f37f1ca4c","url":"https://www.youtube.com/watch?v=j2wePlwIK6w","image_url":"http://img.youtube.com/vi/j2wePlwIK6w/1.jpg","video_url":"/videos/c7cc193f37f1ca4c","start_at":2770.0,"end_at":2776.0,"annotation":null,"title":"PandoMonthly: Fireside Chat With Spotify CEO Daniel Ek","playlist_order":5}];

var youtubedl = require('youtube-dl')
  , ffmpeg = require('fluent-ffmpeg')
  , Q = require('q')
  , ytdl = require('ytdl-core');
var steps;



exports.concat = function(json, id, callback) {
  callback();

  steps = json.steps;
//  steps.forEach(function (step, index) {
//    youtubedl.getInfo(step.url, ['--format=18', '--prefer-insecure'], function(err, info) {
//      if (err) throw err;
//
//      step.mp4_url = info.url
//
//    })
//  });

  Q.all(steps.map(function (step) { return getYTUrl(step) }))
    .then(function(results) {

      if (steps.length == 1) {

        ffmpeg(steps[0].mp4_url)
          .inputOptions(['-ss ' + steps[0].start_at])
          .on('error', function(err) {
            console.log('An error occurred: ' + err.message);
          })
          .on('end', function() {
            console.log('Merging finished !')
          })
          .output( 'tmp/' + id + '.mp4' )
          .outputOptions(['-to ' + (steps[0].end_at - steps[0].start_at)])
          .run();

      } else {

        Q.all(steps.slice(0, 5).map(function (step) { return trimMovie(step) }))
          .then(function() {
            Q.all(steps.slice(5, 10).map(function (step) { return trimMovie(step) }))
              .then(function (results) {

                var command = ffmpeg();
                steps.forEach(function(step, index) {
                  command.addInput('tmp/' + index + '.mp4')
                });

                command
                  .on('error', function(err) {
                    console.log('An error occurred: ' + err.message);
                  })
                  .on('end', function() {
                    console.log('Merging finished !');

                  })
                  .mergeToFile('tmp/' + id + '.mp4', 'tmp/');
              })
          });

      }



    });

};




// private

function trimMovie(step) {
  var deferred = Q.defer();
  ffmpeg(step.mp4_url)
    .inputOptions(['-ss ' + step.start_at])
    .on('end', function() {
      console.log('done');
      deferred.resolve(step);
    })
    .output( 'tmp/' + steps.indexOf(step) + '.mp4' )
    .outputOptions(['-to ' + (step.end_at - step.start_at)])
    .run();
  return deferred.promise
}

function getYTUrl(step) {
  var deferred = Q.defer();

  ytdl.getInfo(step.url, { downloadURL: true }, function(err, info) {
    if (err) throw err;

    var video = info.formats.filter(function(obj) { return obj.itag == 18 } )[0];
    step.mp4_url = video.url;

    deferred.resolve(step);
  });

  return deferred.promise
}
