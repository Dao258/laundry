'use strict';

/*
Instagram Tag washer
input: converts media from an Instagram tag into items
output: none
*/
ns('Washers.Instagram.Timeline', global);
Washers.Instagram.Timeline.Hashtag = function(config, job) {
    Washers.Instagram.Timeline.call(this, config, job);

    this.name = 'Instagram/Hashtag';
    this.className = Helpers.buildClassName(__filename);
    this.input = _.merge(this.input, {
        description: 'Loads recent images from Instagram with a given hashtag.',
        prompts: [{
            type: 'input',
            name: 'tag',
            message: 'What tag do you want to watch?',
            filter: function(value) {
                return value.replace('#', '');
            },
            validate: function(value, answers) {
                return !validator.isWhitespace(value);
            }
        }]
    });
};

Washers.Instagram.Timeline.Hashtag.prototype = Object.create(Washers.Instagram.Timeline.prototype);
Washers.Instagram.Timeline.Hashtag.className = Helpers.buildClassName(__filename);

Washers.Instagram.Timeline.Hashtag.prototype.doInput = function(callback) {
    this.requestMedia('/tags/' + encodeURIComponent(this.tag) + '/media/recent', callback);
};

module.exports = Washers.Instagram.Timeline.Hashtag;
