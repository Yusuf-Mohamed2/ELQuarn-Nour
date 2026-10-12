/* =========================================================
   BOOKS.JS  —  نور التلاوة
   =========================================================
   سكشن "الأحكام والتجويد": المستخدم بيختار قسم (تجويد / أحكام /
   تفسير)، بيشوف كتب القسم، وبيدوس على الكتاب فيتفتح في قارئ
   جوه التطبيق وفيه زرار تحميل.

   - إضافي بالكامل: مفيش حاجة في app.js أو pages.js اتغيّرت.
   - بيبني <section id="books"> والراوتر بيتعامل معاه كأي صفحة (#books).
   - البيانات في books-data.js (NT_BOOKS_CATS و NT_BOOKS).
   - لازم يتحمّل بعد pages.js.
========================================================= */

(function () {

    "use strict";

    var main = document.querySelector("main");

    if (!main) {
        return;
    }


    var SHOW_IN_NAVBAR = false;   /* النافبار زحمة؛ الكارت في الرئيسية وقائمة الموبايل كفاية */
    var LS_LAST = "nt_books_last";

    var cats = Array.isArray(window.NT_BOOKS_CATS) ? window.NT_BOOKS_CATS : [];
    var books = Array.isArray(window.NT_BOOKS) ? window.NT_BOOKS : [];

    var section = null;
    var content = null;
    var reader = null;
    var frame = null;
    var loading = null;

    var currentCat = null;
    var readerPushed = false;


    function esc(value) {

        return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {

            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[c];

        });

    }

    function lastOpened() {

        try {
            return localStorage.getItem(LS_LAST) || "";
        } catch (error) {
            return "";
        }

    }

    function remember(id) {

        try {
            localStorage.setItem(LS_LAST, id);
        } catch (error) { /* */ }

    }

    function findBook(id) {

        for (var i = 0; i < books.length; i++) {

            if (books[i].id === id) {
                return books[i];
            }

        }

        return null;

    }

    function catOf(id) {

        for (var i = 0; i < cats.length; i++) {

            if (cats[i].id === id) {
                return cats[i];
            }

        }

        return null;

    }

    function hueOf(text) {

        var hash = 0;

        for (var i = 0; i < text.length; i++) {
            hash = (hash * 31 + text.charCodeAt(i)) % 360;
        }

        return hash;

    }


    /* =====================================================
       السكشن
    ===================================================== */

    function buildSection() {

        section = document.createElement("section");

        section.id = "books";
        section.className = "section nt-books-section";

        section.innerHTML =
            '<div class="container">' +

                '<div class="nt-back-row">' +
                    '<a class="nt-back-btn" href="#home">‹ الرئيسية</a>' +
                '</div>' +

                '<div class="section-heading">' +
                    '<span>📚</span>' +
                    '<div>' +
                        '<h2>الأحكام والتجويد</h2>' +
                        '<p>اختار اللي عايز تتعلمه، وافتح الكتاب واقرأ منه أو نزّله عندك</p>' +
                    '</div>' +
                '</div>' +

                '<div id="ntBooksContent"></div>' +

            '</div>';

        main.appendChild(section);

        content = section.querySelector("#ntBooksContent");

        content.addEventListener("click", onContentClick);

    }

    function renderCats() {

        currentCat = null;

        content.innerHTML =
            '<div class="nt-bk-step">اختار القسم</div>' +
            '<div class="nt-grid nt-bk-cats">' +

            cats.map(function (cat) {

                var count = books.filter(function (book) { return book.cat === cat.id; }).length;

                return '<button type="button" class="nt-feature" data-cat="' + esc(cat.id) + '">' +
                    '<span class="nt-feature-icon">' + cat.icon + '</span>' +
                    '<span class="nt-feature-text">' +
                        '<strong>' + esc(cat.title) + '</strong>' +
                        '<small>' + esc(cat.desc) + ' · ' + count + ' كتب</small>' +
                    '</span>' +
                '</button>';

            }).join("") +

            '</div>';

    }

    function actionsHtml(book) {

        var html = "";

        if (book.parts && book.parts.length) {

            html += '<button type="button" class="nt-bk-btn nt-bk-primary" data-act="parts">' +
                '📚 المجلدات (' + book.parts.length + ')</button>';

            html += '<div class="nt-bk-parts" hidden>' +

                book.parts.map(function (part, index) {

                    return '<div class="nt-bk-part">' +
                        '<span>' + esc(part.label) + '</span>' +
                        readButton(part, 'data-act="read" data-part="' + index + '"') +
                        downloadLink(part) +
                    '</div>';

                }).join("") +

            '</div>';

            return html;

        }

        html += readButton(book, 'data-act="read"');
        html += downloadLink(book);

        return html;

    }

    function readButton(item, attrs) {

        if (item.embed) {
            return '<button type="button" class="nt-bk-btn nt-bk-primary" ' + attrs + '>📖 اقرأ</button>';
        }

        if (item.page) {

            return '<a class="nt-bk-btn nt-bk-primary" href="' + esc(item.page) +
                '" target="_blank" rel="noopener">📖 اقرأ أونلاين ↗</a>';

        }

        return "";

    }

    function downloadLink(item) {

        if (item.pdf) {

            return '<a class="nt-bk-btn" href="' + esc(item.pdf) +
                '" target="_blank" rel="noopener" download>⬇ تحميل</a>';

        }

        if (item.page) {

            return '<a class="nt-bk-btn" href="' + esc(item.page) +
                '" target="_blank" rel="noopener">⬇ تحميل من صفحة الكتاب</a>';

        }

        return "";

    }

    function renderCat(catId) {

        var cat = catOf(catId);

        if (!cat) {

            renderCats();

            return;

        }

        currentCat = catId;

        var list = books.filter(function (book) { return book.cat === catId; });
        var last = lastOpened();

        content.innerHTML =
            '<div class="nt-bk-head">' +
                '<button type="button" class="nt-back-btn" data-act="cats">‹ الأقسام</button>' +
                '<h3>' + cat.icon + ' ' + esc(cat.title) + '</h3>' +
            '</div>' +

            '<div class="nt-bk-list">' +

            (list.length ? list.map(function (book) {

                return '<article class="nt-bk-card" data-id="' + esc(book.id) + '">' +

                    '<div class="nt-bk-cover" style="--bk-h:' + hueOf(book.id) + '">' +
                        '<span>' + cat.icon + '</span>' +
                    '</div>' +

                    '<div class="nt-bk-body">' +
                        '<h4>' + esc(book.title) + '</h4>' +
                        (book.author ? '<small>' + esc(book.author) + '</small>' : '') +
                        '<p>' + esc(book.desc || "") + '</p>' +

                        '<div class="nt-bk-tags">' +
                            (book.level ? '<span>' + esc(book.level) + '</span>' : '') +
                            (book.meta ? '<span>' + esc(book.meta) + '</span>' : '') +
                            (book.id === last ? '<span class="nt-bk-recent">فتحته قبل كده</span>' : '') +
                        '</div>' +

                        '<div class="nt-bk-actions">' + actionsHtml(book) + '</div>' +
                    '</div>' +

                '</article>';

            }).join("") : '<p class="nt-bk-empty">لسه مفيش كتب في القسم ده.</p>') +

            '</div>';

    }


    /* =====================================================
       التفاعل
    ===================================================== */

    function onContentClick(event) {

        var catBtn = event.target.closest("[data-cat]");

        if (catBtn) {

            renderCat(catBtn.getAttribute("data-cat"));

            window.scrollTo({ top: 0, behavior: "auto" });

            return;

        }

        var actBtn = event.target.closest("[data-act]");

        if (!actBtn) {
            return;
        }

        var act = actBtn.getAttribute("data-act");

        if (act === "cats") {

            renderCats();

            return;

        }

        var card = actBtn.closest(".nt-bk-card");

        if (!card) {
            return;
        }

        var book = findBook(card.getAttribute("data-id"));

        if (!book) {
            return;
        }

        if (act === "parts") {

            var parts = card.querySelector(".nt-bk-parts");

            parts.hidden = !parts.hidden;

            return;

        }

        if (act === "read") {

            var partIndex = actBtn.getAttribute("data-part");

            if (partIndex != null && book.parts) {

                var part = book.parts[Number(partIndex)];

                openReader(book, part, book.title + " — " + part.label);

            } else {

                openReader(book, book, book.title);

            }

        }

    }


    /* =====================================================
       القارئ (تغطية الشاشة كلها)
    ===================================================== */

    function buildReader() {

        reader = document.createElement("div");

        reader.className = "nt-bk-reader";
        reader.hidden = true;

        reader.innerHTML =
            '<div class="nt-bk-reader-bar">' +
                '<button type="button" class="nt-bk-rbtn" data-r="close">‹ رجوع</button>' +
                '<strong class="nt-bk-rtitle"></strong>' +
                '<a class="nt-bk-rbtn" data-r="open" target="_blank" rel="noopener" title="فتح في المتصفح">↗</a>' +
                '<a class="nt-bk-rbtn" data-r="dl" target="_blank" rel="noopener" download title="تحميل">⬇</a>' +
            '</div>' +

            '<div class="nt-bk-rbody">' +
                '<div class="nt-bk-rload">جاري فتح الكتاب…</div>' +
                '<iframe class="nt-bk-rframe" title="قارئ الكتاب" allow="fullscreen" referrerpolicy="no-referrer"></iframe>' +
            '</div>' +

            '<div class="nt-bk-rhint">لو الكتاب مظهرش أو اتأخر، دوس ↗ فوق يتفتح في المتصفح.</div>';

        document.body.appendChild(reader);

        frame = reader.querySelector(".nt-bk-rframe");
        loading = reader.querySelector(".nt-bk-rload");

        frame.addEventListener("load", function () {

            if (frame.getAttribute("src") && frame.getAttribute("src") !== "about:blank") {
                loading.hidden = true;
            }

        });

        reader.addEventListener("click", function (event) {

            if (event.target.closest('[data-r="close"]')) {
                closeReader(false);
            }

        });

    }

    function openReader(book, item, title) {

        if (!reader) {
            buildReader();
        }

        remember(book.id);

        reader.querySelector(".nt-bk-rtitle").textContent = title;

        var openLink = reader.querySelector('[data-r="open"]');
        var dlLink = reader.querySelector('[data-r="dl"]');

        openLink.href = item.page || item.pdf || item.embed;

        if (item.pdf) {

            dlLink.href = item.pdf;
            dlLink.hidden = false;

        } else if (item.page) {

            dlLink.href = item.page;
            dlLink.hidden = false;

        } else {

            dlLink.hidden = true;

        }

        loading.hidden = false;

        frame.src = item.embed;

        reader.hidden = false;

        document.body.classList.add("nt-bk-lock");

        /* زرار الرجوع في الموبايل بيقفل القارئ بدل ما يخرج من الصفحة */
        try {

            history.pushState({ ntBook: true }, "", location.href);

            readerPushed = true;

        } catch (error) {

            readerPushed = false;

        }

    }

    function closeReader(fromPop) {

        if (!reader || reader.hidden) {
            return;
        }

        reader.hidden = true;

        frame.src = "about:blank";

        document.body.classList.remove("nt-bk-lock");

        if (!fromPop && readerPushed) {

            readerPushed = false;

            try {
                history.back();
            } catch (error) { /* */ }

        } else {

            readerPushed = false;

        }

        /* القايمة تتحدّث لو فيه "فتحته قبل كده" */
        if (currentCat) {
            renderCat(currentCat);
        }

    }

    window.addEventListener("popstate", function () {

        if (reader && !reader.hidden) {
            closeReader(true);
        }

    });

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape" && reader && !reader.hidden) {
            closeReader(false);
        }

    });


    /* =====================================================
       ربط الواجهة
    ===================================================== */

    function addEntryPoints() {

        var grid = document.querySelector("#ntHomeFeatures .nt-grid");

        if (grid) {

            var card = document.createElement("a");

            card.className = "nt-feature";
            card.href = "#books";

            card.innerHTML =
                '<span class="nt-feature-icon">📚</span>' +
                '<span class="nt-feature-text">' +
                    '<strong>الأحكام والتجويد</strong>' +
                    '<small>كتب تجويد وأحكام وتفسير تقراها وتنزّلها</small>' +
                '</span>';

            grid.appendChild(card);

        }

        var mobileNav = document.getElementById("mobileNav");

        if (mobileNav) {

            var item = document.createElement("a");

            item.href = "#books";
            item.textContent = "📚 الأحكام والتجويد";

            mobileNav.insertBefore(item, mobileNav.querySelector(".nt-nav-group-label"));

        }

        if (SHOW_IN_NAVBAR) {

            var navLinks = document.querySelector(".nav-links");

            if (navLinks) {

                var link = document.createElement("a");

                link.href = "#books";
                link.className = "nav-link";
                link.innerHTML = "<span>📚</span> الأحكام والتجويد";

                navLinks.insertBefore(link, navLinks.querySelector('a[href="#tools"]') || null);

            }

        }

    }

    function init() {

        buildSection();
        renderCats();
        addEntryPoints();

        /* لما يخرج من السكشن، المرة الجاية يبدأ من اختيار القسم */
        var wasActive = false;

        new MutationObserver(function () {

            var active = section.classList.contains("nt-page-active");

            if (wasActive && !active && currentCat) {
                renderCats();
            }

            wasActive = active;

        }).observe(section, { attributes: true, attributeFilter: ["class"] });

        if (location.hash === "#books") {
            window.dispatchEvent(new Event("hashchange"));
        }

    }

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", init);

    } else {

        init();

    }

})();