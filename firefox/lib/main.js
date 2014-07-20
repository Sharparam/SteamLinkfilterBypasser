const {Cc, Ci, Cr} = require("chrome");

var utils = require("sdk/window/utils");

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
