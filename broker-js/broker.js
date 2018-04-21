// DEBUG: Indicator of the addon wokring
document.body.style.border = "5px solid green";

var GlobalContext = window.wrappedJSObject;

function AddButton() {
    var button = document.createElement("button");
    $(button).html("Click me!");
    $(button).click(buttonClickCallback);
    $(".inventory_rightnav").prepend(button);
};
AddButton();

function AddAnotherButton() {
    var button = document.createElement("button");
    $(button).html("Modal!");
    $(button).click(BrokerUi.GetModalWindow().Show);
    $(".inventory_rightnav").prepend(button);
};
AddAnotherButton();

function buttonClickCallback() {
    sendSellRequest({
        sessionId: GlobalContext.g_sessionID,
        appId: 753,
        contextId: "6",
        assetId: "3976420909",
        confirmedPrice: 100,
        successCallback: function(d){console.log("Success! Item was sold."); console.log(d)},
        failureCallback: function(d){console.log("Failure!"); console.log(d)}
    });
}


// Request functions
/**
* @callback requestCallback
* @param {object} responseData
*/

/**
 * @param {object} options - Request options
 * @param {string} options.sessionId
 * @param {number} options.appId
 * @param {number} options.contextId
 * @param {number} options.assetId
 * @param {number} options.confirmedPrice
 * @param {number} [options.confirmedQuantity=1]
 * @param {requestCallback} options.successCallback
 * @param {requestCallback} options.failureCallback
 */
function sendSellRequest(options) {
    options.confirmedQuantity = options.confirmedQuantity || 1; // This will almost always be 1

    $.ajax({
        url: 'https://steamcommunity.com/market/sellitem/',
        type: 'POST',
        data: {
            sessionid: options.sessionId,
            appid: options.appId,
            contextid: options.contextId,
            assetid: options.assetId,
            amount: options.confirmedQuantity,
            price: options.confirmedPrice
        },
        crossDomain: true,
        xhr: getXMLHttp,
        xhrFields: { withCredentials: true }
    }).done(function (data) {
        if (data.success) {
            options.successCallback(data);
        }
        else {
            options.failureCallback(data);
        }
    }).fail(function (jqxhr) {
        var data = $.parseJSON(jqxhr.responseText);
        options.failureCallback(data);
    });
}

/**
 * Get a page-assigned XMLHttpRequest object to send requests with cookies and referrer enabled
 * More info here: https://discourse.mozilla.org/t/webextension-xmlhttprequest-issues-no-cookies-or-referrer-solved/11224/17
 */
function getXMLHttp(){
    try {
        return XPCNativeWrapper(new window.wrappedJSObject.XMLHttpRequest());
    }
    catch(evt){
        return new XMLHttpRequest();
    }
 }
 