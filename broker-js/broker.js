// Initialization
var GlobalContext = window.wrappedJSObject;
var Modal = BrokerUi.GetModalWindow();

BrokerUi.AddBrokerButton(Modal.Show);

$('#broker-load-inventory-button', Modal.Window).click(function () {
    LoadCompleteInventory().then((result) => { result ? $(this).html("Loaded!") : $(this).html("Timeout") });
});

// function AddButton() {
//     var button = document.createElement("button");
//     $(button).html("Click me!");
//     $(button).click(buttonClickCallback);
//     $(".inventory_rightnav").prepend(button);
// };
// AddButton();

// function buttonClickCallback() {
//     sendSellRequest({
//         sessionId: GlobalContext.g_sessionID,
//         appId: 753,
//         contextId: "6",
//         assetId: "3976420909",
//         confirmedPrice: 100,
//         successCallback: function(d){console.log("Success! Item was sold."); console.log(d)},
//         failureCallback: function(d){console.log("Failure!"); console.log(d)}
//     });
// }

// Inventory functions
/**
 * Completely populates the inventory, including child inventories. By default, Steam only loads a small subset of items.
 */
function LoadCompleteInventory() {
    //return XPCNativeWrapper.unwrap(GlobalContext.g_ActiveInventory).LoadCompleteInventory();

    // Hack time!
    // Since there is no way for me to trigger LoadCompleteInventory manually, I will trigger it by manipulating the filter field
    return new Promise(function (resolve, reject) {
        $("#filter_control").val("aaa").trigger("click").val("").trigger("click");
        LoadCompleteInventoryAux(resolve);
    });
}

function LoadCompleteInventoryAux(resolve, iteration) {
    var timeout = 60000;
    var iterationSpan = 100;
    iteration = iteration || 0;

    if (GlobalContext.g_ActiveInventory.m_bFullyLoaded) {
        resolve(true);
        return;
    }

    if (iteration * iterationSpan >= timeout) {
        resolve(false);
        return;
    }

    iteration++;
    setTimeout(function () {
        LoadCompleteInventoryAux(resolve, iteration);
    }, iterationSpan);
}

/**
 * @param {string[]} tagsArray Tags to be matched
 * @returns {object[]} Objects that match the tags
 */
function FindItemsWithMatchingTags(tagsArray) {

}


// Request functions
/**
* @callback requestCallback
* @param {object} responseData
*/

/**
 * @param {object} options Request options
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
function getXMLHttp() {
    try {
        return XPCNativeWrapper(new window.wrappedJSObject.XMLHttpRequest());
    }
    catch (evt) {
        return new XMLHttpRequest();
    }
}
