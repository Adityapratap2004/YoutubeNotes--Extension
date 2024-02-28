chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url && tab.url.includes("youtube.com/watch") && changeInfo.status === "complete") {
        const queryParams = tab.url.split("?")[1];
        const urlParameters = new URLSearchParams(queryParams);
        chrome.tabs.sendMessage(tabId, {
            type: "NEW",
            videoId: urlParameters.get("v"),
        });
    }
});


