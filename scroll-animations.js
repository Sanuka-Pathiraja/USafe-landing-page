(function () {
    "use strict";

    var selectors = ".reveal";
    var revealElements = Array.prototype.slice.call(document.querySelectorAll(selectors));
    var goalsSection = document.querySelector(".goals-section");
    var timelineTrack = document.querySelector(".timeline-section .timeline");
    var timelineItems = timelineTrack ? Array.prototype.slice.call(timelineTrack.querySelectorAll(".timeline-item")) : [];
    var heroSection = document.querySelector(".hero-section");
    var heroCopy = document.querySelector(".hero-copy");
    var heroRadar = heroCopy ? heroCopy.querySelector(".hero-title-radar") : null;
    var timelineSceneLayer = document.querySelector(".timeline-bg-scenes");
    var timelineScenes = timelineSceneLayer ? Array.prototype.slice.call(timelineSceneLayer.querySelectorAll(".timeline-bg-scene")) : [];
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

    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion && revealElements.length) {
        for (var i = 0; i < revealElements.length; i += 1) {
            revealElements[i].classList.add("show");
        }
    }

    var goalsTransitionTimer = null;
    var setGoalsInViewState = function (inView) {
        if (!goalsSection) {
            return;
        }

        var alreadyInView = goalsSection.classList.contains("in-view");
        if (alreadyInView === inView) {
            return;
        }

        goalsSection.classList.toggle("in-view", inView);
        goalsSection.classList.add("is-transitioning");

        if (goalsTransitionTimer) {
            window.clearTimeout(goalsTransitionTimer);
        }

        // Keep this aligned with goals animation duration + stagger.
        goalsTransitionTimer = window.setTimeout(function () {
            goalsSection.classList.remove("is-transitioning");
        }, 980);
    };

    if (goalsSection && reducedMotion) {
        goalsSection.classList.add("in-view");
    }

    // Hero scroll-scale: subtle cinematic growth while scrolling through hero.
    if (heroSection && heroCopy && !reducedMotion) {
        var heroScaleTicking = false;
        var heroScaleRunning = false;
        var heroRadarScrollTimer = null;
        var heroCurrentTitleScale = 1;
        var heroCurrentSubtitleScale = 1;
        var heroTargetTitleScale = 1;
        var heroTargetSubtitleScale = 1;
        var heroCurrentRadarStartScale = 0.35;
        var heroCurrentRadarEndScale = 1.25;
        var heroTargetRadarStartScale = 0.35;
        var heroTargetRadarEndScale = 1.25;
        var heroCurrentRadarFieldScale = 1.43;
        var heroTargetRadarFieldScale = 1.43;
        var HERO_MAX_TITLE_SCALE = 2.08; // Title scale intensity.
        var HERO_MAX_SUBTITLE_SCALE = 1.12; // Subtitle scale intensity (keep lower).
        var HERO_MAX_RADAR_BOOST = 3.4; // 4x stronger scroll-linked radar expansion.
        var HERO_SMOOTHING = 0.18; // Tune easing/smoothing (higher = more responsive)

        var updateHeroScaleTarget = function () {
            var rect = heroSection.getBoundingClientRect();
            var vh = window.innerHeight || document.documentElement.clientHeight;
            var scrolled = Math.max(0, -rect.top);
            var curveDistance = vh * 0.95 + rect.height * 0.5; // Tune how long scaling keeps evolving.

            // Asymptotic curve avoids a hard "stop" feeling at a fixed scroll point.
            var eased = 1 - Math.exp(-scrolled / Math.max(curveDistance, 1));
            heroTargetTitleScale = 1 + (HERO_MAX_TITLE_SCALE - 1) * eased;
            heroTargetSubtitleScale = 1 + (HERO_MAX_SUBTITLE_SCALE - 1) * eased;
            heroTargetRadarStartScale = 0.35 + HERO_MAX_RADAR_BOOST * 0.18 * eased;
            heroTargetRadarEndScale = 1.25 + HERO_MAX_RADAR_BOOST * eased;
            heroTargetRadarFieldScale = heroTargetRadarEndScale + 0.18;
        };

        var animateHeroScale = function () {
            heroCurrentTitleScale += (heroTargetTitleScale - heroCurrentTitleScale) * HERO_SMOOTHING;
            heroCurrentSubtitleScale += (heroTargetSubtitleScale - heroCurrentSubtitleScale) * HERO_SMOOTHING;
            heroCurrentRadarStartScale += (heroTargetRadarStartScale - heroCurrentRadarStartScale) * HERO_SMOOTHING;
            heroCurrentRadarEndScale += (heroTargetRadarEndScale - heroCurrentRadarEndScale) * HERO_SMOOTHING;
            heroCurrentRadarFieldScale += (heroTargetRadarFieldScale - heroCurrentRadarFieldScale) * HERO_SMOOTHING;

            heroCopy.style.setProperty("--hero-title-scale", heroCurrentTitleScale.toFixed(4));
            heroCopy.style.setProperty("--hero-subtitle-scale", heroCurrentSubtitleScale.toFixed(4));
            if (heroRadar) {
                heroRadar.style.setProperty("--radar-start-scale", heroCurrentRadarStartScale.toFixed(4));
                heroRadar.style.setProperty("--radar-end-scale", heroCurrentRadarEndScale.toFixed(4));
                heroRadar.style.setProperty("--radar-field-scale", heroCurrentRadarFieldScale.toFixed(4));
            }

            if (
                Math.abs(heroTargetTitleScale - heroCurrentTitleScale) > 0.0006 ||
                Math.abs(heroTargetSubtitleScale - heroCurrentSubtitleScale) > 0.0006 ||
                Math.abs(heroTargetRadarStartScale - heroCurrentRadarStartScale) > 0.0006 ||
                Math.abs(heroTargetRadarEndScale - heroCurrentRadarEndScale) > 0.0006 ||
                Math.abs(heroTargetRadarFieldScale - heroCurrentRadarFieldScale) > 0.0006
            ) {
                window.requestAnimationFrame(animateHeroScale);
                return;
            }
            heroScaleRunning = false;
        };

        var onHeroScaleScroll = function () {
            if (heroRadar) {
                heroRadar.classList.add("is-scrolling");
                if (heroRadarScrollTimer) {
                    window.clearTimeout(heroRadarScrollTimer);
                }
                heroRadarScrollTimer = window.setTimeout(function () {
                    heroRadar.classList.remove("is-scrolling");
                }, 220);
            }

            if (heroScaleTicking) {
                return;
            }
            heroScaleTicking = true;
            window.requestAnimationFrame(function () {
                updateHeroScaleTarget();
                if (!heroScaleRunning) {
                    heroScaleRunning = true;
                    window.requestAnimationFrame(animateHeroScale);
                }
                heroScaleTicking = false;
            });
        };

        window.addEventListener("scroll", onHeroScaleScroll, { passive: true });
        window.addEventListener("resize", onHeroScaleScroll);
        onHeroScaleScroll();
    }

    // Timeline guided-story states (inactive -> active -> complete).
    if (timelineTrack && timelineItems.length && reducedMotion) {
        for (var r = 0; r < timelineItems.length; r += 1) {
            timelineItems[r].classList.remove("is-active");
            timelineItems[r].classList.add("is-complete");
        }
        for (var rm = 0; rm < timelineScenes.length; rm += 1) {
            timelineScenes[rm].classList.remove("is-active");
            timelineScenes[rm].classList.remove("is-exiting");
        }
        var lastItem = timelineItems[timelineItems.length - 1];
        var lastDotOffset = lastItem.offsetTop + lastItem.offsetHeight / 2;
        timelineTrack.style.setProperty("--timeline-progress", lastDotOffset + "px");
    }

    if (revealElements.length && !reducedMotion && "IntersectionObserver" in window) {
        var observer = new IntersectionObserver(
            function (entries) {
                for (var j = 0; j < entries.length; j += 1) {
                    var entry = entries[j];
                    if (entry.isIntersecting) {
                        entry.target.classList.add("show");
                    } else {
                        // Allow replay when user scrolls away and comes back.
                        entry.target.classList.remove("show");
                    }
                }
            },
            {
                root: null,
                rootMargin: "0px 0px -10% 0px",
                threshold: 0.12
            }
        );

        for (var k = 0; k < revealElements.length; k += 1) {
            observer.observe(revealElements[k]);
        }

    } else if (revealElements.length && !reducedMotion) {
        // Lightweight fallback for very old browsers.
        var revealTicking = false;
        var onRevealScroll = function () {
            if (revealTicking) {
                return;
            }
            revealTicking = true;

            window.requestAnimationFrame(function () {
                var vh = window.innerHeight || document.documentElement.clientHeight;
                for (var m = 0; m < revealElements.length; m += 1) {
                    var rect = revealElements[m].getBoundingClientRect();
                    var visible = rect.top < vh * 0.9 && rect.bottom > vh * 0.1;
                    revealElements[m].classList.toggle("show", visible);
                }
                revealTicking = false;
            });
        };

        window.addEventListener("scroll", onRevealScroll, { passive: true });
        window.addEventListener("resize", onRevealScroll);
        onRevealScroll();
    }

    // Goals section side-panel controller.
    if (goalsSection && !reducedMotion && "IntersectionObserver" in window) {
        var goalsObserver = new IntersectionObserver(
            function (entries) {
                for (var n = 0; n < entries.length; n += 1) {
                    var goalsEntry = entries[n];
                    // Increase/decrease threshold to trigger earlier/later.
                    // Trigger later so side-entry is visible when user reaches cards.
                    var inView = goalsEntry.isIntersecting && goalsEntry.intersectionRatio >= 0.5;
                    setGoalsInViewState(inView);
                }
            },
            {
                root: null,
                // Tune rootMargin/threshold for when panel slide begins/ends.
                rootMargin: "0px 0px -22% 0px",
                threshold: [0, 0.35, 0.5, 0.65]
            }
        );

        goalsObserver.observe(goalsSection);
    } else if (goalsSection && !reducedMotion) {
        var goalsTicking = false;
        var onGoalsScroll = function () {
            if (goalsTicking) {
                return;
            }
            goalsTicking = true;

            window.requestAnimationFrame(function () {
                var rect = goalsSection.getBoundingClientRect();
                var vh = window.innerHeight || document.documentElement.clientHeight;
                var visible = rect.top < vh * 0.6 && rect.bottom > vh * 0.46;
                setGoalsInViewState(visible);
                goalsTicking = false;
            });
        };

        window.addEventListener("scroll", onGoalsScroll, { passive: true });
        window.addEventListener("resize", onGoalsScroll);
        onGoalsScroll();
    }

    if (timelineTrack && timelineItems.length && !reducedMotion) {
        var timelineActiveIndex = -99;
        var timelineRafPending = false;
        var lastViewportY = window.scrollY || window.pageYOffset || 0;

        var getDotOffset = function (index) {
            if (index < 0) {
                return 0;
            }
            if (index >= timelineItems.length) {
                index = timelineItems.length - 1;
            }
            // Dot center follows each row center in current CSS.
            return timelineItems[index].offsetTop + timelineItems[index].offsetHeight / 2;
        };

        var setTimelineState = function (index) {
            if (index === timelineActiveIndex) {
                return;
            }
            timelineActiveIndex = index;

            for (var s = 0; s < timelineItems.length; s += 1) {
                var item = timelineItems[s];
                var isActive = index >= 0 && index < timelineItems.length && s === index;
                var isComplete = s < index;

                item.classList.toggle("is-active", isActive);
                item.classList.toggle("is-complete", isComplete);
            }

            timelineTrack.style.setProperty("--timeline-progress", getDotOffset(index) + "px");
            setTimelineScene(index);
        };

        var evaluateTimelineState = function () {
            var vh = window.innerHeight || document.documentElement.clientHeight;
            // Center-driven activation: active step should align around viewport middle.
            var focusY = vh * 0.5;
            var bestIndex = -1;
            var bestScore = -9999;
            var currentRect = null;
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

                // Tune score weighting here to bias visibility vs center proximity.
                var score = ratio * 2.2 - centerDistance / vh;
                if (ratio > 0.03 && score > bestScore) {
                    bestScore = score;
                    bestIndex = t;
                }
            }

            // Stability guard: keep current step while still reasonably visible.
            if (timelineActiveIndex >= 0 && timelineActiveIndex < timelineItems.length) {
                currentRect = timelineItems[timelineActiveIndex].getBoundingClientRect();
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

            // Ensure one active step while the timeline is on screen.
            if (bestIndex === -1 && trackInViewBand && nearestIndex !== -1) {
                bestIndex = nearestIndex;
            }

            // Prevent visual "skips": advance/reverse one step at a time in view.
            if (
                trackInViewBand &&
                bestIndex !== -1 &&
                timelineActiveIndex >= 0 &&
                timelineActiveIndex < timelineItems.length
            ) {
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
                // Before reaching timeline: nothing active/completed.
                setTimelineState(-1);
                lastViewportY = currentViewportY;
                return;
            }

            if (trackRect.bottom < vh * 0.25) {
                // After passing timeline: all steps completed.
                setTimelineState(timelineItems.length);
                lastViewportY = currentViewportY;
                return;
            }

            lastViewportY = currentViewportY;
        };

        if ("IntersectionObserver" in window) {
            var timelineTicking = false;
            var onTimelineScroll = function () {
                if (timelineTicking) {
                    return;
                }
                timelineTicking = true;
                window.requestAnimationFrame(function () {
                    evaluateTimelineState();
                    timelineTicking = false;
                });
            };

            var timelineObserver = new IntersectionObserver(
                function () {
                    if (timelineRafPending) {
                        return;
                    }
                    timelineRafPending = true;
                    window.requestAnimationFrame(function () {
                        evaluateTimelineState();
                        timelineRafPending = false;
                    });
                },
                {
                    root: null,
                    // Tune when steps switch: top/bottom margins + thresholds.
                    rootMargin: "-12% 0px -40% 0px",
                    threshold: [0, 0.15, 0.35, 0.55, 0.8]
                }
            );

            for (var u = 0; u < timelineItems.length; u += 1) {
                timelineObserver.observe(timelineItems[u]);
            }
            timelineObserver.observe(timelineTrack);
            window.addEventListener("scroll", onTimelineScroll, { passive: true });
            window.addEventListener("resize", onTimelineScroll);
            evaluateTimelineState();
        } else {
            var timelineFallbackTicking = false;
            var onTimelineScroll = function () {
                if (timelineFallbackTicking) {
                    return;
                }
                timelineFallbackTicking = true;
                window.requestAnimationFrame(function () {
                    evaluateTimelineState();
                    timelineFallbackTicking = false;
                });
            };

            window.addEventListener("scroll", onTimelineScroll, { passive: true });
            window.addEventListener("resize", onTimelineScroll);
            onTimelineScroll();
        }
    }
})();
