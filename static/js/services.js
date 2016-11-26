var defaults = {
    regex: true,
    dialog: true,
    feedback: true,
    tooltip: true
};

exports.init = options => {
    options = $.extend({}, defaults, options);
    for (let key of Object.keys(options)) {
        if (!options[key]) {
            continue;
        }
        switch(key) {
            case 'feedback':
                let feedback = require('feedback');
                !options.feedback.hide && feedback.button();
                break;
            case 'regex':
                let regex = require('regex');
                !options.regex.noGlobal && (window.regex = regex);
                break;
            case 'dialog':
                require('dialog');
                break;
            case 'tooltip':
                require('tooltip');
                break;
        }
    }
};