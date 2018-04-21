function GetModalWindow(){
    var overlay = $('<div id="overlay" class="broker"></div>');
    var modal = $('<div id="modal" class="broker"><div id="content">Test!</div></div>');
    overlay.hide();
    modal.hide();
    $('body').append(overlay, modal);

    function center(){
        var top, left;

        top = Math.max($(window).height() - modal.outerHeight(), 0) / 2;
        left = Math.max($(window).width() - modal.outerWidth(), 0) / 2;

        modal.css({
          top:top + $(window).scrollTop(),
          left:left + $(window).scrollLeft()
        });
      };

    function show(){
        center();
        
        $(window).bind('resize.modal', center);
        $(window).bind('click.overlay', function(event){
            if ($(event.target).is(overlay)) {
                close();
            }
        });
        
        modal.show();
        overlay.show();
    }

    function close(){
        modal.hide();
        overlay.hide();
        $(window).unbind('resize.modal');
        $(window).unbind('click.overlay');
    };

    return {
        Show: show,
        Close: close
    }
}

var BrokerUi = new function(){
    return {
        CreateModalWindow: CreateModalWindow
    }
}();