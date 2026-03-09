export function initHeroScale() {
    var heroSection = document.querySelector(".hero-section");
    var heroCopy = document.querySelector(".hero-copy");
    var heroRadar = heroCopy ? heroCopy.querySelector(".hero-title-radar") : null;

    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;

    // Disable heavy hero scroll-scaling on mobile to prevent nav/menu jank.
    if (!heroSection || !heroCopy || reducedMotion || isMobile) {
        return;
    }

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
    var HERO_MAX_TITLE_SCALE = 2.08;
    var HERO_MAX_SUBTITLE_SCALE = 1.12;
    var HERO_MAX_RADAR_BOOST = 3.4;
    var HERO_SMOOTHING = 0.18;

    var updateHeroScaleTarget = function () {
        var rect = heroSection.getBoundingClientRect();
        var vh = window.innerHeight || document.documentElement.clientHeight;
        var scrolled = Math.max(0, -rect.top);
        var curveDistance = vh * 0.95 + rect.height * 0.5;

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
