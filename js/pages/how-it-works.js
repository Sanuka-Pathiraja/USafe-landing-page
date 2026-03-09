(function () {
    "use strict";

    var timelineTrack = document.querySelector(".timeline-section .timeline");
    var timelineItems = timelineTrack ? Array.prototype.slice.call(timelineTrack.querySelectorAll(".timeline-item")) : [];
    var timelineSceneLayer = document.querySelector(".timeline-bg-scenes");
    var timelineScenes = timelineSceneLayer ? Array.prototype.slice.call(timelineSceneLayer.querySelectorAll(".timeline-bg-scene")) : [];

    if (!timelineTrack || !timelineItems.length) {
        return;
    }

    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var activeTimelineScene = -1;
    var timelineSceneExitTimers = [];

    var setTimelineScene = function (index) {
        if (!timelineScenes.length) {
            return;
        }

        var target = index >= 0 && index < timelineScenes.length ? index : -1;
        if (target === activeTimelineScene) {
            return;
        }

        if (activeTimelineScene >= 0) {
            var previous = timelineScenes[activeTimelineScene];
            previous.classList.remove("is-active");
            previous.classList.add("is-exiting");

            if (timelineSceneExitTimers[activeTimelineScene]) {
                window.clearTimeout(timelineSceneExitTimers[activeTimelineScene]);
            }
            timelineSceneExitTimers[activeTimelineScene] = window.setTimeout(function (sceneEl) {
                sceneEl.classList.remove("is-exiting");
            }, 760, previous);
        }

        activeTimelineScene = target;
        if (activeTimelineScene >= 0) {
            timelineScenes[activeTimelineScene].classList.add("is-active");
            timelineScenes[activeTimelineScene].classList.remove("is-exiting");
        }
    };

    var getDotOffset = function (index) {
        if (index < 0) {
            return 0;
        }
        if (index >= timelineItems.length) {
            index = timelineItems.length - 1;
        }
        return timelineItems[index].offsetTop + timelineItems[index].offsetHeight / 2;
    };

    if (reducedMotion) {
        for (var rm = 0; rm < timelineItems.length; rm += 1) {
            timelineItems[rm].classList.remove("is-active");
            timelineItems[rm].classList.add("is-complete");
        }

        for (var s = 0; s < timelineScenes.length; s += 1) {
            timelineScenes[s].classList.remove("is-active");
            timelineScenes[s].classList.remove("is-exiting");
        }

        timelineTrack.style.setProperty("--timeline-progress", getDotOffset(timelineItems.length) + "px");
        return;
    }

    var timelineActiveIndex = -99;
    var timelineRafPending = false;
    var lastViewportY = window.scrollY || window.pageYOffset || 0;

    var setTimelineState = function (index) {
        if (index === timelineActiveIndex) {
            return;
        }

        timelineActiveIndex = index;

        for (var i = 0; i < timelineItems.length; i += 1) {
            var item = timelineItems[i];
            var isActive = index >= 0 && index < timelineItems.length && i === index;
            var isComplete = i < index;

            item.classList.toggle("is-active", isActive);
            item.classList.toggle("is-complete", isComplete);
        }

        timelineTrack.style.setProperty("--timeline-progress", getDotOffset(index) + "px");
        setTimelineScene(index);
    };

    var evaluateTimelineState = function () {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var focusY = vh * 0.5;
        var bestIndex = -1;
        var bestScore = -9999;
        var nearestIndex = -1;
        var nearestDistance = 999999;
        var currentViewportY = window.scrollY || window.pageYOffset || 0;

        for (var t = 0; t < timelineItems.length; t += 1) {
            var rect = timelineItems[t].getBoundingClientRect();
            var visibleTop = Math.max(rect.top, 0);
            var visibleBottom = Math.min(rect.bottom, vh);
            var visibleHeight = Math.max(0, visibleBottom - visibleTop);
            var ratio = visibleHeight / Math.max(rect.height, 1);
            var centerDistance = Math.abs((rect.top + rect.height / 2) - focusY);

            if (centerDistance < nearestDistance) {
                nearestDistance = centerDistance;
                nearestIndex = t;
            }

            var score = ratio * 2.2 - centerDistance / vh;
            if (ratio > 0.03 && score > bestScore) {
                bestScore = score;
                bestIndex = t;
            }
        }

        if (timelineActiveIndex >= 0 && timelineActiveIndex < timelineItems.length) {
            var currentRect = timelineItems[timelineActiveIndex].getBoundingClientRect();
            var currTop = Math.max(currentRect.top, 0);
            var currBottom = Math.min(currentRect.bottom, vh);
            var currRatio = Math.max(0, currBottom - currTop) / Math.max(currentRect.height, 1);
            var currCenterDistance = Math.abs((currentRect.top + currentRect.height / 2) - focusY);
            if (currRatio > 0.18 && currCenterDistance < vh * 0.2) {
                bestIndex = timelineActiveIndex;
            }
        }

        var trackRect = timelineTrack.getBoundingClientRect();
        var trackInViewBand = trackRect.top < vh * 0.82 && trackRect.bottom > vh * 0.2;

        if (bestIndex === -1 && trackInViewBand && nearestIndex !== -1) {
            bestIndex = nearestIndex;
        }

        if (trackInViewBand && bestIndex !== -1 && timelineActiveIndex >= 0 && timelineActiveIndex < timelineItems.length) {
            var diff = bestIndex - timelineActiveIndex;
            if (diff > 1) {
                bestIndex = timelineActiveIndex + 1;
            } else if (diff < -1) {
                bestIndex = timelineActiveIndex - 1;
            } else if (diff !== 0) {
                var scrollingDown = currentViewportY >= lastViewportY;
                if (scrollingDown && diff < 0) {
                    bestIndex = timelineActiveIndex;
                }
                if (!scrollingDown && diff > 0) {
                    bestIndex = timelineActiveIndex;
                }
            }
        }

        if (bestIndex !== -1) {
            setTimelineState(bestIndex);
            lastViewportY = currentViewportY;
            return;
        }

        if (trackRect.top > vh * 0.75) {
            setTimelineState(-1);
            lastViewportY = currentViewportY;
            return;
        }

        if (trackRect.bottom < vh * 0.25) {
            setTimelineState(timelineItems.length);
        }

        lastViewportY = currentViewportY;
    };

    var onTimelineScroll = function () {
        if (timelineRafPending) {
            return;
        }

        timelineRafPending = true;
        window.requestAnimationFrame(function () {
            evaluateTimelineState();
            timelineRafPending = false;
        });
    };

    if ("IntersectionObserver" in window) {
        var timelineObserver = new IntersectionObserver(
            function () {
                onTimelineScroll();
            },
            {
                root: null,
                rootMargin: "-12% 0px -40% 0px",
                threshold: [0, 0.15, 0.35, 0.55, 0.8]
            }
        );

        for (var u = 0; u < timelineItems.length; u += 1) {
            timelineObserver.observe(timelineItems[u]);
        }

        timelineObserver.observe(timelineTrack);
    }

    window.addEventListener("scroll", onTimelineScroll, { passive: true });
    window.addEventListener("resize", onTimelineScroll);
    onTimelineScroll();
})();
