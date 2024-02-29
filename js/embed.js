const params = new URLSearchParams(location.search);
const source = params.get("url");
const id = params.get("id");


document.addEventListener("DOMContentLoaded", () => {
    const video = document.querySelector("video");

    // Set poster image
    video.setAttribute("data-poster", `https://thumb.anime-dex.workers.dev/get/${id}`);

    const defaultOptions = {
        keyboard: {
            focused: true,
            global: true
        },

    };

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(source);
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            const availableQualities = hls.levels.map(
                (l) => l.height
            );

            defaultOptions.quality = {
                default: availableQualities[0],
                options: availableQualities,
                forced: true,
                onChange: (e) => updateQuality(e),
            };
            const player = new Plyr(video, defaultOptions);
            configPlayer(player);
        });
        hls.attachMedia(video);
        window.hls = hls;
    } else {
        const player = new Plyr(video, defaultOptions);
        configPlayer(player);
    }

    function updateQuality(newQuality) {
        window.hls.levels.forEach((level, levelIndex) => {
            if (level.height === newQuality) {
                window.hls.currentLevel = levelIndex;
            }
        });
    }
    function configPlayer(player) {
        player.on('ready', () => {
            const root = video.closest('.plyr--video');

            player.eventListeners.forEach(function (eventListener) {
                if (eventListener.type === 'dblclick') {
                    eventListener.element.removeEventListener(eventListener.type, eventListener.callback, eventListener.options);
                }
            });
            root.addEventListener('dblclick', function (event) {
                event.preventDefault();
            });
            const poster = root.querySelector('.plyr__poster');
            const timeSkip = document.createElement('div');
            const resetState = () => {
                poster.clickedTimes = 0;
                poster.lastSideClicked = undefined;
            };

            timeSkip.className = 'plyr__time-skip';
            poster.parentNode.insertBefore(timeSkip, poster);
            poster.clickedTimes = 0;
            poster.addEventListener('click', function (event) {
                poster.clickedTimes++;

                if (poster.resetTimeout) {
                    clearTimeout(poster.resetTimeout);
                }

                poster.resetTimeout = setTimeout(resetState, 1000);

                // handle only double click
                if (poster.clickedTimes < 2) {
                    return;
                }

                // find click position
                const percentage = (event.clientX - event.target.getBoundingClientRect().left) * 100 / event.target.offsetWidth;

                if (percentage < 40) {
                    if (player.currentTime === 0
                        || (typeof poster.lastSideClicked !== 'undefined' && poster.lastSideClicked !== 'L')
                    ) {
                        clearTimeout(poster.resetTimeout);
                        resetState();

                        return;
                    }

                    timeSkip.innerText = '❮❮\n' + ((poster.clickedTimes - 1) * 10) + 's';
                    timeSkip.classList.add('is-left');
                    timeSkip.classList.remove('is-right');
                    timeSkip.classList.remove('is-animated');
                    setTimeout(() => timeSkip.classList.add('is-animated'), 1);
                    poster.lastSideClicked = 'L';
                    player.rewind();
                } else if (percentage > 60) {
                    if (player.currentTime === player.duration
                        || (typeof poster.lastSideClicked !== 'undefined' && poster.lastSideClicked !== 'R')
                    ) {
                        clearTimeout(poster.resetTimeout);
                        resetState();

                        return;
                    }

                    timeSkip.innerText = '❯❯\n' + ((poster.clickedTimes - 1) * 10) + 's';
                    timeSkip.classList.add('is-right');
                    timeSkip.classList.remove('is-left');
                    timeSkip.classList.remove('is-animated');
                    setTimeout(() => timeSkip.classList.add('is-animated'), 1);
                    poster.lastSideClicked = 'R';
                    player.forward();
                } else {
                    poster.lastSideClicked = 'C';
                    poster.clickedTimes = 0;
                }
            });
        });
    }
});