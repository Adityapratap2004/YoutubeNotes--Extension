
let currentVideo = "";



//getting current tab url
const getActiveTabURL = async () => {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

//fetching bookmarks

const fetchBookmarks = (currentVideo) => {
    return new Promise((resolve) => {
        chrome.storage.sync.get([currentVideo], (data) => {
            resolve(data[currentVideo] ? JSON.parse(data[currentVideo]) : []);
        });
    });
};

//adding a new bookmark row to the popup

const addNewBookmark = (bookmarksElement, bookmark) => {

    //play button // timestamp //note ke liye input // deletebutton
    const bookmarkdiv = document.createElement("div");
    bookmarkdiv.className = "bookmark";
    bookmarkdiv.setAttribute("timestamp", bookmark.time);
    bookmarkdiv.id = 'bookmark-' + bookmark.time;

    setBookmarkAttributes("play", onPlay, bookmarkdiv);

    const timestamp = document.createElement("p");
    timestamp.className = "timeStamp";
    timestamp.innerText = bookmark?.timestamp;
    bookmarkdiv.appendChild(timestamp);

    const desc = document.createElement("form");
    desc.id = `editForm`;
    desc.setAttribute('timestamp', bookmark.timestamp);
    desc.setAttribute('time', bookmark.time);
    desc.innerHTML = `<input type='text' class='desc${bookmark.time}' value='${bookmark.desc}'/> <input type="submit" id="submit-form${bookmark.time}" hidden />`
    bookmarkdiv.appendChild(desc);
    const label = document.createElement("label");
    label.setAttribute("for", `submit-form${bookmark.time}`);
    label.innerHTML = `<img src='assets/save.png' title="save"/>`
    bookmarkdiv.appendChild(label);
    desc.addEventListener("submit", (event) => {
        event.preventDefault();
        editNote(event);
    });

    setBookmarkAttributes("delete", onDelete, bookmarkdiv);
    bookmarksElement.appendChild(bookmarkdiv);
};

const viewBookmarks = (currentBookmarks = []) => {
    const bookmarksElement = document.getElementById("bookmarks");
    bookmarksElement.innerHTML = "";

    if (currentBookmarks.length > 0) {
        for (let i = 0; i < currentBookmarks.length; i++) {
            const bookmark = currentBookmarks[i];
            addNewBookmark(bookmarksElement, bookmark);
        }
    }
    else {
        bookmarksElement.innerHTML = '<i class="row" >No bookmarks to show</i>';
    }
};

function returnFunction(obj) {
    viewBookmarks(obj.currentVideoBookmarks);
    snackbar({ event: obj.event });
}

function snackbar(event) {
    const s = event.event;
    var x = document.getElementById("snackbar");
    x.innerText = s;
    x.className = "show";
    setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
}


const onPlay = async (e) => {
    const bookmarkTime = e.target.parentNode.getAttribute("timestamp");
    const activeTab = await getActiveTabURL();

    chrome.tabs.sendMessage(activeTab.id, {
        type: "PLAY",
        value: bookmarkTime
    }, snackbar)
};



const editNote = async (e) => {
    const bookmarkTime = e.target.getAttribute("timestamp");
    const times = e.target.getAttribute("time");

    const activeTab = await getActiveTabURL();

    const desc = document.getElementsByClassName(`desc${times}`)[0];
    const note = desc.value;

    chrome.tabs.sendMessage(activeTab.id, {
        type: "EDIT_NOTE",
        value: times,
        descv: note,
    }, returnFunction);

}

const onDelete = async (e) => {
    const activeTab = await getActiveTabURL();
    const bookmarkTime = e.target.parentNode.getAttribute("timestamp");
    const bookmarkElementToDelete = document.getElementById("bookmark-" + bookmarkTime);

    bookmarkElementToDelete.parentNode.removeChild(bookmarkElementToDelete);

    chrome.tabs.sendMessage(activeTab.id, {
        type: "DELETE",
        value: bookmarkTime
    }, returnFunction);
};


const setBookmarkAttributes = (src, eventListener, controlParentElement) => {

    const controlElement = document.createElement("img");
    controlElement.src = "assets/" + src + ".png";
    controlElement.title = src;
    controlElement.addEventListener("click", eventListener);
    controlParentElement.appendChild(controlElement);
};




document.addEventListener("DOMContentLoaded", async () => {
    try {
        const activeTab = await getActiveTabURL();
        const queryParameters = activeTab.url.split("?")[1];
        const urlParameters = new URLSearchParams(queryParameters);
        currentVideo = urlParameters.get("v");
        if (activeTab.url.includes("youtube.com/watch") && currentVideo) {
            const currentVideoBookmarks = await fetchBookmarks(currentVideo);
            viewBookmarks(currentVideoBookmarks);
        } else {
            const container = document.getElementsByClassName("container")[0];
            container.innerHTML = '<div class="title">This is not a youtube video page. Move to a youtube video inorder to see your bookmarks on that video. </div>';
        }
    } catch (error) {
        console.error("Error getting active tab URL:", error);
    }
})


