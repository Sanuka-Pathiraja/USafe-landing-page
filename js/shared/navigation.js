(function () {
    "use strict";

    var menuToggle = document.getElementById("mobile-menu");
    var navList = document.getElementById("nav-list");

    if (menuToggle && navList) {
        menuToggle.addEventListener("click", function () {
            navList.classList.toggle("active");
        });

        var navLinks = document.querySelectorAll(".nav-links a");
        for (var i = 0; i < navLinks.length; i += 1) {
            navLinks[i].addEventListener("click", function () {
                navList.classList.remove("active");
            });
        }
    }

    // Highlights the current page without hardcoding classes in every nav item.
    var currentPage = document.body.getAttribute("data-page");
    if (!currentPage) {
        return;
    }

    var pageLinks = document.querySelectorAll(".nav-links a[data-page]");
    for (var j = 0; j < pageLinks.length; j += 1) {
        var linkPage = pageLinks[j].getAttribute("data-page");
        if (linkPage === currentPage) {
            pageLinks[j].setAttribute("aria-current", "page");
        } else {
            pageLinks[j].removeAttribute("aria-current");
        }
    }
})();
