function callIfFunction(fn, context) {
    if (typeof fn === "function") {
        fn.call(context);
    }
}

function pauseLordIcon(iconEl) {
    var controls = iconEl.playerInstance || iconEl;
    callIfFunction(controls.pause, controls);
    callIfFunction(controls.stop, controls);
    iconEl.setAttribute("trigger", "morph");
}

function playLordIcon(iconEl) {
    var controls = iconEl.playerInstance || iconEl;
    iconEl.setAttribute("trigger", "loop");
    callIfFunction(controls.play, controls);
}

function createMobileProgressUI(sectionContainer, stepCount) {
    var wrapper = document.createElement("div");
    wrapper.className = "timeline-mobile-progress";
    wrapper.innerHTML =
        '<span class="timeline-mobile-progress-label" aria-live="polite"></span>' +
        '<div class="timeline-mobile-progress-track" aria-hidden="true">' +
        '<div class="timeline-mobile-progress-fill"></div>' +
        "</div>";

    sectionContainer.insertBefore(wrapper, sectionContainer.firstChild);

    return {
        wrapper: wrapper,
        label: wrapper.querySelector(".timeline-mobile-progress-label"),
        fill: wrapper.querySelector(".timeline-mobile-progress-fill"),
        stepCount: stepCount
    };
}

function syncMobileIcon(slotIcon, sourceIcon) {
    if (!slotIcon || !sourceIcon) {
        return;
    }

    var attrs = ["src", "state", "colors", "stroke"];
    for (var i = 0; i < attrs.length; i += 1) {
        var value = sourceIcon.getAttribute(attrs[i]);
        if (value) {
            slotIcon.setAttribute(attrs[i], value);
        } else {
            slotIcon.removeAttribute(attrs[i]);
        }
    }

    slotIcon.setAttribute("trigger", "loop");
}

/* Mobile-only controller.
   Breakpoint isolation:
   - This module is initialized only below 768px via matchMedia in page entry.
   - Desktop timeline controller is not executed on mobile. */
export function initMobileTimeline() {
    var section = document.querySelector(".timeline-section");
    var timelineTrack = section ? section.querySelector(".timeline") : null;
    var sectionContainer = section ? section.querySelector(".section-container") : null;
    var timelineItems = timelineTrack ? Array.prototype.slice.call(timelineTrack.querySelectorAll(".timeline-item")) : [];
    var timelineSceneLayer = section ? section.querySelector(".timeline-bg-scenes") : null;
    var timelineScenes = timelineSceneLayer ? Array.prototype.slice.call(timelineSceneLayer.querySelectorAll(".timeline-bg-scene")) : [];

    if (!section || !timelineTrack || !timelineItems.length || !sectionContainer) {
        return function () {};
    }

    document.body.classList.add("mobile-timeline");

    var progressUI = createMobileProgressUI(sectionContainer, timelineItems.length);
    var sceneIcons = timelineScenes.map(function (scene) {
        return scene.querySelector("lord-icon");
    });
    var iconSlot = document.createElement("div");
    iconSlot.className = "timeline-mobile-icon-slot";
    iconSlot.innerHTML = '<lord-icon aria-hidden="true"></lord-icon>';
    var slotIcon = iconSlot.querySelector("lord-icon");

    var activeIndex = -1;
    var rafPending = false;
    var rafId = 0;

    // Active step detection on mobile:
    // We track the step nearest to viewport center and highlight only that step.
    function computeActiveIndex() {
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var targetY = vh * 0.45;
        var bestIndex = 0;
        var bestDistance = Number.POSITIVE_INFINITY;

        for (var i = 0; i < timelineItems.length; i += 1) {
            var rect = timelineItems[i].getBoundingClientRect();
            var centerY = rect.top + rect.height * 0.5;
            var distance = Math.abs(centerY - targetY);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestIndex = i;
            }
        }

        return bestIndex;
    }

    // Lordicon control:
    // Only active scene icon loops. Others are paused/de-emphasized for performance.
    function setActiveIndex(index) {
        if (index === activeIndex) {
            return;
        }

        activeIndex = index;
        for (var i = 0; i < timelineItems.length; i += 1) {
            var isActive = i === activeIndex;
            timelineItems[i].classList.toggle("is-active", isActive);
            timelineItems[i].classList.toggle("is-complete", i < activeIndex);
        }

        for (var s = 0; s < timelineScenes.length; s += 1) {
            timelineScenes[s].classList.remove("is-active");
            timelineScenes[s].classList.toggle("is-exiting", false);

            if (!sceneIcons[s]) {
                continue;
            }

            pauseLordIcon(sceneIcons[s]);
        }

        var activeDetail = timelineItems[activeIndex].querySelector(".timeline-detail");
        if (activeDetail && slotIcon && sceneIcons[activeIndex]) {
            syncMobileIcon(slotIcon, sceneIcons[activeIndex]);
            activeDetail.appendChild(iconSlot);
            playLordIcon(slotIcon);
        }

        // Mobile side-rail progress line:
        // fill to the active step dot center so cards and rail stay visually linked.
        // Mobile rail alignment:
        // The filled line starts at `top: 28px` in mobile CSS.
        // Each dot center also sits at 28px within its item,
        // so the required fill height is exactly the item offset.
        var mobileProgressHeight = timelineItems[activeIndex].offsetTop;
        timelineTrack.style.setProperty("--timeline-progress", mobileProgressHeight + "px");

        var progress = timelineItems.length > 1 ? activeIndex / (timelineItems.length - 1) : 1;
        progressUI.fill.style.transform = "scaleX(" + progress.toFixed(4) + ")";
        progressUI.label.textContent = "Step " + (activeIndex + 1) + " of " + progressUI.stepCount;
    }

    function tick() {
        setActiveIndex(computeActiveIndex());
        rafPending = false;
    }

    function onScroll() {
        if (rafPending) {
            return;
        }
        rafPending = true;
        rafId = window.requestAnimationFrame(tick);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    return function destroyMobileTimeline() {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        if (rafId) {
            window.cancelAnimationFrame(rafId);
        }
        rafPending = false;

        if (progressUI.wrapper && progressUI.wrapper.parentNode) {
            progressUI.wrapper.parentNode.removeChild(progressUI.wrapper);
        }

        document.body.classList.remove("mobile-timeline");

        for (var i = 0; i < timelineItems.length; i += 1) {
            timelineItems[i].classList.remove("is-active");
            timelineItems[i].classList.remove("is-complete");
        }

        for (var s = 0; s < timelineScenes.length; s += 1) {
            timelineScenes[s].classList.remove("is-active");
            timelineScenes[s].classList.remove("is-exiting");
            if (sceneIcons[s]) {
                pauseLordIcon(sceneIcons[s]);
            }
        }

        timelineTrack.style.removeProperty("--timeline-progress");

        if (slotIcon) {
            pauseLordIcon(slotIcon);
        }

        if (iconSlot.parentNode) {
            iconSlot.parentNode.removeChild(iconSlot);
        }
    };
}
