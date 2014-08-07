const {Cc, Ci, Cr, Cu} = require("chrome");

const utils = require("sdk/window/utils");

// page-mod is used to detect page load on browser launch
// for some reason, the observer doesn't detect it
// TODO: cleaner solution for this
const pageMod = require("sdk/page-mod");
const data = require("sdk/self").data;

pageMod.PageMod({
    include: "https://steamcommunity.com/linkfilter/*",
    contentScriptFile: data.url("loadscript.js")
});

Cu.import("resource://gre/modules/AddonManager.jsm");

var linkfilterRegex = /^https?:\/\/(?:www\.)?steamcommunity\.com\/linkfilter\/\?url=(.*)$/i

function isToBeReplaced(url) {
    return linkfilterRegex.test(url);
}

function getURL(url) {
    return linkfilterRegex.exec(url)[1];
}

var slfbTopic = "http-on-modify-request";

var slfbObserver = {
    observe: function(subject, topic, data) {
        if (topic == slfbTopic) {
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
        this.observerService.addObserver(this, slfbTopic, false);
    },

    unregister: function() {
        this.observerService.removeObserver(this, slfbTopic);
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
