(function () {
    "use strict";

    var revealElements = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!revealElements.length) {
        return;
    }

    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
        for (var i = 0; i < revealElements.length; i += 1) {
            revealElements[i].classList.add("show");
        }
        return;
    }

    if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(
            function (entries) {
                for (var j = 0; j < entries.length; j += 1) {
                    entries[j].target.classList.toggle("show", entries[j].isIntersecting);
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
        return;
    }

    var ticking = false;
    var onScroll = function () {
        if (ticking) {
            return;
        }
        ticking = true;

        window.requestAnimationFrame(function () {
            var vh = window.innerHeight || document.documentElement.clientHeight;
            for (var m = 0; m < revealElements.length; m += 1) {
                var rect = revealElements[m].getBoundingClientRect();
                var visible = rect.top < vh * 0.9 && rect.bottom > vh * 0.1;
                revealElements[m].classList.toggle("show", visible);
            }
            ticking = false;
        });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
})();
