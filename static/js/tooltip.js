var tooltipDefaults = {
    show: {
        effect: "slideDown",
        delay: 150
    },
    hide: {
        effect: "slideUp",
    },
    open: function () {
        $('body > .ui-helper-hidden-accessible').remove();
    },
    position: {
        my: "center top",
        at: "center bottom+15"
    }
};

function tooltip(elem, options) {
    options = options || {};
    if (typeof options == 'string') {
        options = {content: options};
    }
    $.extend(options, tooltipDefaults, options);
    return elem.tooltip(options);
}

exports.tooltip = window.tooltip = tooltip;