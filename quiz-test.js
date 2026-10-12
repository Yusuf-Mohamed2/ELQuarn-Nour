/* =========================================================
   QUIZ-TEST.JS  —  نور التلاوة
   =========================================================
   قسم "اختبار ديني": صفحة مستقلة (#quiz-test) تختار فيها
   التصنيفات وعدد الأسئلة وتبدأ اختبار كامل بدرجة ونتيجة.
   النتايج بتتسجّل في نفس إحصائيات البروفيل عن طريق
   NTQuiz.record. لازم يتحمّل بعد quiz.js.
========================================================= */

(function () {

    "use strict";

    var ROUTE = "quiz-test";
    var main = document.querySelector("main");
    var host = null;
    var run = null;

    function esc(t) {
        var d = document.createElement("div");
        d.textContent = String(t == null ? "" : t);
        return d.innerHTML.replace(/"/g, "&quot;");
    }

    function shuffle(list) {
        var a = list.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function rng(seed) {
        var a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            var t = a;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function shuffleSeed(list, rand) {
        var a = list.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(rand() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function pad(n, len) {
        var t = String(n);
        while (t.length < len) { t = "0" + t; }
        return t;
    }

    function catNames() { return Object.keys(categories()).sort(); }

    var COUNTS = [10, 20, 30, 50];

    /*
        الكود = 3 أرقام بس (000 لـ 999):
        الرقم = (رقم المسابقة × 4) + ترتيب عدد الأسئلة (0 لـ 3).
        يعني فيه 250 مسابقة مختلفة لكل عدد أسئلة. مثال: 482
    */
    var MAX_SEED = 250;

    function makeCode(seed, countIdx) {
        return pad((seed - 1) * 4 + countIdx, 3);
    }

    function parseCode(text) {
        var raw = String(text || "").replace(/[٠-٩]/g, function (d) {
            return String(d.charCodeAt(0) - 1632);
        }).replace(/[^0-9]/g, "");
        if (raw.length !== 3) { return null; }
        var n = parseInt(raw, 10);
        return { seed: Math.floor(n / 4) + 1, count: COUNTS[n % 4], idx: n % 4 };
    }

    function contestItems(c) {
        return shuffleSeed(bank(), rng(c.seed)).slice(0, c.count);
    }

    function bank() {
        return (window.NTQuiz && window.NTQuiz.bank) || [];
    }

    function categories() {
        var map = {};
        bank().forEach(function (x) {
            var c = x.c || "عام";
            map[c] = (map[c] || 0) + 1;
        });
        return map;
    }


    /* ---------- شاشة الإعداد ---------- */

    var selected = null;
    var wanted = 10;

    function renderSetup() {

        var cats = categories();
        var names = Object.keys(cats);

        if (!selected) {
            selected = {};
            names.forEach(function (n) { selected[n] = true; });
        }

        var pool = poolSize();

        host.innerHTML =
            '<div class="nt-pf-card">' +
                "<h3>اختار التصنيفات</h3>" +
                '<div class="nt-tq-chips">' +
                names.map(function (n) {
                    return '<button type="button" class="nt-tq-chip' + (selected[n] ? " on" : "") +
                        '" data-cat="' + esc(n) + '">' + esc(n) + " <b>" + cats[n] + "</b></button>";
                }).join("") +
                "</div>" +
                '<div class="nt-tq-links">' +
                    '<button type="button" class="nt-pf-link" data-act="all">تحديد الكل</button>' +
                    '<button type="button" class="nt-pf-link" data-act="none">إلغاء الكل</button>' +
                "</div>" +
            "</div>" +
            '<div class="nt-pf-card">' +
                "<h3>عدد الأسئلة</h3>" +
                '<div class="nt-tq-chips">' +
                [10, 20, 30, 50, 0].map(function (n) {
                    return '<button type="button" class="nt-tq-chip' + (wanted === n ? " on" : "") +
                        '" data-n="' + n + '">' + (n ? n : "كل الأسئلة") + "</button>";
                }).join("") +
                "</div>" +
                '<p class="nt-qz-empty" id="ntTqInfo">المتاح: ' + pool + " سؤال</p>" +
                '<div class="nt-qz-card-actions">' +
                    '<button type="button" class="nt-pf-btn nt-pf-primary" data-act="start"' +
                    (pool ? "" : " disabled") + ">ابدأ الاختبار 🚀</button>" +
                    '<button type="button" class="nt-pf-btn nt-pf-ghost" data-act="create" title="من كل الأقسام"' +
                    (pool ? "" : " disabled") + ">🏆 إنشاء مسابقة (من كل الأقسام)</button>" +
                "</div>" +
            "</div>" +
            '<div class="nt-pf-card"><h3>🔑 عندك كود مسابقة؟</h3>' +
                '<input class="nt-pf-input" id="ntTqCode" dir="ltr" placeholder="000" maxlength="3" inputmode="numeric" pattern="[0-9]*" autocomplete="off">' +
                '<p class="nt-pf-error" id="ntTqErr"></p>' +
                '<button type="button" class="nt-pf-btn nt-pf-ghost" data-act="join">ادخل المسابقة</button>' +
            "</div>";
    }

    function poolSize() {
        return bank().filter(function (x) { return selected && selected[x.c || "عام"]; }).length;
    }


    /* ---------- الاختبار ---------- */

    function start(contest) {

        var pool = shuffle(bank().filter(function (x) { return selected[x.c || "عام"]; }));

        if (!contest && !pool.length) { return; }

        run = {
            contest: contest || null,
            items: contest ? contestItems(contest) : (wanted ? pool.slice(0, wanted) : pool),
            i: 0, score: 0, streak: 0, best: 0, wrong: [], done: false
        };

        renderQuestion();
    }

    function renderQuestion() {

        var item = run.items[run.i];
        var total = run.items.length;
        var opts = run.contest
            ? shuffleSeed([item.a].concat(item.w).sort(), rng(run.contest.seed + run.i))
            : shuffle([item.a].concat(item.w));

        host.innerHTML =
            '<div class="nt-pf-card nt-tq-play">' +
                '<div class="nt-tq-top"><span>سؤال ' + (run.i + 1) + " / " + total + "</span>" +
                    "<span>✅ " + run.score + (run.streak > 1 ? " · 🔥 " + run.streak : "") + "</span></div>" +
                '<div class="nt-pf-bar"><i style="width:' + Math.round(run.i / total * 100) + '%"></i></div>' +
                '<p class="nt-qz-question" style="margin-top:16px">' + esc(item.q) + "</p>" +
                '<div class="nt-qz-options">' +
                opts.map(function (o) {
                    return '<button type="button" class="nt-qz-opt" data-answer="' + esc(o) + '"><span>' + esc(o) + "</span></button>";
                }).join("") +
                "</div>" +
                '<div class="nt-qz-result" hidden></div>' +
                '<button type="button" class="nt-qz-next" data-act="next" hidden>' +
                    (run.i + 1 === total ? "عرض النتيجة" : "السؤال التالي") + "</button>" +
                '<div class="nt-qz-card-actions"><button type="button" class="nt-pf-link" data-act="quit">إنهاء الاختبار</button></div>' +
            "</div>";
    }

    function answer(btn) {

        var item = run.items[run.i];
        var pick = btn.getAttribute("data-answer");
        var ok = pick === item.a;

        host.querySelectorAll(".nt-qz-opt").forEach(function (el) {
            el.disabled = true;
            var t = el.getAttribute("data-answer");
            if (t === item.a) { el.classList.add("is-correct"); }
            else if (el === btn) { el.classList.add("is-wrong"); }
        });

        if (ok) {
            run.score++; run.streak++;
            run.best = Math.max(run.best, run.streak);
        } else {
            run.streak = 0;
            run.wrong.push({ item: item, pick: pick });
        }

        try { window.NTQuiz.record(item, ok, pick); } catch (e) { /* */ }

        var res = host.querySelector(".nt-qz-result");

        res.className = "nt-qz-result " + (ok ? "is-ok" : "is-bad");
        res.innerHTML =
            (ok ? '<div class="nt-qz-blessing">أحسنت، بارك الله فيك 🌟</div>'
                : '<div class="nt-qz-correct">✅ الإجابة الصحيحة: <b>' + esc(item.a) + "</b></div>") +
            '<div class="nt-qz-info">' + esc(item.i) + "</div>" +
            '<div class="nt-qz-source">📚 المصدر: ' + esc(item.s) + "</div>";
        res.hidden = false;

        host.querySelector(".nt-qz-next").hidden = false;

        try { res.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { /* */ }
    }

    function finish() {

        var total = run.items.length;
        var rate = Math.round(run.score / total * 100);
        var msg = rate >= 90 ? "ما شاء الله، مستوى ممتاز! 🌟"
            : rate >= 70 ? "جيد جدًا، بارك الله فيك 👏"
            : rate >= 50 ? "مستوى طيب، كمّل وهتتحسن 🌿"
            : "ولا يهمك، المهم إنك بتتعلّم 💚";

        host.innerHTML =
            '<div class="nt-pf-card nt-tq-end">' +
                '<div class="nt-tq-score">' + run.score + " / " + total + "</div>" +
                "<h3>" + msg + "</h3>" +
                '<div class="nt-qz-rate"><div class="nt-qz-rate-bar"><i style="width:' + rate + '%"></i></div>' +
                (run.contest ? "<small>قارن نتيجتك بنتيجة صاحبك: نفس الأسئلة بنفس الترتيب 🏆</small><br>" : "") + "<small>نسبة النجاح " + rate + "% · أطول سلسلة إجابات صحيحة " + run.best + "</small></div>" +
                '<div class="nt-qz-card-actions">' +
                    (run.contest
                        ? '<button type="button" class="nt-pf-btn nt-pf-primary" data-act="play">🔁 أعد نفس المسابقة</button>' +
                          '<button type="button" class="nt-pf-btn nt-pf-primary" data-act="recontest">🏆 مسابقة جديدة بكود جديد</button>' +
                          '<button type="button" class="nt-pf-btn nt-pf-ghost" data-act="start">اختبار عادي 🔁</button>'
                        : '<button type="button" class="nt-pf-btn nt-pf-primary" data-act="start">اختبار جديد 🔁</button>' +
                          '<button type="button" class="nt-pf-btn nt-pf-ghost" data-act="create">🏆 إنشاء مسابقة بكود جديد</button>') +
                    '<button type="button" class="nt-pf-link" data-act="setup">تغيير الإعدادات</button>' +
                "</div>" +
            "</div>" +
            (run.wrong.length
                ? '<div class="nt-pf-card"><h3>❌ راجع أخطاءك (' + run.wrong.length + ")</h3>" +
                  '<div class="nt-qz-list">' +
                  run.wrong.map(function (w) {
                      return '<details class="nt-qz-item"><summary>' + esc(w.item.q) + "</summary>" +
                          '<div class="nt-qz-item-body">' +
                          '<div class="nt-qz-row is-bad">❌ إجابتك: <b>' + esc(w.pick) + "</b></div>" +
                          '<div class="nt-qz-row is-ok">✅ الصحيحة: <b>' + esc(w.item.a) + "</b></div>" +
                          '<div class="nt-qz-info">' + esc(w.item.i) + "</div>" +
                          '<div class="nt-qz-source">📚 ' + esc(w.item.s) + "</div></div></details>";
                  }).join("") + "</div></div>"
                : "");
        run = null;
    }


    /* ---------- بناء الصفحة والربط ---------- */

    function onClick(e) {

        var t = e.target.closest("button");

        if (!t) { return; }

        if (t.hasAttribute("data-cat")) {
            var c = t.getAttribute("data-cat");
            selected[c] = !selected[c];
            return renderSetup();
        }

        if (t.hasAttribute("data-n")) {
            wanted = Number(t.getAttribute("data-n"));
            return renderSetup();
        }

        if (t.classList.contains("nt-qz-opt") && run && !t.disabled) {
            return answer(t);
        }

        var act = t.getAttribute("data-act");

        if (act === "all" || act === "none") {
            Object.keys(categories()).forEach(function (n) { selected[n] = act === "all"; });
            renderSetup();
        } else if (act === "start") { start(); }
        else if (act === "create") { createContest(); }
        else if (act === "recontest") { createContest(lastContest && typeof lastContest.idx === "number" ? lastContest.idx : undefined); }
        else if (act === "join") { joinContest(); }
        else if (act === "copy") { shareCode(t.getAttribute("data-code")); }
        else if (act === "play") { start(lastContest); }
        else if (act === "next") {
            run.i++;
            run.i >= run.items.length ? finish() : renderQuestion();
        } else if (act === "quit") {
            if (confirm("تنهي الاختبار؟")) { run = null; renderSetup(); }
        } else if (act === "setup") { renderSetup(); }
    }

    var lastContest = null;

    /* forceIdx: لما نعمل مسابقة جديدة بعد ما خلّصنا مسابقة، نفضل على نفس عدد الأسئلة */
    function createContest(forceIdx) {

        var idx = typeof forceIdx === "number" ? forceIdx : COUNTS.indexOf(wanted);
        if (idx < 0) { idx = wanted === 0 ? COUNTS.length - 1 : 1; }

        var count = Math.min(COUNTS[idx], bank().length);
        var oldSeed = lastContest ? lastContest.seed : 0;
        var seed = oldSeed;

        /* كود جديد دايمًا: مش نفس المسابقة اللي لسه خلّصناها */
        for (var tries = 0; tries < 10 && seed === oldSeed; tries++) {
            seed = Math.floor(Math.random() * MAX_SEED) + 1;
        }

        lastContest = {
            seed: seed,
            count: count,
            idx: idx
        };

        var code = makeCode(lastContest.seed, idx);

        host.innerHTML =
            '<div class="nt-pf-card nt-tq-end"><h3>🏆 تم إنشاء المسابقة</h3>' +
                '<p class="nt-qz-empty">' + count + ' سؤال. ابعت الكود ده لصاحبك، يفتح قسم "اختبار ديني" ويدخله في خانة الكود.</p>' +
                '<div class="nt-tq-code" dir="ltr">' + code + "</div>" +
                '<div class="nt-qz-card-actions">' +
                    '<button type="button" class="nt-pf-btn nt-pf-ghost" data-act="copy" data-code="' + code + '">📋 نسخ / مشاركة الكود</button>' +
                    '<button type="button" class="nt-pf-btn nt-pf-primary" data-act="play">ابدأ المسابقة أنت كمان</button>' +
                    '<button type="button" class="nt-pf-link" data-act="setup">رجوع</button>' +
                "</div></div>";
    }

    function shareCode(code) {

        var text = "تحداني في مسابقة دينية على تطبيق نور التلاوة 🌙\nالكود: " + code;

        if (navigator.share) {
            navigator.share({ text: text }).catch(function () { /* */ });
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function () { alert("تم نسخ الكود"); });
        } else {
            prompt("انسخ الكود:", code);
        }
    }

    function joinContest() {

        var input = host.querySelector("#ntTqCode");
        var err = host.querySelector("#ntTqErr");
        var c = parseCode(input.value);

        if (!c) { err.textContent = "الكود لازم يكون 3 أرقام، راجعه وجرّب تاني."; return; }

        lastContest = c;
        start(c);
    }

    function build() {

        var section = document.createElement("section");

        section.id = ROUTE;
        section.className = "section";
        section.innerHTML =
            '<div class="container">' +
                '<div class="nt-back-row"><a class="nt-back-btn" href="#home">‹ الرئيسية</a></div>' +
                '<div class="section-heading"><span>🧠</span><div><h2>اختبار ديني</h2>' +
                "<p>اختبر معلوماتك في القرآن والسيرة والعبادات والأخلاق</p></div></div>" +
                '<div class="nt-pf-wrap" id="ntQuizTestHost"></div>' +
            "</div>";

        main.appendChild(section);

        host = section.querySelector("#ntQuizTestHost");
        host.addEventListener("click", onClick);

        new MutationObserver(function () {
            if (section.classList.contains("nt-page-active") && !run) { renderSetup(); }
        }).observe(section, { attributes: true, attributeFilter: ["class"] });
    }

    function addLinks() {

        var grid = document.querySelector("#ntHomeFeatures .nt-grid");

        if (grid) {
            grid.insertAdjacentHTML("beforeend",
                '<a class="nt-feature" href="#' + ROUTE + '"><span class="nt-feature-icon">🧠</span>' +
                '<span class="nt-feature-text"><strong>اختبار ديني</strong>' +
                "<small>مئات الأسئلة في الدين مع الإجابة والمصدر</small></span></a>");
        }

        var nav = document.querySelector(".nav-links");
        var sample = nav && nav.querySelector(".nav-link");

        if (nav && sample) {
            var a = document.createElement("a");
            a.href = "#" + ROUTE;
            a.className = sample.className;
            a.textContent = "🧠 اختبار ديني";
            nav.appendChild(a);
        }

        var mob = document.getElementById("mobileNav");

        if (mob) {
            var m = document.createElement("a");
            m.href = "#" + ROUTE;
            m.textContent = "🧠 اختبار ديني";
            mob.insertBefore(m, mob.querySelector(".nt-nav-group-label"));
        }
    }

    function init() {

        if (!main || !window.NTQuiz) { return; }

        build();
        addLinks();

        if (location.hash === "#" + ROUTE) {
            window.dispatchEvent(new Event("hashchange"));
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();