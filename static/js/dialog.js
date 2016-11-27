const defaultDisplayTime = 5000;
let open = false;

/**
 * @typedef {object} DialogOpts
 * @property {string} message               The message to display
 * @property {number} [level]               The log level that decides which defaults to use
 * @property {string|boolean} [input]       Decides whether to show an input field. Results will be passed on to
 *                                          all handlers. If the value is a string that will be the placeholder for\
 *                                          the input box.
 * @property {string} [title]               The dialog title. Will be set based on level.
 * @property {string} [icon]                The material icon to display along the title. Will be set based on level.
 * @property {number} [timeout]             A timeout after which the dialog will disappear. If no handlers are set,
 *                                          a default value is used to close dialogs.
 * @property {function|boolean} [confirm]   The confirmation handler that will display a confirm button
 * @property {function|boolean} [cancel]    The cancellation handler that will display a confirm button
 */

/**
 * Sets default options for the dialog options
 * @param {DialogOpts} opts
 */
exports.fillDefaults = opts => {
    opts.level = opts.level || 3;
    opts.input = opts.input === true ? 'R.alert.placeholder' : opts.input;
    switch (opts.level) {
        case 1:
            opts.icon = opts.icon || 'build';
            opts.title = opts.title || 'R.alert.title.trace';
            break;
        case 2:
            opts.icon = opts.icon || 'feedback';
            opts.title = opts.title || 'R.alert.title.debug';
            break;
        case 4:
            opts.icon = opts.icon || 'warning_outline';
            opts.title = opts.title || 'R.alert.title.warn';
            break;
        case 5:
            opts.icon = opts.icon || 'cancel';
            opts.title = opts.title || 'R.alert.title.error';
            break;
        default:
            opts.icon = opts.icon || (opts.confirm ? 'help_outline' : 'info_outline');
            opts.title = opts.title || (opts.confirm ? 'R.alert.title.ask' : 'R.alert.title.info');
    }
};

/**
 * Creates a new dialog and attaches it to the html body.
 * @param {DialogOpts} opts
 */
exports.show = opts => {
    if (open) {
        // TODO instead just queue up dialogs
        throw new Error('The previous dialog was not closed');
    }
    if (!opts.message) {
        throw new Error('A dialog was created without specifying a message');
    }
    exports.fillDefaults(opts);
    open = true;
    let alerts = $('#alerts');
    let dialog = $(`
        <div class="alert">
            <h2><i class="material">${opts.icon}</i>${opts.title}</h2>
            <div class="message">${opts.message}</div>
            <input type="text" placeholder="${opts.input}"/>
            <div class="buttons">
                <button class="cancel">R.alert.cancel</button>
                <button class="confirm">R.alert.confirm</button>
            </div>
            
        </div>`);
    alerts.append(dialog).addClass('open');
    dialog.fadeIn();

    let input = dialog.find('input');
    opts.input ? input.focus() : input.remove();

    let hide = exports.hide.bind(null, dialog);
    let autoclose = defaultDisplayTime;
    $.each(['cancel', 'confirm'], function(i, handler) {
        let button = dialog.find('.' + handler);
        if (!opts[handler]) {
            return button.remove();
        }
        autoclose = opts.timeout || 0;
        if (typeof opts[handler] == 'function') {
            button.on('click', function(event) {
                if (opts.input) {
                    return opts[handler](input.val(), event);
                }
                opts[handler](event);
            });
        }
        button.on('click', hide);
    });
    if (autoclose) {
        alerts.one('click', hide);
        let countdown = $('<div class="countdown"></div>');
        dialog.append(countdown);
        countdown.delay(500).animate({width: 0, opacity: 1}, autoclose - 500, hide);
    }
    if (!dialog.find('button').length) {
        dialog.find('.buttons').remove();
    }
};

/**
 * Removes the dialog and ends the modal screen.
 * @param {object} dialog
 */
exports.hide = dialog => {
    dialog.fadeOut(function() {
        $('#alerts').removeClass('open');
        dialog.remove();
        open = false;
    });
};

/**
 * Send a log message to either the dialog or the console, depending on which log level is set
 * @property {number} level             The threshold level that decides wether a message is only intended
 *                                      for console, or as a dialog.
 * @param {number} level                The level of the message to display
 * @param {string} message              The message to display
 * @param {function|boolean} [confirm]  A handler that when set will show a confirm button
 * @param {function|boolean} [cancel]   A handler that when set will show a cancel button
 */
exports.log = function (level, message, confirm, cancel) {
    if (typeof level == 'string') {
        cancel = confirm;
        confirm = message;
        message = level;
        level = 3;
    }
    console.log(`Log (${level}): ${message}`);
    if (level < this.level || 3) {
        exports.show({ level, message, cancel, confirm });
    }
};

window.log = exports.log;
exports.log.level = 3;
exports.trace = exports.log.trace = log.bind(log, 1);
exports.debug = exports.log.debug = log.bind(log, 2);
exports.info = exports.log.info = log.bind(log, 3);
exports.warn = exports.log.warn = log.bind(log, 4);
exports.error = exports.log.error = log.bind(log, 5);
exports.dialog = window.dialog = exports.show;

alert = message => {
    exports.show    ({
        message: message,
        confirm: true,
        title: 'R.alert.legacyAlert'
    });
};

$('body').append(`<div id="alerts"></div>`);