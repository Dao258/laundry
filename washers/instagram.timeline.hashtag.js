'use strict';

var ig = require('instagram-node').instagram(); // https://github.com/totemstech/instagram-node

/*
Instagram Tag washer
input: converts media from an Instagram tag into items
output: none
*/
ns('Washers.Instagram.Timeline', global);
Washers.Instagram.Timeline.Hashtag = function(config) {
    Washers.Instagram.Timeline.call(this, config);

    this.name = 'Instagram/Hashtag';
    this.className = Helpers.classNameFromFile(__filename);
    this.input = _.merge(this.input, {
        description: 'Loads recent images from Instagram with a given hashtag.',
        settings: [{
            name: 'tag',
            prompt: 'What tag do you want to watch?',
            afterEntry: function(rl, oldValue, newValue, callback) {
                newValue = newValue.replace('#', '');
                callback(validator.isWhitespace(newValue));
            }
        }]
    });
};

Washers.Instagram.Timeline.Hashtag.prototype = Object.create(Washers.Instagram.Timeline.prototype);

Washers.Instagram.Timeline.Hashtag.prototype.doInput = function(callback) {
    this.beforeInput();
    this.requestMedia('tag_media_recent', this.tag, callback);
};

module.exports = Washers.Instagram.Timeline.Hashtag;