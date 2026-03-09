import { createTimelineSceneController } from "./scene-controller.js";

export function initTimelineController() {
    var timelineTrack = document.querySelector(".timeline-section .timeline");
    var timelineItems = timelineTrack ? Array.prototype.slice.call(timelineTrack.querySelectorAll(".timeline-item")) : [];
    var timelineSceneLayer = document.querySelector(".timeline-bg-scenes");
    var timelineScenes = timelineSceneLayer ? Array.prototype.slice.call(timelineSceneLayer.querySelectorAll(".timeline-bg-scene")) : [];

    if (!timelineTrack || !timelineItems.length) {
        return function () {};
    }

    var sceneController = createTimelineSceneController(timelineScenes);
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var timelineObserver = null;
    var timelineRafPending = false;
    var rafId = 0;
    var timelineActiveIndex = -99;
    var lastViewportY = window.scrollY || window.pageYOffset || 0;

    function getDotOffset(index) {
        if (index < 0) {
            return 0;
        }
        if (index >= timelineItems.length) {
            index = timelineItems.length - 1;
        }
        return timelineItems[index].offsetTop + timelineItems[index].offsetHeight / 2;
    }

    function setTimelineState(index) {
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
        sceneController.setTimelineScene(index);
    }

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

        return function () {
            sceneController.destroy();
        };
    }

    function evaluateTimelineState() {
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
    }

    function onTimelineScroll() {
        if (timelineRafPending) {
            return;
        }

        timelineRafPending = true;
        rafId = window.requestAnimationFrame(function () {
            evaluateTimelineState();
            timelineRafPending = false;
        });
    }

    if ("IntersectionObserver" in window) {
        timelineObserver = new IntersectionObserver(
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

    return function destroyTimelineController() {
        window.removeEventListener("scroll", onTimelineScroll);
        window.removeEventListener("resize", onTimelineScroll);
        if (timelineObserver) {
            timelineObserver.disconnect();
        }
        if (rafId) {
            window.cancelAnimationFrame(rafId);
        }
        timelineRafPending = false;
        sceneController.destroy();
    };
}
