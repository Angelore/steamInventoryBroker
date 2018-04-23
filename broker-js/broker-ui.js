function GetModalWindow() {
    var overlay = $('<div id="broker-overlay" class="broker"></div>');
    var modal = null;
    $.get({
        url: browser.extension.getURL("html/modal.html"),
        dataType: "html",
        async: false
    })
        .done(function (data) {
            modal = $(data);
        });

    overlay.hide();
    modal.hide();
    $('body').append(overlay, modal);

    function center() {
        var top, left;

        top = Math.max($(window).height() - modal.outerHeight(), 0) / 2;
        left = Math.max($(window).width() - modal.outerWidth(), 0) / 2;

        modal.css({
            top: top,
            left: left
        });
    };

    function show() {
        center();

        $(window).bind('resize.broker-modal', center);
        $(window).bind('click.broker-overlay', function (event) {
            if ($(event.target).is(overlay)) {
                close();
            }
        });

        modal.show();
        overlay.show();
    }

    function close() {
        modal.hide();
        overlay.hide();
        $(window).unbind('resize.broker-modal');
        $(window).unbind('click.broker-overlay');
    };

    return {
        Show: show,
        Close: close,
        Window: modal
    }
}

function AddBrokerButton(callback) {
    var button = $('<button id="broker-open-modal-button">Open Broker</button>');
    $(button).bind('click.broker-modal-button', callback);
    $(".inventory_rightnav").prepend(button);
}

var BrokerUi = new function () {
    return {
        AddBrokerButton: AddBrokerButton,
        GetModalWindow: GetModalWindow
    }
}();