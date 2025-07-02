function initPageAction(tabId) {
    browser.pageAction.show(tabId);
}
var gettingAllTabs = browser.tabs.query({});
gettingAllTabs.then((tabs) => {
    for (let tab of tabs) {
        initPageAction(tab.id);
    }
});
browser.tabs.onUpdated.removeListener(initPageAction);
browser.tabs.onUpdated.addListener(initPageAction);
