(function ($) {
    var body = $('body');

    function show(options) {
        if (!$.isPlainObject(options)) {
            throw new Error('Unsupported options, need to pass an object!');
        }
        $('#feedbackBox').fadeIn();
        body.on('mousemove', hover)
            .find(':not(section)')
            .find('input, button, textarea')
            .prop('disabled', true);
    }

    function hide() {
        $('#feedbackBox').fadeOut();
        body.off('mousemove', hover)
            .find(':not(section)')
            .find('input, button, textarea')
            .prop('disabled', false);
    }

    function mark(event) {
        var elem = $(event.target);
        if (elem.hasClass('ignore') || elem.parents('.ignore').length) {
            return;
        }
        elem.toggleClass('feedback');
    }

    var highlighted;
    function hover(event) {
        var elem = $(event.target);
        if (elem.hasClass('ignore') || elem.parents('.ignore').length) {
            return;
        }
        if (highlighted) {
            highlighted.removeClass('highlighted').off('click', mark);
        }
        highlighted = elem;
        elem.addClass('highlighted').on('click', mark);
    }

    var text;
    function submit() {
        var screen = $('html').html();
        hide();
        screen.replace('<body', '<body style="zoom: 20%"');
        screen.replace(/<section.*<\/section>/, '');
        $('#feedbackScreenshot').contents().find('html').html(screen);
        text = $('#feedbackTextInput').val();
        $('#feedbackText').html(text);
        $('#feedbackConfirmation').fadeIn();

    }

    function confirm() {
        alert('sending feedback data to backend')
    }

    $.feedback = function(options) {
        body.append($(`
            <section id="feedbackBox" class="ignore">
                <h3>R.feedback.welcome:</h3>
                <textarea id="feedbackTextInput" placeholder="R.feedback.placeholder"></textarea>
                <button id="feedbackCancel">R.feedback.cancel</button>
                <button id="feedbackSubmit">R.feedback.submit</button>
            </section>`));
        $('#feedbackSubmit').on('click', submit);
        $('#feedbackCancel').on('click', hide);
        body.append($(`
            <section id="feedbackConfirmation">
                <h3>R.feedback.confirmation:</h3>
                <div id="feedbackText"></div>
                <iframe id="feedbackScreenshot"></iframe>
                <button id="feedbackConfirmationCancel">R.feedback.cancel</button>
                <button id="feedbackConfirmationSubmit">R.feedback.confirm</button>
            </section>`));
        $('#feedbackConfirmationSubmit').on('click', confirm);
        $('#feedbackConfirmationCancel').on('click', hide);
        if (!options || !options.hide) {
            var button = $('<div id="feedbackButton">feedback</div>');
            button.on('click', show.bind(null, options || {}));
            body.append(button);
        } else {
            show(options || {});
        }
    };
}(jQuery));