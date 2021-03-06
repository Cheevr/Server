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

exports.tooltip = window.tooltip = (elem, options = {}) => {
    if (typeof options == 'string') {
        options = { content: options };
    }
    options = Object.assign({}, tooltipDefaults, options);
    return elem.tooltip(options);
};