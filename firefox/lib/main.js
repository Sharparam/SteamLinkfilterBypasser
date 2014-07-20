const {Cc, Ci, Cr, Cu} = require("chrome");

const utils = require("sdk/window/utils");

Cu.import("resource://gre/modules/AddonManager.jsm");

var linkfilterRegex = /^https?:\/\/(?:www\.)?steamcommunity\.com\/linkfilter\/\?url=(.*)$/i

function isToBeReplaced(url) {
    return linkfilterRegex.test(url);
}

function getURL(url) {
    return linkfilterRegex.exec(url)[1];
}

var slfbObserver = {
    observe: function(subject, topic, data) {
        if (topic == "http-on-modify-request") {
            var httpChannel = subject.QueryInterface(Ci.nsIHttpChannel);     
            var requestURL = subject.URI.spec;

            if(isToBeReplaced(requestURL)) {
                httpChannel.cancel(Cr.NS_BINDING_ABORTED);
                var newURL = getURL(requestURL);        
                var gBrowser = utils.getMostRecentBrowserWindow().gBrowser;
                var domWin = httpChannel.notificationCallbacks.getInterface(Ci.nsIDOMWindow);
                var browser = gBrowser.getBrowserForDocument(domWin.top.document);
                browser.loadURI(newURL);
            }
        }
    },

    get observerService() {
        return Cc["@mozilla.org/observer-service;1"]
                         .getService(Ci.nsIObserverService);
    },

    register: function() {
        this.observerService.addObserver(this, "http-on-modify-request", false);
    },

    unregister: function() {
        this.observerService.removeObserver(this, "http-on-modify-request");
    }
}

slfbObserver.register();

var listener = {
    onDisabled: function(addon) {
        if (addon.id == "slfb@sharparam.com")
            slfbObserver.unregister();
    }
}

AddonManager.addAddonListener(listener);
