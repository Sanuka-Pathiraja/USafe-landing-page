import { initTimelineController } from "./how-it-works/timeline-controller.js";
import { initMobileTimeline } from "./how-it-works/mobile-timeline.js";

// Breakpoint used to separate systems:
// desktop timeline controller: > 768px
// mobile timeline controller: <= 768px
var mobileQuery = window.matchMedia("(max-width: 768px)");
var destroyActiveController = function () {};

function mountController() {
    destroyActiveController();

    if (mobileQuery.matches) {
        destroyActiveController = initMobileTimeline();
    } else {
        destroyActiveController = initTimelineController();
    }

    if (typeof destroyActiveController !== "function") {
        destroyActiveController = function () {};
    }
}

mountController();

function onBreakpointChange() {
    // Rebind timeline system when crossing breakpoint without page reload.
    mountController();
}

if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", onBreakpointChange);
} else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(onBreakpointChange);
}
