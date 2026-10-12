/* =========================================================
   PICKER-SEARCH.JS  —  نور التلاوة
   =========================================================
   أي قايمة اختيار (select) فيها سور أو قرّاء (30 اختيار أو أكتر)
   بتتحوّل لزرار بيفتح نافذة فيها خانة بحث:
     - السور: بالاسم أو بالرقم (مثلًا "بقرة" أو "2").
     - القرّاء: بالاسم.
   إضافي بالكامل: الـ select الأصلي بيفضل موجود ومخفي، واللي
   بتختاره بيتحط فيه وبيتبعت حدث change، فكل الكود القديم
   (المصحف، التسميع، الورد، وضع الحفظ...) بيشتغل زي ما هو.
   القوايم اللي بتتبني بعد كده (جوه الأدوات مثلًا) بتتحوّل
   لوحدها. لازم يتحمّل بعد باقي السكربتات.
========================================================= */

(function () {

    "use strict";

    var MIN_OPTIONS = 30;

    var overlay = null;
    var input = null;
    var listEl = null;
    var countEl = null;
    var titleEl = null;
    var current = null;
    var currentKind = "generic";
    var scanTimer = null;

    var valueDescriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");


    /* ---------- أدوات ---------- */

    function toWestern(text) {

        return String(text == null ? "" : text).replace(/[٠-٩]/g, function (d) {
            return String(d.charCodeAt(0) - 1632);
        });

    }

    /* من غير تشكيل، وتوحيد الألف والياء والتاء المربوطة */
    function normAr(text) {

        return toWestern(text)
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
            .replace(/[أإآٱ]/g, "ا")
            .replace(/ى/g, "ي")
            .replace(/ة/g, "ه")
            .replace(/ؤ/g, "و")
            .replace(/ئ/g, "ي")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

    }

    function hasLetters(select) {

        var count = 0;

        for (var i = 0; i < select.options.length; i++) {

            if (/[A-Za-z\u0621-\u064A]/.test(select.options[i].textContent)) {
                count++;
            }

        }

        return count >= select.options.length / 2;

    }

    function kindOf(select) {

        var n = select.options.length;
        var numeric = 0;

        for (var i = 0; i < n; i++) {

            if (/^\d+$/.test(select.options[i].value)) {
                numeric++;
            }

        }

        if (n >= 110 && n <= 120 && numeric >= 110) {
            return "surah";
        }

        if (/surah/i.test(select.id || "")) {
            return "surah";
        }

        if (/read|recit/i.test(select.id || "")) {
            return "reader";
        }

        return "generic";

    }

    function placeholderOf(kind) {

        if (kind === "surah") {
            return "ابحث بالسورة (الاسم أو الرقم)";
        }

        if (kind === "reader") {
            return "ابحث باسم القارئ";
        }

        return "ابحث...";

    }

    function titleOf(kind) {

        if (kind === "surah") {
            return "اختار السورة";
        }

        if (kind === "reader") {
            return "اختار القارئ";
        }

        return "اختار";

    }


    /* ---------- الزرار اللي بيحل محل الـ select ---------- */

    function syncButton(select) {

        var btn = select._ntBtn;

        if (!btn) {
            return;
        }

        var option = select.options[select.selectedIndex];
        var text = option ? String(option.textContent).replace(/\s+/g, " ").trim() : "";
        var label = btn.querySelector(".nt-ps-label");

        label.textContent = text || placeholderOf(select._ntKind);
        btn.classList.toggle("is-empty", !option || option.value === "");
        btn.disabled = !!select.disabled;

    }

    function enhance(select) {

        if (select.dataset.ntPs || select.multiple) {
            return;
        }

        if (select.options.length < MIN_OPTIONS || !hasLetters(select)) {
            return;
        }

        select.dataset.ntPs = "1";
        select._ntKind = kindOf(select);

        var btn = document.createElement("button");

        btn.type = "button";
        btn.className = "nt-ps-btn";
        btn.innerHTML =
            '<span class="nt-ps-label"></span>' +
            '<span class="nt-ps-icon" aria-hidden="true">🔍</span>';

        if (select.style.marginTop) {
            btn.style.marginTop = select.style.marginTop;
        }

        select._ntBtn = btn;

        select.classList.add("nt-ps-hidden");
        select.parentNode.insertBefore(btn, select.nextSibling);

        /* لو الكود غيّر القيمة من برّه (select.value = ...) الزرار يتحدّث */
        try {

            Object.defineProperty(select, "value", {
                configurable: true,
                get: function () {
                    return valueDescriptor.get.call(this);
                },
                set: function (v) {
                    valueDescriptor.set.call(this, v);
                    syncButton(this);
                }
            });

        } catch (error) { /* */ }

        select.addEventListener("change", function () {
            syncButton(select);
        });

        new MutationObserver(function () {
            syncButton(select);
        }).observe(select, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["disabled"]
        });

        btn.addEventListener("click", function () {
            openPicker(select);
        });

        syncButton(select);

    }

    function scan() {

        var list = document.querySelectorAll("select:not([data-nt-ps])");

        for (var i = 0; i < list.length; i++) {
            enhance(list[i]);
        }

    }

    function scheduleScan() {

        clearTimeout(scanTimer);
        scanTimer = setTimeout(scan, 200);

    }


    /* ---------- نافذة البحث ---------- */

    function build() {

        overlay = document.createElement("div");

        overlay.className = "nt-ps-overlay";
        overlay.hidden = true;

        overlay.innerHTML =
            '<div class="nt-ps-sheet" role="dialog" aria-modal="true">' +
                '<div class="nt-ps-head">' +
                    '<strong class="nt-ps-title"></strong>' +
                    '<button type="button" class="nt-ps-close" aria-label="إغلاق">×</button>' +
                "</div>" +
                '<input class="nt-ps-input" type="search" autocomplete="off" ' +
                    'autocapitalize="off" spellcheck="false" enterkeyhint="search">' +
                '<div class="nt-ps-count"></div>' +
                '<div class="nt-ps-list"></div>' +
            "</div>";

        document.body.appendChild(overlay);

        input = overlay.querySelector(".nt-ps-input");
        listEl = overlay.querySelector(".nt-ps-list");
        countEl = overlay.querySelector(".nt-ps-count");
        titleEl = overlay.querySelector(".nt-ps-title");

        overlay.addEventListener("click", function (event) {

            if (event.target === overlay || event.target.closest(".nt-ps-close")) {
                closePicker();
                return;
            }

            var item = event.target.closest(".nt-ps-item");

            if (item) {
                pick(Number(item.getAttribute("data-i")));
            }

        });

        input.addEventListener("input", function () {
            render(input.value, false);
        });

        input.addEventListener("keydown", function (event) {

            if (event.key === "Enter") {

                var first = listEl.querySelector(".nt-ps-item");

                if (first) {
                    pick(Number(first.getAttribute("data-i")));
                }

            }

        });

        document.addEventListener("keydown", function (event) {

            if (event.key === "Escape" && overlay && !overlay.hidden) {
                closePicker();
            }

        });

    }

    function matches(option, words, kind, digitsOnly) {

        if (kind === "surah" && option.value === "") {
            return false;
        }

        if (!words.length) {
            return true;
        }

        if (digitsOnly) {
            return String(option.value) === words[0];
        }

        var hay = normAr(option.textContent) + (kind === "surah" ? " " + option.value : "");

        for (var i = 0; i < words.length; i++) {

            if (hay.indexOf(words[i]) === -1) {
                return false;
            }

        }

        return true;

    }

    function render(query, scrollToCurrent) {

        if (!current) {
            return;
        }

        var words = normAr(query).split(" ").filter(Boolean);
        var digitsOnly = false;

        /* رقم لوحده في السور: السورة اللي رقمها كده بالظبط */
        if (currentKind === "surah" && words.length === 1 && /^\d+$/.test(words[0])) {

            for (var k = 0; k < current.options.length; k++) {

                if (String(current.options[k].value) === words[0]) {
                    digitsOnly = true;
                    break;
                }

            }

        }

        var frag = document.createDocumentFragment();
        var shown = 0;
        var selected = current.selectedIndex;

        for (var i = 0; i < current.options.length; i++) {

            var option = current.options[i];

            if (!matches(option, words, currentKind, digitsOnly)) {
                continue;
            }

            var btn = document.createElement("button");

            btn.type = "button";
            btn.className = "nt-ps-item" + (i === selected ? " is-current" : "");
            btn.setAttribute("data-i", String(i));
            btn.textContent = String(option.textContent).replace(/\s+/g, " ").trim();

            frag.appendChild(btn);
            shown++;

        }

        listEl.innerHTML = "";

        if (!shown) {

            var empty = document.createElement("div");

            empty.className = "nt-ps-empty";
            empty.textContent = "مفيش نتيجة، جرّب كلمة تانية";

            listEl.appendChild(empty);

        } else {

            listEl.appendChild(frag);

        }

        countEl.textContent = shown + " نتيجة";

        if (scrollToCurrent) {

            var cur = listEl.querySelector(".is-current");

            if (cur && cur.scrollIntoView) {
                cur.scrollIntoView({ block: "center" });
            }

        } else {
            listEl.scrollTop = 0;
        }

    }

    function openPicker(select) {

        if (!overlay) {
            build();
        }

        current = select;
        currentKind = select._ntKind || "generic";

        titleEl.textContent = titleOf(currentKind);
        input.placeholder = placeholderOf(currentKind);
        input.value = "";

        overlay.hidden = false;
        document.body.classList.add("nt-ps-lock");

        render("", true);

        setTimeout(function () {

            try {
                input.focus({ preventScroll: true });
            } catch (error) { /* */ }

        }, 60);

    }

    function closePicker() {

        if (!overlay) {
            return;
        }

        overlay.hidden = true;
        document.body.classList.remove("nt-ps-lock");

        try {
            input.blur();
        } catch (error) { /* */ }

        current = null;

    }

    function pick(index) {

        var select = current;

        if (!select || !select.options[index]) {
            return;
        }

        var changed = select.selectedIndex !== index;

        select.selectedIndex = index;

        syncButton(select);
        closePicker();

        if (changed) {

            select.dispatchEvent(new Event("input", { bubbles: true }));
            select.dispatchEvent(new Event("change", { bubbles: true }));

        }

    }


    /* ---------- تشغيل ---------- */

    function init() {

        scan();

        new MutationObserver(scheduleScan).observe(document.body, {
            childList: true,
            subtree: true
        });

    }

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", init);

    } else {

        init();

    }

})();