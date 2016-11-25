var defaults = {
    regex: true,
    dialog: true,
    feedback: true,
    tooltip: true
};

exports.init = function(options) {
    options = $.extend({}, defaults, options);
    Object.keys(options).forEach(function(elem) {
        if (!options[elem]) {
            return;
        }
        switch(elem) {
            case 'feedback':
                var feedback = require('feedback');
                !options.feedback.hide && feedback();
                break;
            case 'regex':
                var regex = require('regex');
                !options.regex.noGlobal && (window.regex = regex);
                break;
            case 'dialog':
                require('dialog');
                break;
            case 'tooltip':
                require('tooltip');
                break;
        }
    });
};