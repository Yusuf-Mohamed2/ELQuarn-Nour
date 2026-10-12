/* =========================================================
   TASMEE-DOCK.JS  —  نور التلاوة
   =========================================================
   التسميع الذكي على الموبايل: شريط ثابت تحت الشاشة بيعرض
   (رقم الآية + تقدّمك + حالة الميكروفون + الغلطة لحد ما
   تتصلّح + أزرار الإعادة والتخطي والإيقاف)، والمصحف بيفضل
   ظاهر فوقه كله، فمش محتاج تطلع فوق تدوّر على الغلط.

   - إضافي بالكامل: بيقرا اللي features.js بيرسمه (العناصر
     ntTasmeeStatus / ntTasmeeProg / .nt-error-card) وبيعرضه
     في الشريط، وأزراره بتضغط على الأزرار الأصلية.
   - شغّال في وضع الصندوق المنزلق وفي صفحة التسميع.
   - على الموبايل بس (عرض 650px أو أقل). لازم يتحمّل بعد
     features.js و pages.js.
========================================================= */

(function () {

    "use strict";

    var mq = window.matchMedia("(max-width: 650px)");

    var dock = null;
    var on = false;
    var minimized = false;
    var signature = "";

    var chipEl = null;
    var progEl = null;
    var statusEl = null;
    var errorEl = null;
    var minBtn = null;


    function build() {

        dock = document.createElement("div");

        dock.id = "ntTasmeeDock";
        dock.className = "nt-td";
        dock.hidden = true;

        dock.innerHTML =
            '<div class="nt-td-bar">' +
                '<span class="nt-td-chip"></span>' +
                '<div class="nt-td-prog"><i></i></div>' +
                '<button type="button" class="nt-td-min" data-td="min" aria-label="تصغير">▾</button>' +
            "</div>" +
            '<div class="nt-td-status"></div>' +
            '<div class="nt-td-error" hidden></div>' +
            '<div class="nt-td-actions">' +
                '<button type="button" data-td="ntTasmeeRetry"><b>🔁</b><span>إعادة</span></button>' +
                '<button type="button" data-td="ntTasmeeSkipWord"><b>↪️</b><span>كلمة</span></button>' +
                '<button type="button" data-td="ntTasmeeSkip"><b>⏭️</b><span>آية</span></button>' +
                '<button type="button" data-td="ntTasmeeStop" class="is-stop"><b>⏹️</b><span>إيقاف</span></button>' +
            "</div>";

        document.body.appendChild(dock);

        chipEl = dock.querySelector(".nt-td-chip");
        progEl = dock.querySelector(".nt-td-prog i");
        statusEl = dock.querySelector(".nt-td-status");
        errorEl = dock.querySelector(".nt-td-error");
        minBtn = dock.querySelector(".nt-td-min");

        dock.addEventListener("click", function (event) {

            var btn = event.target.closest("[data-td]");

            if (!btn) {
                return;
            }

            var key = btn.getAttribute("data-td");

            if (key === "min") {

                minimized = !minimized;

                applyMin();
                measure();

                return;

            }

            /* بنضغط على الزرار الأصلي (حتى لو مخفي) عشان كل المنطق يفضل في features.js */
            var original = document.getElementById(key);

            if (original) {
                original.click();
            }

            signature = "";

        });

    }

    function applyMin() {

        dock.classList.toggle("is-min", minimized);
        minBtn.textContent = minimized ? "▴" : "▾";
        minBtn.setAttribute("aria-label", minimized ? "تكبير" : "تصغير");

    }

    /* هل شاشة التسميع شغّالة وظاهرة دلوقتي؟ */
    function liveStatus() {

        var status = document.getElementById("ntTasmeeStatus");
        var words = document.getElementById("ntTasmeeWords");

        if (!status || !words) {
            return null;
        }

        var sheet = status.closest(".nt-sheet-backdrop");

        if (sheet) {
            return sheet.classList.contains("nt-open") ? status : null;
        }

        /* صفحة التسميع: ظاهرة لو كارت الكلمات ظاهر */
        return words.getClientRects().length ? status : null;

    }

    function measure() {

        if (!dock || dock.hidden) {
            return;
        }

        document.documentElement.style.setProperty("--nt-td-h", dock.offsetHeight + "px");

    }

    function show() {

        if (on) {
            return;
        }

        on = true;

        dock.hidden = false;
        document.body.classList.add("nt-td-on");

    }

    function hide() {

        if (!on) {
            return;
        }

        on = false;
        signature = "";

        dock.hidden = true;
        document.body.classList.remove("nt-td-on");
        document.documentElement.style.removeProperty("--nt-td-h");

    }

    function tick() {

        if (document.hidden) {
            return;
        }

        var status = mq.matches ? liveStatus() : null;

        if (!status) {

            hide();

            return;

        }

        var card = status.closest(".nt-card");
        var host = card ? card.parentNode : null;

        var strong = card ? card.querySelector("strong") : null;
        var chip = card ? card.querySelector(".nt-chip") : null;
        var prog = document.getElementById("ntTasmeeProg");
        var err = host ? host.querySelector(".nt-error-card") : null;

        var chipText = ((strong ? strong.textContent.trim() : "") +
            (chip ? " · " + chip.textContent.trim() : ""));
        var width = prog ? prog.style.width : "0%";
        var statusText = status.textContent.replace(/\s+/g, " ").trim();
        var isError = status.classList.contains("nt-tasmee-error");
        var errHtml = err ? err.innerHTML : "";

        var next = [chipText, width, statusText, isError, errHtml].join("\u0001");

        show();

        if (next === signature) {
            return;
        }

        signature = next;

        chipEl.textContent = chipText;
        progEl.style.width = width;
        statusEl.textContent = statusText;
        statusEl.classList.toggle("is-error", isError);

        errorEl.innerHTML = "";

        if (err) {

            var copy = err.cloneNode(true);

            copy.className = "nt-td-err";

            /* جملة "التنبيه هيفضل قدامك" مش محتاجينها في الشريط */
            var notes = copy.querySelectorAll(".nt-muted");
            var last = notes[notes.length - 1];

            if (last && last.textContent.indexOf("هيفضل") !== -1) {
                last.remove();
            }

            errorEl.appendChild(copy);
            errorEl.hidden = false;

        } else {

            errorEl.hidden = true;

        }

        applyMin();
        measure();

    }

    function init() {

        build();

        setInterval(tick, 250);

        window.addEventListener("resize", measure);
        window.addEventListener("orientationchange", measure);

        if (mq.addEventListener) {
            mq.addEventListener("change", tick);
        }

    }

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", init);

    } else {

        init();

    }

})();