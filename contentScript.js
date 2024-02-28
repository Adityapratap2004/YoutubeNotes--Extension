(() => {
    let youtubeLeftControls, youtubePlayer;
    let currentVideo = "";
    let currentVideoBookmarks = [];

    const fetchBookmarks = () => {
        return new Promise((resolve) => {
            chrome.storage.sync.get([currentVideo], (obj) => {
                resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
            })
        })
    }

    const newVideoLoaded = async () => {

        const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
        currentVideoBookmarks = await fetchBookmarks();
        if (!bookmarkBtnExists) {

            const bookmarkDiv = document.createElement("div");
            bookmarkDiv.className = "bookmark-div"

            const bookmarkBtn = document.createElement("img");

            bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
            bookmarkBtn.className = "bookmark-btn ytp-button";
            bookmarkBtn.setAttribute("data-title-no-tooltip", "Bookmark");
            bookmarkBtn.title = "Add Bookmark";

            youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
            youtubePlayer = document.getElementsByClassName("video-stream")[0];
            youtubeLeftControls.appendChild(bookmarkDiv);
            bookmarkDiv.appendChild(bookmarkBtn);


            const youtubeChannelDetails = document.getElementById('top-row');
            const snackbar = document.createElement("div");
            youtubeChannelDetails.appendChild(snackbar);
            snackbar.id = "snackbar";

            bookmarkBtn.addEventListener("click", addNewbookmarkEventHandler);
        }


    }

    const getTime = (t) => {
        var date = new Date(0);
        date.setSeconds(t);
        return date.toISOString().substr(11, 8);
    }

    const addNewbookmarkEventHandler = async () => {
        const currentTime = youtubePlayer.currentTime;
        const newBookmark = {
            time: currentTime,
            timestamp: getTime(currentTime),
            desc: "Add notes",
        };

        currentVideoBookmarks = await fetchBookmarks();
        chrome.storage.sync.set({
            [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
        })

        var x = document.getElementById("snackbar");
        x.innerText = "Bookmark Added";
        x.className = "show";
        setTimeout(function () { x.className = x.className.replace("show", ""); }, 3000);
    }

    function deleteBookmark(value) {
        return new Promise(async (resolve) => {
            const x = parseFloat(value);
            currentVideoBookmarks = await fetchBookmarks();
            currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time !== x);
            chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) }, () => {
                resolve({ currentVideoBookmarks, event: "Deleted the bookmark" })
            });
        })
    }

    function editBookmark(value, descv) {
        return new Promise(async (resolve) => {
            const y = parseFloat(value);
            let currentVideoBookmarks = await fetchBookmarks();

            for (let i = 0; i < currentVideoBookmarks.length; i++) {
                if (currentVideoBookmarks[i].time === y) {
                    currentVideoBookmarks[i].desc = descv;
                }
            }

            chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) }, () => {
                resolve({ currentVideoBookmarks, event: "Saved bookmarks" });
            });
        });
    }


    const onMessage = (message, sender, response) => {
        const { type, value, videoId, descv } = message;
        if (type === "NEW") {
            currentVideo = videoId;
            newVideoLoaded();

        }
        else if (type === "PLAY") {
            youtubePlayer.currentTime = value;
            response({ event: "Video moved to the TimeStamp" })
        }

        else if (type === 'DELETE') {
            deleteBookmark(value)
                .then((result) => {
                    response(result);
                })
                .catch((error) => {
                    console.error(error);
                })

        }
        else if (type === "EDIT_NOTE") {
            editBookmark(value, descv)
                .then((result) => {
                    response(result);
                })
                .catch((error) => {
                    console.error(error);
                })
        }
        return true;

    };
    chrome.runtime.onMessage.addListener(onMessage);
    // newVideoLoaded();

    let trail = "&ytExt=ON";
    if (!window.location.href.includes(trail) && !window.location.href.includes("ab_channel") && window.location.href.includes("youtube.com/watch")) {
        window.location.href += trail;
    }


})();
