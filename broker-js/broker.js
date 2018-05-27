// Initialization
var GlobalContext = window.wrappedJSObject;
var Modal = BrokerUi.GetModalWindow();

BrokerUi.AddBrokerButton(Modal.Show);

$('#broker-load-inventory-button', Modal.Window).click(function () {
    LoadCompleteInventory().then((result) => { result ? $(this).html("Loaded!") : $(this).html("Timeout") });
});

$('#broker-test-button', Modal.Window).click(function(){
    // getting price test
    // if (GlobalContext.g_ActiveInventory.selectedItem != null) {
    //     sendPriceRequest({
    //         item: GlobalContext.g_ActiveInventory.selectedItem,
    //         countryCode: GlobalContext.g_strCountryCode,
    //         currency: typeof( GlobalContext.g_rgWalletInfo ) != 'undefined' ? GlobalContext.g_rgWalletInfo['wallet_currency'] : 1,
    //         successCallback: function(data){ alert(JSON.stringify(data)) },
    //         failureCallback: function(data){ alert(JSON.stringify(data)) }
    //     });
    // }

    //var sItems = GlobalContext.g_ActiveInventory.m_rgItemElements.map(e => e[0].rgItem); Doesn't work somehow?!
    var sItems = [];
    var rgElements = GlobalContext.g_ActiveInventory.m_rgItemElements;
    for (let index = 0; index < rgElements.length; index++) {
        const element = rgElements[index];
        sItems.push(element[0].rgItem);
    }
    var rItems = FindItemsWithMatchingTerms(["refined metal"], sItems);
    console.log(rItems);
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
 * @param {object[]} itemsSource Array with (rg)items in which to perform search
 * @returns {object[]} Objects that match the tags
 */
function FindItemsWithMatchingTerms(termsArray, itemsSource) {
    let resultArray = [];

    for (let index = 0; index < itemsSource.length; index++) {
        const item = itemsSource[index];
        let name = item.description.name.toLowerCase();
        let type = item.description.type.toLowerCase();
        let tags = item.description.tags;

        for (let termsIndex = 0; termsIndex < termsArray.length; termsIndex++) {
            const term = termsArray[termsIndex].toLowerCase();
            if (name.includes(term) || type.includes(term)) {
                resultArray.push(item);
                continue;
            }

            for (let tagIndex = 0; tagIndex < tags.length; tagIndex++) {
                const tag = tags[tagIndex];
                let tagName = tag.localized_tag_name.toLowerCase();
                if (tagName.includes(term)) {
                    resultArray.push(item);
                    continue;
                }
            }
        }
    }

    return resultArray;
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
 * @param {object} options Request options
 * @param {object} options.item Selected item
 * @param {string} options.countryCode Country code
 * @param {string} options.currency Currency
 * @param {requestCallback} options.successCallback
 * @param {requestCallback} options.failureCallback
 */
function sendPriceRequest(options) {
    var marketHashName = getMarketHashName(options.item.description);
    $.ajax({
        url: 'https://steamcommunity.com/market/priceoverview/',
        type: 'GET',
        data: {
            country: options.countryCode, // g_strCountryCode,
            currency: options.currency, // typeof( g_rgWalletInfo ) != 'undefined' ? g_rgWalletInfo['wallet_currency'] : 1,
            appid: options.item.appid,
            market_hash_name: marketHashName
        },
        xhr: getXMLHttp
    }).done(function (data) {
        if (data.responseJSON && data.responseJSON.success) {
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


// Steam economy duplicate functions
function getMarketHashName(rgDescriptionData) {
    if (typeof rgDescriptionData.market_hash_name != 'undefined')
        return rgDescriptionData.market_hash_name;
    else if (typeof rgDescriptionData.market_name != 'undefined')
        return rgDescriptionData.market_name;
    else
        return rgDescriptionData.name;
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
