import { initGoalsAnimation } from "./home/goals.js";
import { initHeroScale } from "./home/hero-scale.js";

function initHeroVideoLoadState() {
    var heroSection = document.querySelector(".hero-section");
    var heroVideo = document.querySelector(".hero-video");

    if (!heroSection || !heroVideo) {
        return;
    }

    var markVideoReady = function () {
        heroSection.classList.add("video-ready");
    };

    if (heroVideo.readyState >= 2) {
        markVideoReady();
        return;
    }

    heroVideo.addEventListener("loadeddata", markVideoReady, { once: true });
    heroVideo.addEventListener("canplay", markVideoReady, { once: true });
}

initGoalsAnimation();
initHeroScale();
initHeroVideoLoadState();


