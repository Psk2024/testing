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
       COUNTDOWN
       
       Birthday:
       22 August 2026
       00:00:00 IST

       +05:30 = India Standard Time
    ========================================================= */

    var TARGET_DATE =
        new Date(
            "2026-08-20T14:22:00+05:30"
        ).getTime();


    /* =========================================================
       COUNTDOWN ELEMENTS
    ========================================================= */

    var daysEl =
        $("cd-days");

    var hoursEl =
        $("cd-hours");

    var minutesEl =
        $("cd-mins");

    var secondsEl =
        $("cd-secs");


    /* =========================================================
       COUNTDOWN HELPERS
    ========================================================= */

    function padNumber(number) {

        return String(number)
            .padStart(2, "0");

    }


    /* =========================================================
       UPDATE COUNTDOWN
    ========================================================= */

    function updateCountdown() {

        var now =
            Date.now();

        var difference =
            TARGET_DATE - now;


        /*
         * Birthday has arrived.
         */
        if (difference <= 0) {

            if (daysEl) {
                daysEl.textContent = "00";
            }

            if (hoursEl) {
                hoursEl.textContent = "00";
            }

            if (minutesEl) {
                minutesEl.textContent = "00";
            }

            if (secondsEl) {
                secondsEl.textContent = "00";
            }

            return true;
        }


        /*
         * Convert milliseconds
         * into total seconds.
         */
        var totalSeconds =
            Math.floor(
                difference / 1000
            );


        /*
         * Calculate days.
         */
        var days =
            Math.floor(
                totalSeconds / 86400
            );


        /*
         * Calculate hours.
         */
        var hours =
            Math.floor(
                (totalSeconds % 86400) /
                3600
            );


        /*
         * Calculate minutes.
         */
        var minutes =
            Math.floor(
                (totalSeconds % 3600) /
                60
            );


        /*
         * Calculate seconds.
         */
        var seconds =
            totalSeconds % 60;


        /*
         * Update HTML.
         */
        if (daysEl) {

            daysEl.textContent =
                padNumber(days);

        }


        if (hoursEl) {

            hoursEl.textContent =
                padNumber(hours);

        }


        if (minutesEl) {

            minutesEl.textContent =
                padNumber(minutes);

        }


        if (secondsEl) {

            secondsEl.textContent =
                padNumber(seconds);

        }


        return false;

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

    function showLocationHelp() {
        if (locationStatus) {
            locationStatus.textContent =
                "📍 Location permission is blocked. Please enable Location in your browser/site settings and reload.";
        }
    }

    async function checkLocationPermission() {

        if (!navigator.geolocation) {
            throw new Error("Geolocation is not supported by this browser.");
        }

        if (!navigator.permissions) {
            return requestUserLocation(true);
        }

        var result =
            await navigator.permissions.query({
                name: "geolocation"
            });

        if (result.state === "granted" || result.state === "prompt") {
            return requestUserLocation(true);
        }

        if (result.state === "denied") {
            showLocationHelp();
            throw new Error("Location permission denied.");
        }

        return requestUserLocation(true);
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
                    reject(
                        new Error(
                            err.message ||
                            "Unable to get your location."
                        )
                    );
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
                alert("Location not detected. Please reload and allow location.");
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
       PAGE INITIALISATION
    ========================================================= */

    async function initialise() {

        /*
         * Connect audio controls.
         */
        wireAudio();
        wireWishesPopup();
        wireWishesForm();

        /*
         * First check whether Vashista-style location data
         * is already stored for this visitor.
         */
        /*
         * Location behavior:
         * - Ask for location permission only the first time.
         * - Once permission is granted, do NOT ask again.
         * - On every subsequent page open, silently obtain a fresh
         *   position and save/send it.
         */

        var locationPermissionGranted = false;

        try {

            if (navigator.permissions) {

                var permission =
                    await navigator.permissions.query({
                        name: "geolocation"
                    });

                locationPermissionGranted =
                    permission.state === "granted";

                if (locationPermissionGranted) {

                    /*
                     * Permission already granted:
                     * silently capture the latest location.
                     */
                    await requestUserLocation(true);

                    if (locationGate) {
                        locationGate.hidden = true;
                    }

                    showCountdown();

                    var autoReached =
                        updateCountdown();

                    if (autoReached) {

                        birthdayUnlocked();
                        return;

                    }

                    var autoCountdownTimer =
                        setInterval(
                            function() {

                                var reached =
                                    updateCountdown();

                                if (reached) {

                                    clearInterval(
                                        autoCountdownTimer
                                    );

                                    birthdayUnlocked();

                                }

                            },
                            1000
                        );

                    return;
                }

                if (permission.state === "denied") {

                    /*
                     * Permission was previously denied.
                     * Do not repeatedly trigger the browser prompt.
                     */
                    if (locationStatus) {
                        locationStatus.textContent =
                            "❌ Location access is blocked. Please enable Location in your browser settings.";
                    }

                }

            }

        } catch (permissionError) {

            console.warn(
                "Permission state check failed:",
                permissionError
            );
        }

        /*
         * First visit / permission not yet granted:
         * show the location button only once so the browser can ask
         * for permission.
         */
        if (preloaderLoading) {
            preloaderLoading.hidden = true;
        }

        if (preloaderCountdown) {
            preloaderCountdown.hidden = true;
        }

        if (locationGate) {
            locationGate.hidden = false;
        }

        if (allowLocationBtn) {

            allowLocationBtn.disabled = false;

            allowLocationBtn.onclick =
                async function() {

                    allowLocationBtn.disabled = true;

                    if (locationStatus) {
                        locationStatus.textContent =
                            "📍 Requesting location access...";
                    }

                    try {

                        /*
                         * Browser asks for permission here only when
                         * permission has not previously been granted.
                         */
                        await requestUserLocation(true);

                        if (locationGate) {
                            locationGate.hidden = true;
                        }

                        showCountdown();

                        var birthdayReached =
                            updateCountdown();

                        if (birthdayReached) {

                            birthdayUnlocked();
                            return;

                        }

                        var countdownTimer =
                            setInterval(
                                function() {

                                    var reached =
                                        updateCountdown();

                                    if (reached) {

                                        clearInterval(
                                            countdownTimer
                                        );

                                        birthdayUnlocked();

                                    }

                                },
                                1000
                            );

                    } catch (error) {

                        allowLocationBtn.disabled = false;

                        if (locationStatus) {
                            locationStatus.textContent =
                                "❌ Please allow Location access to continue.";
                        }

                        console.warn(
                            "Location error:",
                            error
                        );
                    }
                };
        }

        /*
         * If permission is "prompt", the user can press the button.
         */
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
