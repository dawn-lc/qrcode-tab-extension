chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url) {
        chrome.action.enable(tabId);
    } else {
        chrome.action.disable(tabId);
    }
});