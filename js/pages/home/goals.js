export function initGoalsAnimation() {
    var goalsSection = document.querySelector(".goals-section");
    if (!goalsSection) {
        return;
    }

    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var isMobile = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;

    if (reducedMotion) {
        goalsSection.classList.add("in-view");
        return;
    }

    var goalsTransitionTimer = null;
    var setGoalsInViewState = function (inView) {
        var alreadyInView = goalsSection.classList.contains("in-view");
        if (alreadyInView === inView) {
            return;
        }

        goalsSection.classList.toggle("in-view", inView);
        goalsSection.classList.add("is-transitioning");

        if (goalsTransitionTimer) {
            window.clearTimeout(goalsTransitionTimer);
        }

        goalsTransitionTimer = window.setTimeout(function () {
            goalsSection.classList.remove("is-transitioning");
        }, 980);
    };

    if ("IntersectionObserver" in window) {
        var goalsObserver = new IntersectionObserver(
            function (entries) {
                for (var i = 0; i < entries.length; i += 1) {
                    var entry = entries[i];
                    var inView = entry.isIntersecting && entry.intersectionRatio >= (isMobile ? 0.24 : 0.5);

                    // Mobile: reveal once to avoid flicker/jitter from frequent viewport changes.
                    if (isMobile) {
                        if (inView) {
                            setGoalsInViewState(true);
                            goalsObserver.unobserve(entry.target);
                        }
                        continue;
                    }

                    setGoalsInViewState(inView);
                }
            },
            {
                root: null,
                rootMargin: isMobile ? "0px 0px -10% 0px" : "0px 0px -22% 0px",
                threshold: isMobile ? [0, 0.15, 0.24, 0.35] : [0, 0.35, 0.5, 0.65]
            }
        );

        goalsObserver.observe(goalsSection);
        return;
    }

    var goalsTicking = false;
    var onGoalsScroll = function () {
        if (goalsTicking) {
            return;
        }

        goalsTicking = true;
        window.requestAnimationFrame(function () {
            var rect = goalsSection.getBoundingClientRect();
            var vh = window.innerHeight || document.documentElement.clientHeight;
            var visible = isMobile
                ? rect.top < vh * 0.82 && rect.bottom > vh * 0.2
                : rect.top < vh * 0.6 && rect.bottom > vh * 0.46;
            setGoalsInViewState(visible);
            goalsTicking = false;
        });
    };

    window.addEventListener("scroll", onGoalsScroll, { passive: true });
    window.addEventListener("resize", onGoalsScroll);
    onGoalsScroll();
}
