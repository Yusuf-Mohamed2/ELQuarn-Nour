/* =========================================================
   QUIZ.JS  —  نور التلاوة
   =========================================================
   سؤال ديني في كل مرة بتفتح فيها التطبيق.

   - لو جاوب صح: دعاء وتهنئة، ولو غلط: الإجابة الصح + المعلومة
     + المصدر.
   - النتايج بتتخزن في localStorage بس (على الجهاز)، وبتظهر
     في صفحة البروفيل: كام سؤال صح وكام غلط، وتدوس على أي
     رقم تشوف الأسئلة نفسها.
   - السؤال مبيتكررش لحد ما كل أسئلة البنك تخلص، وبعدها
     بتبدأ دورة جديدة.

   لازم يتحمّل بعد profile.js و quiz-data.js.
========================================================= */

(function () {

    "use strict";

    var KEY = "noorTelawa_quiz";
    var TOUR_KEY = "noorTelawaTourSeen_v1";

    /* لو التطبيق فضل مفتوح في الخلفية أكتر من المدة دي ورجعتله، يظهر سؤال جديد */
    var AWAY_MS = 30 * 60 * 1000;

    var BLESSING =
        "بسم الله ما شاء الله، جعلك الله من أهل الجنة، اللهم آمين، " +
        "بارك الله فيك، اللهم صلِّ وسلِّم وبارك على نبينا محمد ﷺ";

    var BANK = Array.isArray(window.NT_QUIZ_BANK) ? window.NT_QUIZ_BANK : [];
    var BY_ID = {};


    /* =====================================================
       أدوات
    ===================================================== */

    function hash(text) {

        var h = 5381;

        for (var i = 0; i < text.length; i++) {
            h = ((h << 5) + h + text.charCodeAt(i)) | 0;
        }

        return "q" + (h >>> 0).toString(36);
    }

    BANK.forEach(function (item) {
        item.id = hash(item.q);
        BY_ID[item.id] = item;
    });

    function esc(text) {
        var div = document.createElement("div");
        div.textContent = String(text == null ? "" : text);
        return div.innerHTML;
    }

    function shuffle(list) {

        var arr = list.slice();

        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }

        return arr;
    }

    function readState() {

        var raw = null;

        try {
            raw = JSON.parse(localStorage.getItem(KEY));
        } catch (error) { /* */ }

        var s = raw && typeof raw === "object" ? raw : {};

        return {
            results: s.results && typeof s.results === "object" ? s.results : {},
            asked: Array.isArray(s.asked) ? s.asked : [],
            last: s.last || null
        };
    }

    function writeState() {
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
        } catch (error) { /* التخزين ممتلئ أو ممنوع */ }
    }

    var state = readState();


    /* =====================================================
       اختيار السؤال (من غير تكرار لحد ما الدورة تخلص)
    ===================================================== */

    function pickQuestion() {

        if (!BANK.length) {
            return null;
        }

        var askedMap = {};

        state.asked.forEach(function (id) { askedMap[id] = true; });

        var pool = BANK.filter(function (item) { return !askedMap[item.id]; });

        if (!pool.length) {

            /* خلصنا كل الأسئلة: دورة جديدة، ومن غير ما نكرر آخر سؤال على طول */
            state.asked = [];

            pool = BANK.filter(function (item) {
                return BANK.length < 2 || item.id !== state.last;
            });
        }

        var chosen = pool[Math.floor(Math.random() * pool.length)];

        state.asked.push(chosen.id);
        state.last = chosen.id;
        writeState();

        return chosen;
    }

    function counts() {

        var good = 0;
        var bad = 0;

        Object.keys(state.results).forEach(function (id) {

            if (!BY_ID[id]) {
                return;
            }

            if (state.results[id].ok) {
                good++;
            } else {
                bad++;
            }
        });

        return { good: good, bad: bad };
    }


    /* =====================================================
       نافذة السؤال
    ===================================================== */

    var overlay = null;
    var current = null;
    var answered = false;

    function buildOverlay() {

        overlay = document.createElement("div");

        overlay.className = "nt-qz-overlay";
        overlay.hidden = true;

        overlay.innerHTML =
            '<div class="nt-qz-modal" role="dialog" aria-modal="true" aria-labelledby="ntQzTitle">' +
                '<div class="nt-qz-head">' +
                    '<span class="nt-qz-mark">☪</span>' +
                    '<h3 id="ntQzTitle">سؤال ديني</h3>' +
                    '<button type="button" class="nt-qz-x" id="ntQzClose" aria-label="إغلاق">✕</button>' +
                "</div>" +
                '<p class="nt-qz-question" id="ntQzQuestion"></p>' +
                '<div class="nt-qz-options" id="ntQzOptions"></div>' +
                '<div class="nt-qz-result" id="ntQzResult" hidden></div>' +
                '<button type="button" class="nt-qz-next" id="ntQzNext" hidden>متابعة</button>' +
            "</div>";

        document.body.appendChild(overlay);

        overlay.querySelector("#ntQzClose").addEventListener("click", closeQuestion);
        overlay.querySelector("#ntQzNext").addEventListener("click", closeQuestion);

        overlay.querySelector("#ntQzOptions").addEventListener("click", function (event) {

            var btn = event.target.closest(".nt-qz-opt");

            if (btn && !answered) {
                answer(btn);
            }
        });
    }

    function showQuestion(item) {

        item = item || pickQuestion();

        if (!item) {
            return;
        }

        if (!overlay) {
            buildOverlay();
        }

        current = item;
        answered = false;

        overlay.querySelector("#ntQzQuestion").textContent = item.q;

        var options = shuffle([item.a].concat(item.w));

        overlay.querySelector("#ntQzOptions").innerHTML = options.map(function (text) {
            return (
                '<button type="button" class="nt-qz-opt" data-answer="' + esc(text).replace(/"/g, "&quot;") + '">' +
                    "<span>" + esc(text) + "</span>" +
                "</button>"
            );
        }).join("");

        var result = overlay.querySelector("#ntQzResult");

        result.hidden = true;
        result.innerHTML = "";
        result.className = "nt-qz-result";

        overlay.querySelector("#ntQzNext").hidden = true;

        overlay.hidden = false;
        document.body.classList.add("nt-qz-lock");

        var modal = overlay.querySelector(".nt-qz-modal");
        modal.scrollTop = 0;
    }

    function answer(btn) {

        answered = true;

        var picked = btn.getAttribute("data-answer");
        var ok = picked === current.a;

        overlay.querySelectorAll(".nt-qz-opt").forEach(function (el) {

            el.disabled = true;

            var text = el.getAttribute("data-answer");

            if (text === current.a) {
                el.classList.add("is-correct");
            } else if (el === btn) {
                el.classList.add("is-wrong");
            }
        });

        state.results[current.id] = { ok: ok, pick: picked, at: Date.now() };
        writeState();

        var result = overlay.querySelector("#ntQzResult");

        if (ok) {

            result.className = "nt-qz-result is-ok";
            result.innerHTML =
                '<div class="nt-qz-blessing">' + esc(BLESSING) + "</div>" +
                '<div class="nt-qz-info">' + esc(current.i) + "</div>" +
                '<div class="nt-qz-source">📚 المصدر: ' + esc(current.s) + "</div>";

        } else {

            result.className = "nt-qz-result is-bad";
            result.innerHTML =
                '<div class="nt-qz-bad-title">إجابتك غير صحيحة، ولا بأس، المهم أن نتعلّم 🌿</div>' +
                '<div class="nt-qz-correct">✅ الإجابة الصحيحة: <b>' + esc(current.a) + "</b></div>" +
                '<div class="nt-qz-info">' + esc(current.i) + "</div>" +
                '<div class="nt-qz-source">📚 المصدر: ' + esc(current.s) + "</div>";
        }

        result.hidden = false;

        var next = overlay.querySelector("#ntQzNext");

        next.hidden = false;

        try {
            result.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } catch (error) { /* */ }

        refreshProfileCard();
    }

    function closeQuestion() {

        if (overlay) {
            overlay.hidden = true;
        }

        current = null;

        if (!listOverlay || listOverlay.hidden) {
            document.body.classList.remove("nt-qz-lock");
        }
    }


    /* =====================================================
       قوائم الأسئلة (صح / غلط) من البروفيل
    ===================================================== */

    var listOverlay = null;

    function buildListOverlay() {

        listOverlay = document.createElement("div");

        listOverlay.className = "nt-qz-overlay";
        listOverlay.hidden = true;

        listOverlay.innerHTML =
            '<div class="nt-qz-modal nt-qz-list-modal" role="dialog" aria-modal="true" aria-labelledby="ntQzListTitle">' +
                '<div class="nt-qz-head">' +
                    '<h3 id="ntQzListTitle"></h3>' +
                    '<button type="button" class="nt-qz-x" id="ntQzListClose" aria-label="إغلاق">✕</button>' +
                "</div>" +
                '<div class="nt-qz-list" id="ntQzList"></div>' +
            "</div>";

        document.body.appendChild(listOverlay);

        listOverlay.querySelector("#ntQzListClose").addEventListener("click", closeList);

        listOverlay.addEventListener("click", function (event) {
            if (event.target === listOverlay) {
                closeList();
            }
        });
    }

    function openList(kind) {

        if (!listOverlay) {
            buildListOverlay();
        }

        var wantOk = kind === "good";

        var items = Object.keys(state.results)
            .filter(function (id) {
                return BY_ID[id] && !!state.results[id].ok === wantOk;
            })
            .sort(function (a, b) {
                return (state.results[b].at || 0) - (state.results[a].at || 0);
            });

        listOverlay.querySelector("#ntQzListTitle").textContent =
            (wantOk ? "✅ أسئلة جاوبتها صح" : "❌ أسئلة جاوبتها غلط") + " (" + items.length + ")";

        var host = listOverlay.querySelector("#ntQzList");

        if (!items.length) {

            host.innerHTML =
                '<p class="nt-qz-empty">' +
                    (wantOk
                        ? "لسه مفيش أسئلة جاوبتها صح. أول ما تجاوب هتلاقيها هنا."
                        : "ما شاء الله، مفيش أي سؤال جاوبته غلط لحد دلوقتي.") +
                "</p>";

        } else {

            host.innerHTML = items.map(function (id) {

                var item = BY_ID[id];
                var res = state.results[id];

                var body =
                    '<div class="nt-qz-row ' + (wantOk ? "is-ok" : "is-bad") + '">' +
                        (wantOk ? "✅ إجابتك: " : "❌ إجابتك: ") + "<b>" + esc(res.pick) + "</b>" +
                    "</div>";

                if (!wantOk) {
                    body += '<div class="nt-qz-row is-ok">✅ الإجابة الصحيحة: <b>' + esc(item.a) + "</b></div>";
                }

                body +=
                    '<div class="nt-qz-info">' + esc(item.i) + "</div>" +
                    '<div class="nt-qz-source">📚 المصدر: ' + esc(item.s) + "</div>";

                return (
                    '<details class="nt-qz-item">' +
                        "<summary>" + esc(item.q) + "</summary>" +
                        '<div class="nt-qz-item-body">' + body + "</div>" +
                    "</details>"
                );
            }).join("");
        }

        listOverlay.hidden = false;
        document.body.classList.add("nt-qz-lock");
        listOverlay.querySelector(".nt-qz-modal").scrollTop = 0;
    }

    function closeList() {

        if (listOverlay) {
            listOverlay.hidden = true;
        }

        if (!overlay || overlay.hidden) {
            document.body.classList.remove("nt-qz-lock");
        }
    }

    document.addEventListener("keydown", function (event) {

        if (event.key !== "Escape") {
            return;
        }

        if (listOverlay && !listOverlay.hidden) {
            closeList();
        } else if (overlay && !overlay.hidden) {
            closeQuestion();
        }
    });


    /* =====================================================
       كارت البروفيل
       profile.js بيعيد رسم الصفحة كل مرة بـ innerHTML، فبنراقب
       ونرجّع الكارت بعد كل رسم.
    ===================================================== */

    function cardHtml() {

        var c = counts();
        var total = c.good + c.bad;

        var rate = total ? Math.round((c.good / total) * 100) : 0;

        return (
            '<h3>🧠 أسئلتك الدينية</h3>' +
            '<div class="nt-qz-tiles">' +
                '<button type="button" class="nt-qz-tile is-good" data-qz="good">' +
                    "<strong>" + c.good + "</strong>" +
                    "<small>✅ إجابة صحيحة</small>" +
                "</button>" +
                '<button type="button" class="nt-qz-tile is-bad" data-qz="bad">' +
                    "<strong>" + c.bad + "</strong>" +
                    "<small>❌ إجابة غلط</small>" +
                "</button>" +
            "</div>" +
            (total
                ? '<div class="nt-qz-rate"><div class="nt-qz-rate-bar"><i style="width:' + rate + '%"></i></div>' +
                  "<small>نسبة الإجابات الصحيحة " + rate + "% من " + total + " سؤال</small></div>"
                : '<p class="nt-qz-empty">لسه ما جاوبتش على أي سؤال. هيظهرلك سؤال جديد كل مرة تفتح التطبيق.</p>') +
            '<div class="nt-qz-card-actions">' +
                '<button type="button" class="nt-pf-btn nt-pf-ghost" data-qz="new">🎲 جرّب سؤالًا الآن</button>' +
                (total ? '<button type="button" class="nt-pf-link" data-qz="reset">مسح نتائج الأسئلة</button>' : "") +
            "</div>"
        );
    }

    function onCardClick(event) {

        var btn = event.target.closest("[data-qz]");

        if (!btn) {
            return;
        }

        var action = btn.getAttribute("data-qz");

        if (action === "good" || action === "bad") {
            openList(action);
            return;
        }

        if (action === "new") {
            showQuestion();
            return;
        }

        if (action === "reset") {

            if (!confirm("متأكد إنك عايز تمسح كل نتائج الأسئلة الدينية؟")) {
                return;
            }

            state.results = {};
            writeState();
            refreshProfileCard();
        }
    }

    function refreshProfileCard() {

        var section = document.getElementById("profile");

        if (!section) {
            return;
        }

        var card = section.querySelector("#ntQuizCard");

        if (card) {
            card.innerHTML = cardHtml();
            return;
        }

        injectProfileCard();
    }

    function injectProfileCard() {

        var section = document.getElementById("profile");

        if (!section || section.querySelector("#ntQuizCard")) {
            return;
        }

        var wrap = section.querySelector(".nt-pf-wrap");

        if (!wrap) {
            return;
        }

        var card = document.createElement("div");

        card.className = "nt-pf-card nt-qz-card";
        card.id = "ntQuizCard";
        card.innerHTML = cardHtml();
        card.addEventListener("click", onCardClick);

        var hero = wrap.querySelector(".nt-pf-hero");

        if (hero && hero.nextSibling) {
            wrap.insertBefore(card, hero.nextSibling);
        } else {
            wrap.appendChild(card);
        }
    }

    function watchProfile() {

        var section = document.getElementById("profile");

        if (!section) {
            return false;
        }

        new MutationObserver(injectProfileCard).observe(section, { childList: true });

        injectProfileCard();

        return true;
    }


    /* =====================================================
       إمتى يظهر السؤال
    ===================================================== */

    function tourSeen() {
        try {
            return !!localStorage.getItem(TOUR_KEY) || location.search.indexOf("skipTour=1") !== -1;
        } catch (error) {
            return true;
        }
    }

    function blocked() {

        /* نافذة إنشاء البروفيل أو أي نافذة سؤال/قائمة مفتوحة */
        var pf = document.querySelector(".nt-pf-overlay");

        if (pf && !pf.hidden) {
            return true;
        }

        if (overlay && !overlay.hidden) {
            return true;
        }

        return false;
    }

    function showWhenFree(delay) {

        var waited = 0;

        function tick() {

            if (!blocked()) {
                showQuestion();
                return;
            }

            waited += 800;

            if (waited < 10 * 60 * 1000) {
                setTimeout(tick, 800);
            }
        }

        setTimeout(tick, delay);
    }

    function init() {

        if (!BANK.length) {
            return;
        }

        if (!watchProfile()) {

            var tries = 0;

            var timer = setInterval(function () {

                tries++;

                if (watchProfile() || tries > 25) {
                    clearInterval(timer);
                }
            }, 200);
        }

        /* أول مرة: الجولة التعريفية الأول، وبعدين الأسئلة */
        if (tourSeen()) {
            showWhenFree(1600);
        }

        var hiddenAt = 0;

        document.addEventListener("visibilitychange", function () {

            if (document.visibilityState === "hidden") {
                hiddenAt = Date.now();
                return;
            }

            if (hiddenAt && Date.now() - hiddenAt > AWAY_MS && tourSeen()) {
                hiddenAt = 0;
                showWhenFree(600);
            }
        });
    }

    window.NTQuiz = {
        bank: BANK,
        record: function (item, ok, pick) {
            state.results[item.id] = { ok: !!ok, pick: pick, at: Date.now() };
            writeState();
            refreshProfileCard();
        },
        show: function () { showQuestion(); },
        count: BANK.length
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();