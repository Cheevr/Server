(function ($) {
    var open = false;

    function show() {
        if (open) {
            return;
        }
        open = true;
        var box = $(`
            <div id="feedback">
                <div class="overlay"></div>
                <div class="box">
                    <h2><i class="material-icons">feedback</i>R.feedback.welcome:</h2>
                    <input type="text" class="name" placeholder="R.feedback.placeholder.name"/>
                    <input type="text" class="contact" placeholder="R.feedback.placeholder.contact"/>
                    <textarea placeholder="R.feedback.placeholder.message"></textarea>
                    <button class="cancel">R.feedback.cancel</button>
                    <button class="submit" disabled>R.feedback.submit</button>
                </div> 
            </div>`);
        box.find('.cancel').on('click', hide.bind(box));
        var submitButton = box.find('.submit');
        submitButton.on('click', submit.bind(box));
        var textarea = box.find('textarea');
        textarea.on('input', function () {
            submitButton.prop('disabled', $.trim(textarea.val()).length == 0);
        });
        $('body').append(box);
        box.fadeIn();
        box.find('.name').focus();
    }

    function hide() {
        this.fadeOut(function() {
            this.remove();
            open = false;
        });
    }

    function submit() {
        var message = this.find('textarea').val();
        var name = this.find('.name').val();
        var contact = this.find('.contact').val();
        hide.call(this);
        this.detach();
        var screen = $('html').html();
        var navi = window.navigator;
        var payload = {
            name: name,
            contact: contact,
            screen: screen,
            message: message,
            agent: navi.userAgent,
            platform: navi.platform,
            language: navi.userLanguage || navi.language,
            href: window.location.href
        };
        $.post('/feedback', payload, 'json').done(function() {
            dialog({ message: 'R.feedback.thankyou', confirm: true });
        });
    }

    $.feedback = function() {
        $('body').append(`<div id="feedbackButton">feedback</div>`);
        var button = $('#feedbackButton');
        button.on('click', show);
        button.fadeIn();
    };
}(jQuery));