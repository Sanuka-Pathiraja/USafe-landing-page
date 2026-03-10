(function () {
    "use strict";

    var root = document.documentElement;
    var FILL_DURATION = 2200;
    var RADIUS = 88;
    var CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    var REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var CURTAIN_TOTAL_DURATION = REDUCED_MOTION ? 300 : 1200;

    var splashMarkup = [
        '<div id="home-splash" role="dialog" aria-modal="true" aria-label="Tap SOS to activate USafe">',
        '  <div id="home-splash-curtain" aria-hidden="true">',
        '    <div id="home-splash-curtain-overlay"></div>',
        "  </div>",
        '  <div id="home-splash-wordmark" aria-hidden="true">USafe</div>',
        '  <div id="home-splash-status" aria-hidden="true">',
        '    <span class="home-splash-live-dot"></span>',
        '    <span id="home-splash-status-text">Standby - Awaiting Activation</span>',
        "  </div>",
        '  <div id="home-splash-control" aria-hidden="true">',
        '    <span id="home-splash-top-label">Your AI Guardian is Ready</span>',
        '    <div id="home-splash-ring-wrap">',
        '      <span class="home-splash-pulse-ring" aria-hidden="true"></span>',
        '      <span class="home-splash-pulse-ring" aria-hidden="true"></span>',
        '      <span class="home-splash-pulse-ring" aria-hidden="true"></span>',
        '      <svg id="home-splash-ring-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
        '        <circle id="home-splash-ring-track" cx="100" cy="100" r="88" stroke-width="2"></circle>',
        '        <circle id="home-splash-ring-progress" cx="100" cy="100" r="88" stroke-width="4"></circle>',
        "      </svg>",
        '      <button id="home-splash-btn" aria-label="Tap to activate USafe guardian" tabindex="0">',
        '        <span id="home-splash-btn-text">SOS</span>',
        '        <span id="home-splash-btn-tap">Tap to Activate</span>',
        '        <span id="home-splash-btn-active" aria-live="polite">Activating</span>',
        "      </button>",
        "    </div>",
        '    <span id="home-splash-hint">Tap once - intelligent protection activates instantly</span>',
        "  </div>",
        '  <div id="home-splash-bottom" aria-hidden="true">',
        '    <div class="home-splash-stat">',
        '      <div class="home-splash-stat-num">Your Area is <span class="home-splash-safe-word">Safe</span></div>',
        '      <div class="home-splash-stat-label">Live Status</div>',
        "    </div>",
        '    <div class="home-splash-stat right">',
        '      <div class="home-splash-stat-num">1.0</div>',
        '      <div class="home-splash-stat-label">Current Build</div>',
        "    </div>",
        "  </div>",
        "</div>"
    ].join("");

    function isFullReload() {
        if (window.performance && typeof window.performance.getEntriesByType === "function") {
            var navEntries = window.performance.getEntriesByType("navigation");
            if (navEntries && navEntries.length) {
                return navEntries[0].type === "reload";
            }
        }

        // Legacy fallback.
        if (window.performance && window.performance.navigation) {
            return window.performance.navigation.type === 1;
        }

        return false;
    }

    function initHomeSplash() {
        var lockedScrollY = 0;

        function lockPageScroll(body) {
            lockedScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
            root.classList.add("home-splash-active");
            body.classList.add("home-splash-lock");
            body.style.position = "fixed";
            body.style.top = "-" + String(lockedScrollY) + "px";
            body.style.left = "0";
            body.style.right = "0";
            body.style.width = "100%";
        }

        function unlockPageScroll(body) {
            var top = body.style.top;
            var restoreY = lockedScrollY;

            body.style.position = "";
            body.style.top = "";
            body.style.left = "";
            body.style.right = "";
            body.style.width = "";
            body.classList.remove("home-splash-lock");
            root.classList.remove("home-splash-active");

            if (top) {
                var parsedTop = parseInt(top, 10);
                if (!Number.isNaN(parsedTop)) {
                    restoreY = Math.abs(parsedTop);
                }
            }

            window.scrollTo(0, restoreY);
        }

        function clearPendingSplashPaint() {
            root.classList.remove("home-splash-pending");
        }

        if (document.body.getAttribute("data-page") !== "home") {
            clearPendingSplashPaint();
            return;
        }

        // Show splash only on explicit full refresh of the home page.
        if (!isFullReload()) {
            clearPendingSplashPaint();
            return;
        }

        if (document.getElementById("home-splash")) {
            clearPendingSplashPaint();
            return;
        }

        var body = document.body;
        lockPageScroll(body);
        body.classList.add("home-nav-ready");
        body.classList.add("home-hero-seq");
        body.classList.remove("home-nav-show");
        body.classList.remove("home-hero-button-show");
        body.insertAdjacentHTML("afterbegin", splashMarkup);
        clearPendingSplashPaint();

        var splash = document.getElementById("home-splash");
        var control = document.getElementById("home-splash-control");
        var button = document.getElementById("home-splash-btn");
        var ringProgress = document.getElementById("home-splash-ring-progress");
        var statusText = document.getElementById("home-splash-status-text");

        var activated = false;
        var completed = false;

        ringProgress.style.strokeDasharray = String(CIRCUMFERENCE);
        ringProgress.style.strokeDashoffset = String(CIRCUMFERENCE);
        ringProgress.classList.add("idle");

        var onComplete = function () {
            if (completed) {
                return;
            }
            completed = true;
            statusText.textContent = "USafe Active - Protection Channel Ready";

            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    splash.classList.add("revealing");

                    window.setTimeout(function () {
                        splash.classList.add("done");
                        splash.setAttribute("aria-hidden", "true");
                        unlockPageScroll(body);
                        requestAnimationFrame(function () {
                            body.classList.add("home-nav-show");

                            // Reveal button after heading reveal settles.
                            window.setTimeout(function () {
                                body.classList.add("home-hero-button-show");
                            }, REDUCED_MOTION ? 180 : 760);
                        });
                        window.setTimeout(function () {
                            if (splash && splash.parentNode) {
                                splash.parentNode.removeChild(splash);
                            }
                        }, 250);
                    }, CURTAIN_TOTAL_DURATION);
                });
            });
        };

        var activate = function () {
            if (activated || completed) {
                return;
            }
            activated = true;

            button.classList.add("pressed");
            window.setTimeout(function () {
                button.classList.remove("pressed");
            }, 200);

            statusText.textContent = "AI Guardian Initializing...";
            control.classList.add("filling");

            ringProgress.classList.remove("idle");
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    ringProgress.style.strokeDashoffset = "0";
                });
            });

            window.setTimeout(onComplete, FILL_DURATION + 80);
        };

        button.addEventListener("pointerdown", activate, { passive: true });
        button.addEventListener("keydown", function (event) {
            if (event.key === " " || event.key === "Enter") {
                event.preventDefault();
                activate();
            }
        });

        if (REDUCED_MOTION) {
            button.addEventListener(
                "click",
                function () {
                    if (!completed) {
                        activated = true;
                        ringProgress.classList.remove("idle");
                        ringProgress.style.strokeDashoffset = "0";
                        window.setTimeout(onComplete, 700);
                    }
                },
                { once: true }
            );
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initHomeSplash);
    } else {
        initHomeSplash();
    }
})();
