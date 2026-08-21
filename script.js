/* =========================================================
   SHANVIKA BIRTHDAY POSTER
   FULL SCRIPT
========================================================= */

(function () {

    "use strict";


    /* =========================================================
       HELPERS
    ========================================================= */

    function $(id) {
        return document.getElementById(id);
    }


    function prefersReducedMotion() {

        return window.matchMedia &&
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

    }


    /* =========================================================
       ELEMENTS
    ========================================================= */

    var preloader = $("preloader");

    var preloaderLoading =
        $("preloader-loading");

    var preloaderCountdown =
        $("preloader-countdown");

    var poster =
        document.querySelector(".poster");

    var fabStack =
        document.querySelector(".fab-stack");

    var birthdayAudio = null;

    var musicPlaying = false;

    var wishStorageKey = "shanvika_wishes";

    var wishesPopup = $("wishesPopup");

    var wishesForm = $("wishesForm");

    var locationGate =
        document.getElementById("location-gate");

    var locationStatus =
        document.getElementById("location-status");

    var allowLocationBtn =
        document.getElementById("allowLocationBtn");


    /* =========================================================
       COUNTDOWN ELEMENTS
    ========================================================= */

    var daysEl = $("cd-days");
    var hoursEl = $("cd-hours");
    var minutesEl = $("cd-mins");
    var secondsEl = $("cd-secs");
    var countdownSub = $("countdown-sub");


    /* =========================================================
       COUNTDOWN DATE / TIME CONFIGURATION

       Change ONLY these values for testing.

       Example:
           TARGET_YEAR   = 2026
           TARGET_MONTH  = 8
           TARGET_DAY    = 25
           TARGET_HOUR   = 18
           TARGET_MINUTE = 30

       The countdown will target:
           25 August 2026, 6:30 PM IST

       Month is NORMAL month numbering (1 = January, 8 = August).
       Time is 24-hour format.

       After the target time is reached:
       - poster/birthday window remains active for 24 hours
       - after 24 hours the countdown automatically targets
         the same month/day/time in the next year.
    ========================================================= */

    var TZ = "Asia/Kolkata";

    var TARGET_YEAR = 2026;
    var TARGET_MONTH = 8;       // 1 = January, 8 = August
    var TARGET_DAY = 22;
    var TARGET_HOUR = 9;        // 0-23
    var TARGET_MINUTE = 0;      // 0-59

    var VISIBILITY_MS = 24 * 60 * 60 * 1000;

    var TIME_CACHE_KEY = "shanvika_ist_time_cache_v2";

    var timeState = {
        now: Date.now(),
        source: "device"
    };

    var countdownTimer = null;
    var activeBirthdayYear = null;

    /* Optional short countdown test.
       Set to 0 for normal target-date/time countdown.
       Example: 5 = five-minute test from page open. */
    var TEST_COUNTDOWN_MINUTES = 0;
    var testCountdownTarget = null;

    if (TEST_COUNTDOWN_MINUTES > 0) {
        testCountdownTarget =
            Date.now() + (TEST_COUNTDOWN_MINUTES * 60 * 1000);
    }


    function padNumber(number) {
        return String(number).padStart(2, "0");
    }


    function targetIsoForYear(year) {
        var month = String(TARGET_MONTH).padStart(2, "0");
        var day = String(TARGET_DAY).padStart(2, "0");
        var hour = String(TARGET_HOUR).padStart(2, "0");
        var minute = String(TARGET_MINUTE).padStart(2, "0");

        return (
            year + "-" +
            month + "-" +
            day + "T" +
            hour + ":" +
            minute + ":00+05:30"
        );
        
        
    }


    function targetStartForYear(year) {
        return new Date(targetIsoForYear(year)).getTime();
    }


    function getTargetYear(now) {
        if (TARGET_YEAR && TARGET_YEAR > 0) {
            /*
             * TARGET_YEAR is the first configured occurrence.
             * Before that year, use TARGET_YEAR.
             * From then onward, automatically repeat yearly.
             */
            var firstStart = targetStartForYear(TARGET_YEAR);

            if (now < firstStart) {
                return TARGET_YEAR;
            }

            var currentYear =
                Number(
                    new Intl.DateTimeFormat("en-US", {
                        timeZone: TZ,
                        year: "numeric"
                    }).format(new Date(now))
                );

            return Math.max(TARGET_YEAR, currentYear);
        }

        return Number(
            new Intl.DateTimeFormat("en-US", {
                timeZone: TZ,
                year: "numeric"
            }).format(new Date(now))
        );
    }


    function getTargetWindow(now) {
        var year = getTargetYear(now);
        var start = targetStartForYear(year);
        var end = start + VISIBILITY_MS;

        if (now >= start && now < end) {
            return {
                inWindow: true,
                year: year,
                start: start,
                end: end
            };
        }

        if (now < start) {
            return {
                inWindow: false,
                year: year,
                start: start,
                end: end
            };
        }

        var nextYear = year + 1;
        var nextStart = targetStartForYear(nextYear);

        return {
            inWindow: false,
            year: nextYear,
            start: nextStart,
            end: nextStart + VISIBILITY_MS
        };
    }


    function setCountdownValues(days, hours, minutes, seconds) {
        if (daysEl) daysEl.textContent = padNumber(days);
        if (hoursEl) hoursEl.textContent = padNumber(hours);
        if (minutesEl) minutesEl.textContent = padNumber(minutes);
        if (secondsEl) secondsEl.textContent = padNumber(seconds);
    }
    function updateBrowserTitle(days, hours, minutes, seconds, state) {

    if (state === "birthday") {
        document.title = "🎉 Happy Birthday Shanvika! 🎂";
        return;
    }

    if (state === "countdown") {
        document.title =
            padNumber(days) + "d " +
            padNumber(hours) + "h " +
            padNumber(minutes) + "m " +
            padNumber(seconds) + "s | Shanvika";
    }
}


    function updateCountdown(nowOverride) {
        var now = typeof nowOverride === "number" ? nowOverride : getSyncedNow();
        timeState.now = now;

        /* Testing mode: count down from the configured number of
           minutes, then enter the normal birthday/unlock flow. */
        if (testCountdownTarget !== null) {
            if (now < testCountdownTarget) {
                var testDifference = testCountdownTarget - now;
                var testTotalSeconds = Math.floor(testDifference / 1000);
                var testDays = Math.floor(testTotalSeconds / 86400);
                var testHours = Math.floor((testTotalSeconds % 86400) / 3600);
                var testMinutes = Math.floor((testTotalSeconds % 3600) / 60);
                var testSeconds = testTotalSeconds % 60;

                setCountdownValues(
    testDays,
    testHours,
    testMinutes,
    testSeconds
);

updateBrowserTitle(
    testDays,
    testHours,
    testMinutes,
    testSeconds,
    "countdown"
);

                if (countdownSub) {
                    countdownSub.textContent =
                        "TEST MODE — countdown target in " +
                        TEST_COUNTDOWN_MINUTES + " minute(s)";
                }

                return "countdown";
            }

            /* Target reached: switch to the normal birthday state.
               Reset the test target so the existing 24-hour birthday
               window and yearly-reset logic can take over. */
            testCountdownTarget = null;
        }

        var window = getTargetWindow(now);
        activeBirthdayYear = window.year;

        if (window.inWindow) {

    setCountdownValues(0, 0, 0, 0);

    updateBrowserTitle(
        0,
        0,
        0,
        0,
        "birthday"
    );

    if (countdownSub) {
        countdownSub.textContent =
            "Today is Shanvika's birthday! 🎉";
    }

    return "birthday";
}

        var difference = Math.max(0, window.start - now);
        var totalSeconds = Math.floor(difference / 1000);
        var days = Math.floor(totalSeconds / 86400);
        var hours = Math.floor((totalSeconds % 86400) / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;

        setCountdownValues(days, hours, minutes, seconds);
        updateBrowserTitle(
    days,
    hours,
    minutes,
    seconds,
    "countdown"
);

        if (countdownSub) {
            var displayDate = String(TARGET_DAY).padStart(2, "0") + " " +
                new Date(2000, TARGET_MONTH - 1, 1).toLocaleString("en-US", {
                    month: "long"
                }) + " " + activeBirthdayYear;

            var displayHour = TARGET_HOUR % 12 || 12;
            var displayMinute = String(TARGET_MINUTE).padStart(2, "0");
            var ampm = TARGET_HOUR >= 12 ? "PM" : "AM";

            countdownSub.textContent =
                "Unlocks on " + displayDate +
                " at " + displayHour + ":" + displayMinute +
                " " + ampm + " IST";
            
        }
        
        return "countdown";
    }


    /* =========================================================
       INTERNET-SYNCED IST TIME + CACHED FALLBACK

       The server timestamp is converted into a local running
       clock using the measured client/server offset. The cached
       value is used when the network is unavailable.
    ========================================================= */

    function getSyncedNow() {
        if (timeState.source === "internet" &&
            Number.isFinite(timeState.serverEpoch) &&
            Number.isFinite(timeState.clientEpoch)) {
            return timeState.serverEpoch + (Date.now() - timeState.clientEpoch);
        }

        if (timeState.source === "cache" &&
            Number.isFinite(timeState.serverEpoch) &&
            Number.isFinite(timeState.clientEpoch)) {
            return timeState.serverEpoch + (Date.now() - timeState.clientEpoch);
        }

        return Date.now();
    }


    function applyTimeCache() {
        try {
            var raw = localStorage.getItem(TIME_CACHE_KEY);
            if (!raw) return false;

            var cached = JSON.parse(raw);
            if (!cached ||
                !Number.isFinite(cached.serverEpoch) ||
                !Number.isFinite(cached.clientEpoch)) {
                return false;
            }

            timeState.serverEpoch = cached.serverEpoch;
            timeState.clientEpoch = cached.clientEpoch;
            timeState.source = "cache";
            return true;
        } catch (error) {
            return false;
        }
    }


    async function fetchInternetISTTime() {
        var controller = new AbortController();
        var timeout = setTimeout(function () {
            controller.abort();
        }, 6000);

        try {
            var response = await fetch(
                "https://worldtimeapi.org/api/timezone/Asia/Kolkata?cb=" + Date.now(),
                {
                    method: "GET",
                    cache: "no-store",
                    signal: controller.signal
                }
            );

            if (!response.ok) {
                throw new Error("Internet time request failed: " + response.status);
            }

            var data = await response.json();
            var serverEpoch = Number(data.unixtime) * 1000;

            if (!Number.isFinite(serverEpoch)) {
                throw new Error("Invalid internet time response.");
            }

            var clientEpoch = Date.now();

            timeState.serverEpoch = serverEpoch;
            timeState.clientEpoch = clientEpoch;
            timeState.source = "internet";

            try {
                localStorage.setItem(
                    TIME_CACHE_KEY,
                    JSON.stringify({
                        serverEpoch: serverEpoch,
                        clientEpoch: clientEpoch,
                        savedAt: new Date().toISOString(),
                        timezone: "Asia/Kolkata"
                    })
                );
            } catch (storageError) {
                console.warn("Unable to cache internet time:", storageError);
            }

            return true;
        } finally {
            clearTimeout(timeout);
        }
    }


    async function syncISTTime() {
        try {
            await fetchInternetISTTime();
        } catch (error) {
            console.warn("Internet IST sync unavailable; using cached time/device time.", error);

            if (!applyTimeCache()) {
                timeState.source = "device";
                timeState.serverEpoch = null;
                timeState.clientEpoch = null;
            }
        }

        timeState.now = getSyncedNow();
        return timeState.now;
    }

    /* =========================================================
       LOCATION FEATURES

       Ported from the Vashista page:
       - Browser geolocation permission check
       - Request current latitude/longitude
       - Save coordinates in localStorage
       - Send page-open location to Google Sheet
       - Helpful message when permission is blocked
    ========================================================= */

    var geoData = {
        lat: "",
        lng: ""
    };

    var locationGranted = false;

    function showLocationHelp(message) {
        if (locationStatus) {
            locationStatus.textContent =
                message ||
                "Tap Try Again.";
        }

        if (allowLocationBtn) {
            allowLocationBtn.disabled = false;
            allowLocationBtn.textContent = "Try Again";
        }
    }

    async function getLocationPermissionState() {
        if (!navigator.geolocation) {
            return "unsupported";
        }

        if (!navigator.permissions || !navigator.permissions.query) {
            return "prompt";
        }

        try {
            var result = await navigator.permissions.query({ name: "geolocation" });
            return result.state;
        } catch (error) {
            return "prompt";
        }
    }

    function requestUserLocation(always) {

        return new Promise(function(resolve, reject) {

            navigator.geolocation.getCurrentPosition(

                function(pos) {

                    geoData.lat =
                        pos.coords.latitude;

                    geoData.lng =
                        pos.coords.longitude;

                    locationGranted = true;

                    /*
                     * Always overwrite the stored coordinates with
                     * the freshly captured position.
                     */
                    localStorage.setItem(
                        "birthday_lat",
                        String(geoData.lat)
                    );

                    localStorage.setItem(
                        "birthday_lng",
                        String(geoData.lng)
                    );

                    localStorage.setItem(
                        "birthday_location_time",
                        new Date().toISOString()
                    );

                    if (always) {
                        sendLocationToSheet("page_open");
                    }

                    resolve();
                },

                function(err) {
                    var message = "Unable to get your location.";

                    if (err && err.code === 1) {
                        message = "Tap Try Again.";
                    } else if (err && err.code === 2) {
                        message = "Tap Try Again.";
                    } else if (err && err.code === 3) {
                        message = "Tap Try Again.";
                    } else if (err && err.message) {
                        message = err.message;
                    }

                    reject(new Error(message));
                },

                {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

    function sendLocationToSheet(eventType) {

        if (!geoData.lat || !geoData.lng) {
            return;
        }

        var endpoint =
            "https://script.google.com/macros/s/AKfycbzf-AB4la4pq-wi6K0qOAFhhQQ1Alr83oT5X1TEZEqCtHeGSFeS_pi4VhGdtmfdaSwz/exec";

        fetch(
            endpoint +
            "?page=Shanvika" +
            "&lat=" + encodeURIComponent(geoData.lat) +
            "&lng=" + encodeURIComponent(geoData.lng) +
            "&event=" + encodeURIComponent(eventType || "visit"),
            {
                mode: "no-cors"
            }
        ).catch(function() {
            // Location access should not prevent the birthday page
            // from working if the logging endpoint is unavailable.
        });
    }

    /* =========================================================
       SHOW COUNTDOWN
    ========================================================= */

    function showCountdown() {

        /*
         * Hide normal loading message.
         */
        if (preloaderLoading) {

            preloaderLoading.hidden =
                true;

        }


        /*
         * Show countdown.
         */
        if (preloaderCountdown) {

            preloaderCountdown.hidden =
                false;

        }

    }


    /* =========================================================
       HIDE PRELOADER
       
       IMPORTANT:
       This function is called ONLY after
       the countdown reaches zero.
    ========================================================= */

    function hidePreloader() {

        if (!preloader) {

            revealPoster();

            return;

        }


        preloader.classList.add(
            "preloader-hidden"
        );


        setTimeout(
            function () {

                if (preloader) {

                    preloader.style.display =
                        "none";

                }

            },
            800
        );

    }


    /* =========================================================
       REVEAL POSTER
    ========================================================= */

    function revealPoster() {

        document.body.classList.add(
            "poster-revealed"
        );


        /*
         * Show audio control only after
         * preloader disappears.
         */
        if (fabStack) {

            setTimeout(
                function () {

                    fabStack.classList.add(
                        "fab-visible"
                    );

                },
                700
            );

        }


        /*
         * Reveal animations.
         */
        setTimeout(
            function () {

                burstSparkles();

                burstBalloons();

            },
            500
        );

    }


    /* =========================================================
       REVEAL SPARKLE BURST
    ========================================================= */

    function burstSparkles() {

        if (!poster) {

            return;

        }


        if (prefersReducedMotion()) {

            return;

        }


        var canvas =
            document.createElement(
                "canvas"
            );


        canvas.id =
            "reveal-burst";


        poster.appendChild(
            canvas
        );


        var rect =
            poster.getBoundingClientRect();


        var dpr =
            window.devicePixelRatio || 1;


        canvas.width =
            Math.floor(
                rect.width * dpr
            );


        canvas.height =
            Math.floor(
                rect.height * dpr
            );


        canvas.style.width =
            rect.width + "px";


        canvas.style.height =
            rect.height + "px";


        var ctx =
            canvas.getContext(
                "2d"
            );


        if (!ctx) {

            return;

        }


        ctx.scale(
            dpr,
            dpr
        );


        var particles = [];

        var particleCount = 90;


        var centerX =
            rect.width / 2;


        var centerY =
            rect.height * 0.45;


        var colors = [

            "#f0c48a",

            "#e3a98f",

            "#d8b4a0",

            "#c9a86b",

            "#ecd9b8",

            "#cbb08a"

        ];


        for (
            var i = 0;
            i < particleCount;
            i++
        ) {

            var angle =
                Math.random() *
                Math.PI *
                2;


            var speed =
                1.5 +
                Math.random() * 4;


            particles.push({

                x: centerX,

                y: centerY,

                vx:
                    Math.cos(angle) *
                    speed,

                vy:
                    Math.sin(angle) *
                    speed,

                size:
                    1.5 +
                    Math.random() * 3,

                life: 1,

                decay:
                    0.008 +
                    Math.random() * 0.012,

                color:
                    colors[
                        Math.floor(
                            Math.random() *
                            colors.length
                        )
                    ]

            });

        }


        var running = true;


        function tick() {

            if (!running) {

                return;

            }


            ctx.clearRect(

                0,

                0,

                rect.width,

                rect.height

            );


            var alive = false;


            particles.forEach(
                function (p) {

                    if (p.life <= 0) {

                        return;

                    }


                    alive = true;


                    p.x += p.vx;

                    p.y += p.vy;


                    p.vy += 0.025;


                    p.life -= p.decay;


                    ctx.globalAlpha =
                        Math.max(
                            0,
                            p.life
                        );


                    ctx.fillStyle =
                        p.color;


                    ctx.beginPath();


                    ctx.arc(

                        p.x,

                        p.y,

                        p.size,

                        0,

                        Math.PI * 2

                    );


                    ctx.fill();

                }
            );


            ctx.globalAlpha = 1;


            if (alive) {

                requestAnimationFrame(
                    tick
                );

            } else {

                cleanup();

            }

        }


        function cleanup() {

            running = false;


            if (canvas.parentNode) {

                canvas.parentNode.removeChild(
                    canvas
                );

            }

        }


        requestAnimationFrame(
            tick
        );


        setTimeout(
            cleanup,
            8000
        );

    }


    /* =========================================================
       ONE-TIME BALLOON BURST
    ========================================================= */

    function burstBalloons() {

        var container =
            $("extra-balloons");


        if (!container) {

            return;

        }


        if (prefersReducedMotion()) {

            return;

        }


        var colors = [

            "#f0c48a",

            "#e3a98f",

            "#d8b4a0",

            "#c9a86b",

            "#ecd9b8",

            "#cbb08a"

        ];


        var count = 5;


        for (
            var i = 0;
            i < count;
            i++
        ) {

            (function (index) {

                setTimeout(
                    function () {

                        var balloon =
                            document.createElement(
                                "div"
                            );


                        balloon.className =
                            "rise-balloon";


                        var size =
                            46 +
                            Math.random() * 40;


                        balloon.style.left =
                            (
                                8 +
                                Math.random() * 84
                            ) + "%";


                        balloon.style.width =
                            size + "px";


                        balloon.style.height =
                            (
                                size * 1.24
                            ) + "px";


                        balloon.style.background =
                            colors[
                                Math.floor(
                                    Math.random() *
                                    colors.length
                                )
                            ];


                        balloon.style.animationDuration =
                            (
                                4.5 +
                                Math.random() * 1.5
                            ) + "s";


                        container.appendChild(
                            balloon
                        );


                        setTimeout(
                            function () {

                                if (
                                    balloon.parentNode
                                ) {

                                    balloon.parentNode
                                        .removeChild(
                                            balloon
                                        );

                                }

                            },
                            6500
                        );

                    },
                    index * 260
                );

            })(i);

        }

    }


    /* =========================================================
       CUSTOM BACKGROUND MUSIC
       
       Uses music1.mp3 from same folder.
    ========================================================= */

    function wireAudio() {

        var btn =
            $("audioToggle");


        birthdayAudio =
            $("birthdayAudio");


        if (
            !btn ||
            !birthdayAudio
        ) {

            return;

        }


        /*
         * Initial state.
         */
        musicPlaying = false;


        btn.textContent =
            "🔇";


        btn.setAttribute(
            "aria-label",
            "Play background music"
        );


        /*
         * Audio error handling.
         */
        birthdayAudio.addEventListener(
            "error",
            function () {

                musicPlaying = false;


                btn.textContent =
                    "🔇";


                btn.setAttribute(
                    "aria-label",
                    "Play background music"
                );

            }
        );


        /*
         * Audio ended handling.
         */
        birthdayAudio.addEventListener(
            "ended",
            function () {

                musicPlaying = false;


                btn.textContent =
                    "🔇";


                btn.setAttribute(
                    "aria-label",
                    "Play background music"
                );

            }
        );


        /*
         * Audio button.
         */
        btn.addEventListener(
            "click",
            function () {


                /*
                 * Pause music.
                 */
                if (musicPlaying) {

                    birthdayAudio.pause();


                    musicPlaying =
                        false;


                    btn.textContent =
                        "🔇";


                    btn.setAttribute(
                        "aria-label",
                        "Play background music"
                    );


                    return;

                }


                /*
                 * Start music.
                 *
                 * Browser autoplay restrictions
                 * are satisfied because this happens
                 * after a user click.
                 */
                var playPromise =
                    birthdayAudio.play();


                if (
                    playPromise &&
                    typeof playPromise.then ===
                    "function"
                ) {

                    playPromise.then(
                        function () {

                            musicPlaying =
                                true;


                            btn.textContent =
                                "🔊";


                            btn.setAttribute(
                                "aria-label",
                                "Pause background music"
                            );

                        }
                    ).catch(
                        function () {

                            musicPlaying =
                                false;


                            btn.textContent =
                                "🔇";


                            btn.setAttribute(
                                "aria-label",
                                "Play background music"
                            );

                        }
                    );

                } else {

                    musicPlaying =
                        true;


                    btn.textContent =
                        "🔊";

                }

            }
        );

    }


    /* =========================================================
       WISHES BUTTON + WISH STORAGE

       Same Vashista wishes flow, renamed for Shanvika:
       - Floating 💌 wishes button
       - Popup form
       - Browser-local wish storage
       - Google Sheet storage with page=Shanvika
       - Latitude/longitude attached to every wish
       - Thank-you confirmation
    ========================================================= */

    function getStoredWishes() {

        try {
            var raw = localStorage.getItem(wishStorageKey);
            var parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }


    function saveWishLocally(name, message) {

        var wishes = getStoredWishes();

        wishes.push({
            name: name,
            message: message,
            lat: geoData.lat || "",
            lng: geoData.lng || "",
            timestamp: new Date().toISOString()
        });

        /* Keep the browser storage small. */
        if (wishes.length > 50) {
            wishes = wishes.slice(-50);
        }

        try {
            localStorage.setItem(
                wishStorageKey,
                JSON.stringify(wishes)
            );
        } catch (error) {
            console.warn("Unable to save wish locally:", error);
        }
    }


    function sendWishToSheet(name, message) {

        if (!geoData.lat || !geoData.lng) {
            return;
        }

        var endpoint =
            "https://script.google.com/macros/s/AKfycbzf-AB4la4pq-wi6K0qOAFhhQQ1Alr83oT5X1TEZEqCtHeGSFeS_pi4VhGdtmfdaSwz/exec";

        fetch(
            endpoint +
            "?page=Shanvika" +
            "&name=" + encodeURIComponent(name) +
            "&message=" + encodeURIComponent(message) +
            "&lat=" + encodeURIComponent(geoData.lat) +
            "&lng=" + encodeURIComponent(geoData.lng) +
            "&event=wish_submit",
            {
                mode: "no-cors"
            }
        ).catch(function (error) {
            console.warn("Wish storage request failed:", error);
        });
    }


    function openWishesPopup() {

        if (!wishesPopup) return;

        wishesPopup.style.display = "flex";
        wishesPopup.setAttribute("aria-hidden", "false");

        var nameInput = $("wisherName");

        if (nameInput) {
            setTimeout(function () {
                nameInput.focus();
            }, 100);
        }
    }


    function closeWishesPopup() {

        if (!wishesPopup) return;

        wishesPopup.style.display = "none";
        wishesPopup.setAttribute("aria-hidden", "true");
    }


    function wireWishesPopup() {

        var openButton = $("openWishes");
        var closeButton = $("closePopup");
        var closeButton2 = $("closePopup2");

        if (openButton) {
            openButton.addEventListener("click", openWishesPopup);
        }

        if (closeButton) {
            closeButton.addEventListener("click", closeWishesPopup);
        }

        if (closeButton2) {
            closeButton2.addEventListener("click", closeWishesPopup);
        }

        if (wishesPopup) {
            wishesPopup.addEventListener("click", function (event) {
                if (event.target === wishesPopup) {
                    closeWishesPopup();
                }
            });
        }

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && wishesPopup && wishesPopup.style.display === "flex") {
                closeWishesPopup();
            }
        });
    }


    function wireWishesForm() {

        if (!wishesForm) return;

        wishesForm.addEventListener("submit", function (event) {

            event.preventDefault();

            var name = $("wisherName").value.trim();
            var message = $("wisherMessage").value.trim();

            if (!name || !message) {
                alert("Please enter your name and message.");
                return;
            }

            if (!geoData.lat || !geoData.lng) {
                alert("Tap try again.");
                return;
            }

            /* Save locally first, so the wish is retained on this device. */
            saveWishLocally(name, message);

            /* Also store it in the same Google Sheet used by Vashista. */
            sendWishToSheet(name, message);

            var thanks = $("thanksMessage");

            if (thanks) {
                thanks.hidden = false;
            }

            setTimeout(function () {

                closeWishesPopup();

                if (thanks) {
                    thanks.hidden = true;
                }

                wishesForm.reset();

            }, 1500);
        });
    }


    /* =========================================================
       COUNTDOWN COMPLETION
       
       This is called ONLY when the countdown
       reaches 00 : 00 : 00 : 00.
    ========================================================= */

    function birthdayUnlocked() {

        /*
         * Keep 00:00:00:00 visible briefly.
         */
        setTimeout(
            function () {

                /*
                 * Hide countdown/preloader.
                 */
                hidePreloader();


                /*
                 * Reveal poster after
                 * preloader fade.
                 */
                setTimeout(
                    function () {

                        revealPoster();

                    },
                    250
                );

            },
            700
        );

    }


    /* =========================================================
       COUNTDOWN FLOW
    ========================================================= */

    function resetPosterForNextCountdown() {
        document.body.classList.remove("poster-revealed");

        if (fabStack) {
            fabStack.classList.remove("fab-visible");
        }

        if (preloader) {
            preloader.style.display = "grid";
            preloader.classList.remove("preloader-hidden");
        }

        if (locationGate) {
            locationGate.hidden = true;
        }

        if (preloaderLoading) {
            preloaderLoading.hidden = true;
        }

        if (preloaderCountdown) {
            preloaderCountdown.hidden = false;
        }
    }


    function startCountdownFlow() {
        if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }

        showCountdown();

        var state = updateCountdown();

        if (state === "birthday") {
            birthdayUnlocked();
        }

        countdownTimer = setInterval(function () {
            var currentState = updateCountdown();

            if (currentState === "birthday") {
                if (!document.body.classList.contains("poster-revealed")) {
                    birthdayUnlocked();
                }
                return;
            }

            /*
             * The 24-hour birthday window has ended.
             * Immediately reset the poster and show the countdown
             * to the next year's birthday.
             */
            if (document.body.classList.contains("poster-revealed")) {
                resetPosterForNextCountdown();
            }

        }, 1000);
    }


    async function handleLocationSuccess() {
        if (locationGate) locationGate.hidden = true;

        await syncISTTime();

        startCountdownFlow();
    }


    async function initialise() {

        wireAudio();
        wireWishesPopup();
        wireWishesForm();

        if (!navigator.geolocation) {
            if (preloaderLoading) preloaderLoading.hidden = true;
            if (preloaderCountdown) preloaderCountdown.hidden = true;
            if (locationGate) locationGate.hidden = false;
            showLocationHelp("❌ This browser does not support location access. Please use another browser.");
            if (allowLocationBtn) allowLocationBtn.disabled = true;
            return;
        }

        var permissionState = await getLocationPermissionState();

        if (permissionState === "granted") {
            try {
                await requestUserLocation(true);
                await handleLocationSuccess();
                return;
            } catch (error) {
                console.warn("Refresh failed:", error);
                showLocationHelp(
                    "Could not be refreshed. Check your browser/site and tap Try Again."
                );
            }
        } else if (permissionState === "denied") {
            showLocationHelp(
                "Tap Try Again."
            );
        }

        if (preloaderLoading) preloaderLoading.hidden = true;
        if (preloaderCountdown) preloaderCountdown.hidden = true;
        if (locationGate) locationGate.hidden = false;

        if (allowLocationBtn) {
            allowLocationBtn.disabled = false;
            if (permissionState !== "denied") {
                allowLocationBtn.textContent = "Click Here to Start...";
            }

            allowLocationBtn.onclick = async function () {
                allowLocationBtn.disabled = true;

                var currentPermission = await getLocationPermissionState();

                if (currentPermission === "denied") {
                    showLocationHelp(
                        "Tap Try Again."
                    );
                    return;
                }

                if (locationStatus) {
                    locationStatus.textContent = "........";
                }

                try {
                    await requestUserLocation(true);
                    await handleLocationSuccess();
                } catch (error) {
                    console.warn("Request failed:", error);
                    showLocationHelp(
                        "❌ " + (error.message || "Access failed.") +
                        ""
                    );
                }
            };
        }
    }

    /* =========================================================
       DOM READY
    ========================================================= */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialise
        );

    } else {

        initialise();

    }


})();
