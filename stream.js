var youtubedl = require('youtube-dl')
  , ffmpeg = require('fluent-ffmpeg')
  , Q = require('q');

steps.forEach(function (step, index) {
  youtubedl.getInfo(step.url, ['--format=18', '--prefer-insecure'], function(err, info) {
    if (err) throw err;

    step.mp4_url = info.url

  })
});

Q.all(steps.map(function (step) { return getYTUrl(step) }))
  .then(function(results) {

    Q.all(steps.map(function (step) { return trimMovie(step) }))
      .then(function (results) {

        var command = ffmpeg();
        steps.forEach(function(step, index) {
          command.addInput(index + '.mp4')
        });

        command
          .on('error', function(err) {
            console.log('An error occurred: ' + err.message);
          })
          .on('end', function() {
            console.log('Merging finished !');
          })
          .mergeToFile('final.mp4', 'tmp/');
      })

  });


// private

function trimMovie(step) {
  var deferred = Q.defer();
  ffmpeg(step.mp4_url)
    .inputOptions(['-ss ' + step.start_at])
    .on('end', function() {
      console.log('done');
      deferred.resolve(step);
    })
    .output( steps.indexOf(step) + '.mp4' )
    .outputOptions(['-to ' + (step.end_at - step.start_at)])
    .run();
  return deferred.promise
}

function getYTUrl(step) {
  var deferred = Q.defer();
  youtubedl.getInfo(step.url, ['--format=18', '--prefer-insecure'], function(err, info) {
    if (err) throw err;

    step.mp4_url = info.url;
    deferred.resolve(step);
  });
  return deferred.promise
}