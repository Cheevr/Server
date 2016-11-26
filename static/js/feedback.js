let open = false;

exports.show = () => {
    if (open) {
        return;
    }
    open = true;
    let box = $(`
        <div id="feedback">
            <div class="overlay"></div>
            <div class="box">
                <h2><i class="material">feedback</i>R.feedback.welcome:</h2>
                <input type="text" class="name" placeholder="R.feedback.placeholder.name"/>
                <input type="text" class="contact" placeholder="R.feedback.placeholder.contact"/>
                <textarea placeholder="R.feedback.placeholder.message"></textarea>
                <button class="cancel">R.feedback.cancel</button>
                <button class="submit" disabled>R.feedback.submit</button>
            </div> 
        </div>`);
    box.find('.cancel').on('click', exports.hide.bind(null, box));
    let submitButton = box.find('.submit');
    submitButton.on('click', exports.submit.bind(null, box));
    let textarea = box.find('textarea');
    textarea.on('input', () => submitButton.prop('disabled', $.trim(textarea.val()).length == 0));
    $('body').append(box);
    box.fadeIn();
    box.find('.name').focus();
};

exports.hide = box => {
    box.fadeOut(function() {
        box.remove();
        open = false;
    });
};

exports.submit = box => {
    let message = box.find('textarea').val();
    let name = box.find('.name').val();
    let contact = box.find('.contact').val();
    exports.hide(box);
    box.detach();
    let screen = $('html').html();
    let navi = window.navigator;
    let payload = {
        name, contact, screen, message,
        agent: navi.userAgent,
        platform: navi.platform,
        language: navi.userLanguage || navi.language,
        href: window.location.href
    };
    $.post('/feedback', payload, 'json').done(() => dialog({ message: 'R.feedback.thankyou', confirm: true }));
};

exports.button = () => {
    $('body').append(`<div id="feedbackButton">feedback</div>`);
    let button = $('#feedbackButton');
    button.on('click', exports.show);
    button.fadeIn();
};