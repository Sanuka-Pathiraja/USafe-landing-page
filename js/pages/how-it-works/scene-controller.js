export function createTimelineSceneController(timelineScenes) {
    var activeTimelineScene = -1;
    var timelineSceneExitTimers = [];

    function setTimelineScene(index) {
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
    }

    function destroy() {
        for (var i = 0; i < timelineSceneExitTimers.length; i += 1) {
            if (timelineSceneExitTimers[i]) {
                window.clearTimeout(timelineSceneExitTimers[i]);
            }
        }

        for (var s = 0; s < timelineScenes.length; s += 1) {
            timelineScenes[s].classList.remove("is-active");
            timelineScenes[s].classList.remove("is-exiting");
        }

        activeTimelineScene = -1;
    }

    return {
        setTimelineScene: setTimelineScene,
        destroy: destroy
    };
}
