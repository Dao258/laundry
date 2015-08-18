'use strict';

var ytdl = require('youtube-dl'); // https://github.com/fent/node-youtube-dl
var http = require('follow-redirects').http; // https://www.npmjs.com/package/follow-redirects
var https = require('follow-redirects').https; // https://www.npmjs.com/package/follow-redirects

ns('Storage', global);
Storage.Local = function() {};

Storage.Local.readFileString = function(target, callback) {
    target = path.join(commander.local, target);
    fs.readFile(target, {
        encoding: 'utf8'
    }, callback);
};

Storage.Local.writeFile = function(target, contents, callback) {
    target = path.join(commander.local, target);
    var dir = path.parse(target).dir;
    fs.mkdirp(dir, function(err) {
        if (err) {
            callback(err);
            return;
        }
        fs.writeFile(target, contents, function(err) {
            callback(err, target);
        });
    });
};

// Given a URL and an S3 target, copy the URL to S3.
// Cache is an array of keys to not upload, since they are there already.
// Optionally use youtube-dl to transform the url to a media url.
// The callback is (err, {oldUrl, newUrl, error, ytdl})
// The ytdl info will be passed only if ytdl was used, and if the target wasn't already cached.
Storage.Local.downloadUrl = function(url, target, cache, useYTDL, callback) {
    var result = {
        oldUrl: url,
        newUrl: url,
        ytdl: null
    };

    if (!url) {
        callback(null, result);
        return;
    }

    var resultUrl = commander.baseUrl + target;
    target = path.join(commander.local, target);

    // See if the file has previously been uploaded
    if (cache && cache.length) {
        if (cache.indexOf(target) !== -1) {
            log.debug('Found ' + target);
            result.newUrl = resultUrl;

            // Don't call the callback synchronously, interesting: https://github.com/caolan/async/issues/75
            process.nextTick(function() {
                callback(null, result);
            });
            return;
        }
    }

    if (useYTDL) {
        // Use the youtube-dl to change the url into a media url
        log.debug('Getting media URL for ' + url);
        ytdl.getInfo(url, function(err, info) {
            if (!err && info.url) {
                url = result.oldUrl = info.url;
                result.ytdl = info;
                doDownload();
            } else {
                callback(err, result);
            }
        });
    } else {
        doDownload();
    }

    function doDownload() {
        var params = {
            Bucket: commander.s3bucket,
            Key: target
        };

        log.debug('Downloading ' + params.Key);
        var protocol = require('url').parse(url).protocol;
        var req = protocol === 'http' ? http.request : https.request;
        req(url, function(response) {
            if (response.statusCode !== 200 && response.statusCode !== 302) {
                callback(response.error, result);
                return;
            }

            fs.mkdirp(path.parse(target).dir, function(err) {
                if (err) {
                    callback(err);
                    return;
                }

                response.pipe(fs.createWriteStream(target));
                result.newUrl = resultUrl;
                callback(err, result);
            });


        }).end();
    }
};

// Given a directory, return all the files.
Storage.Local.cacheFiles = function(dir, callback) {
    var p = path.join(commander.local, dir);
    fs.exists(p, function(exists) {
        if (exists) {
            fs.readdir(p, function(err, files) {
                files = files.map(function(file) {
                    return p + '/' + file;
                });
                callback(err, files);
            });
        } else {
            callback(null, []);
        }
    });
};

// Delete files with a last-modified before a given date.
Storage.Local.deleteBefore = function(dir, date, callback) {
    log.debug('Cleaning ' + dir);
    var p = path.join(commander.local, dir);
    fs.exists(p, function(exists) {
        if (!exists) {
            callback(null);
            return;
        }
        fs.readdir(p, function(err, files) {
            async.each(files, function(file, callback) {
                file = p + '/' + file;
                fs.stat(file, function(err, stat) {
                    if (stat.mtime < date) {
                        fs.unlink(file, callback);
                    } else {
                        callback(err);
                    }
                });
            }, callback);
        });
    });
};


module.exports = Storage.Local;
