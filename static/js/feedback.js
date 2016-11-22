(function ($) {
    function show(options) {
        if (!$.isPlainObject(options)) {
            throw new Error('Unsupported options, need to pass an object!');
        }
        $('#feedbackOverlay').fadeIn();
        $('#feedbackBox').fadeIn();
    }

    function hide() {
        $('#feedbackBox').fadeOut();
        $('#feedbackOverlay').fadeOut(function() {
            $('#feedbackTextInput').val('');
        });
        // TODO reposition box
    }

    function submit() {
        var message = $('#feedbackTextInput').val();
        hide();
        var feedback = $('#feedback');
        feedback.detach();
        var screen = $('html').html();
        feedback.appendTo('body');
        var navi = window.navigator;
        var payload = {
            screen: screen,
            message: message,
            agent: navi.userAgent,
            platform: navi.platform,
            language: navi.userLanguage || navi.language,
            href: window.location.href
        };
        $.post('/feedback', payload, 'json').done(function() {
            alert('R.feedback.thankyou');
        });
    }

    $.feedback = function(options) {
        var feedback = $('<div id="feedback"></div>');
        feedback.append($(`
            <div id="feedbackOverlay"></div>
            <div id="feedbackBox" class="ignore">
                <h3>R.feedback.welcome:</h3>
                <textarea id="feedbackTextInput" placeholder="R.feedback.placeholder"></textarea>
                <button id="feedbackCancel">R.feedback.cancel</button>
                <button id="feedbackSubmit">R.feedback.submit</button>
            </div>`));
        $('body').append(feedback);
        $('#feedbackSubmit').on('click', submit);
        $('#feedbackCancel').on('click', hide);
        if (!options || !options.hide) {
            var button = $('<div id="feedbackButton">feedback</div>');
            button.on('click', show.bind(null, options || {}));
            feedback.append(button);
        } else {
            show(options || {});
        }
    };
}(jQuery));