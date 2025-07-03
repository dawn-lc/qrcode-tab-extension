import browser from "webextension-polyfill"
function initPageAction(tabId: number) {
    browser.pageAction.show(tabId);
}
browser.tabs.query({}).then((tabs) => {
    for (let tab of tabs) {
        if (tab.id) initPageAction(tab.id);
    }
});
browser.tabs.onUpdated.removeListener(initPageAction);
browser.tabs.onUpdated.addListener(initPageAction);
