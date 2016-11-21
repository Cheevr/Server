(function ($) {
    function dialog(options) {
        if (!$.isPlainObject(options)) {
            throw new Error('Unsupported options, need to pass an object!');
        }
        console.log('opening dialog')
    }

    $.feedback = function(options) {
        $('body').append($('<div id="feedbackBox"></div>'));
        if (!options || !options.hide) {
            $('body').append($('<div id="feedbackButton">feedback</div>').on('click', dialog.bind(null, options || {})));
        } else {
            dialog(options || {});
        }
    };
}(jQuery));