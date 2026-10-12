/* =========================================================
   REELS.JS  —  نور التلاوة
   =========================================================
   سكشن "مقتطفات": فيديوهات قصيرة (30 ثانية بحد أقصى) بتنزل
   واحد ورا التاني زي الريلز. السحب لفوق بيجيب اللي بعده،
   والمقطع بيشتغل لوحده أول ما يبقى قدامك وبيقف لما تسيبه.

   - إضافي بالكامل: مفيش حاجة في app.js أو pages.js اتغيّرت.
   - بيبني <section id="reels"> وراوتر pages.js بيتعامل معاه
     كأي صفحة تانية (#reels).
   - القايمة بتتقرأ من reels-data.js (window.NT_REELS).
   - لازم يتحمّل بعد pages.js.
========================================================= */

(function () {

    "use strict";

    var main = document.querySelector("main");

    if (!main) {
        return;
    }


    /* ---------- إعدادات ---------- */

    var SHOW_IN_NAVBAR = true;      /* لو النافبار زحمة على الكمبيوتر خليها false */
    var MAX_SECONDS = 30.5;         /* أي ملف أطول من كده بيتخفى */
    var LS_LIKES = "nt_reels_likes";
    var LS_MUTE = "nt_reels_muted";


    /* ---------- أدوات صغيرة ---------- */

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

    function readJson(key, fallback) {

        try {

            var value = JSON.parse(localStorage.getItem(key));

            return value == null ? fallback : value;

        } catch (error) {

            return fallback;

        }

    }

    function writeText(key, value) {

        try {
            localStorage.setItem(key, value);
        } catch (error) { /* */ }

    }

    function notify(message) {

        try {

            if (typeof showToast === "function") {
                showToast(message);
            }

        } catch (error) { /* */ }

    }

    function shuffle(list) {

        var copy = list.slice();

        for (var i = copy.length - 1; i > 0; i--) {

            var j = Math.floor(Math.random() * (i + 1));
            var tmp = copy[i];

            copy[i] = copy[j];
            copy[j] = tmp;

        }

        return copy;

    }

    function hasReciter() {

        try {
            return typeof audio !== "undefined" && !!audio;
        } catch (error) {
            return false;
        }

    }

    function pauseReciter() {

        try {

            if (hasReciter() && !audio.paused) {
                audio.pause();
            }

        } catch (error) { /* */ }

    }

    function reciterBusy() {

        try {
            return hasReciter() && !audio.paused && !audio.ended;
        } catch (error) {
            return false;
        }

    }


    /* ---------- البيانات والحالة ---------- */

    /* بيقبل ID أو لينك يوتيوب كامل (shorts / watch / youtu.be) */
    function ytId(value) {

        var text = String(value || "").trim();
        var match = text.match(
            /(?:youtu\.be\/|\/shorts\/|\/embed\/|\/live\/|[?&]v=)([A-Za-z0-9_-]{11})/
        );

        return match ? match[1] : text;

    }

    var clips = (Array.isArray(window.NT_REELS) ? window.NT_REELS : [])
        .filter(function (clip) {
            return clip && (clip.src || clip.youtube || clip.facebook);
        })
        .map(function (clip, index) {

            var copy = {};

            Object.keys(clip).forEach(function (key) { copy[key] = clip[key]; });

            if (copy.youtube) {
                copy.youtube = ytId(copy.youtube);
            }

            /* فيسبوك: بيتعامل زي مشغّل مضمّن (iframe) زي يوتيوب */
            var fbKey = copy.facebook ? String(copy.facebook) : "";

            if (fbKey && !copy.youtube && !copy.src) {
                copy.youtube = "facebook";
            }

            copy.id = String(clip.id || fbKey || copy.youtube || clip.src || ("clip-" + index));

            return copy;

        });

    var bad = {};
    var likes = {};

    readJson(LS_LIKES, []).forEach(function (id) { likes[id] = true; });

    var muted = localStorage.getItem(LS_MUTE) === "1";

    var section = null;
    var stage = null;
    var feed = null;
    var muteBtn = null;

    var all = [];
    var active = null;
    var io = null;
    var built = false;
    var pageActive = false;
    var lastBatchId = null;

    var lastTapAt = 0;
    var lastTapEl = null;
    var tapTimer = null;


    /* =====================================================
       بناء السكشن
    ===================================================== */

    function buildSection() {

        section = document.createElement("section");

        section.id = "reels";
        section.className = "nt-reels-section";

        section.innerHTML =
            '<div class="nt-reels-stage" id="ntReelsStage">' +
                '<div class="nt-reels-feed" id="ntReelsFeed"></div>' +

                '<div class="nt-reels-top">' +
                    '<a class="nt-reels-back" href="#home">‹ الرئيسية</a>' +
                    '<strong class="nt-reels-title">مقتطفات</strong>' +
                    '<button class="nt-reels-btn" id="ntReelsMute" type="button" aria-label="الصوت">🔊</button>' +
                '</div>' +

                '<div class="nt-reels-arrows">' +
                    '<button class="nt-reels-btn" type="button" data-step="-1" aria-label="السابق">▲</button>' +
                    '<button class="nt-reels-btn" type="button" data-step="1" aria-label="التالي">▼</button>' +
                '</div>' +

                '<div class="nt-reels-empty-box">' +
                    '<div>' +
                        '<div class="nt-reels-empty-icon">🎬</div>' +
                        '<p>لسه مفيش مقتطفات هنا.</p>' +
                        '<small>ضيف المقاطع في ملف reels-data.js وهتظهر على طول.</small>' +
                    '</div>' +
                '</div>' +
            '</div>';

        main.appendChild(section);

        stage = section.querySelector("#ntReelsStage");
        feed = section.querySelector("#ntReelsFeed");
        muteBtn = section.querySelector("#ntReelsMute");

        muteBtn.addEventListener("click", function () {
            setMuted(!muted, true);
        });

        section.querySelector(".nt-reels-arrows").addEventListener("click", function (event) {

            var btn = event.target.closest("[data-step]");

            if (btn) {
                step(Number(btn.getAttribute("data-step")));
            }

        });

        feed.addEventListener("click", onFeedClick);

        updateMuteButton();

    }


    /* =====================================================
       شريحة (مقطع واحد)
    ===================================================== */

    function makeSlide(clip, index) {

        var el = document.createElement("article");

        el.className = "nt-reel" + (clip.fit === "contain" ? " nt-reel-contain" : "");

        el._clip = clip;
        el._idx = index;
        el._loaded = false;
        el._userPaused = false;
        el._video = null;
        el._yt = null;

        el.innerHTML =
            '<div class="nt-reel-media"></div>' +
            '<div class="nt-reel-shade"></div>' +
            '<div class="nt-reel-tap"></div>' +
            '<div class="nt-reel-flash"></div>' +
            '<div class="nt-reel-heart">❤️</div>' +
            '<div class="nt-reel-spin"></div>' +
            '<div class="nt-reel-fail">مقدرناش نحمّل المقطع، اتأكد من النت وجرّب تاني</div>' +

            '<div class="nt-reel-actions">' +
                '<button type="button" class="nt-reel-act" data-act="like" aria-label="أعجبني">' +
                    '<b>🤍</b><span>أعجبني</span>' +
                '</button>' +
                '<button type="button" class="nt-reel-act" data-act="share" aria-label="مشاركة">' +
                    '<b>↗</b><span>مشاركة</span>' +
                '</button>' +
                (clip.src
                    ? '<button type="button" class="nt-reel-act" data-act="download" aria-label="تحميل">' +
                        '<b>⬇</b><span>تحميل</span>' +
                      '</button>'
                    : '') +
            '</div>' +

            '<div class="nt-reel-info">' +
                (clip.title ? '<h3>' + esc(clip.title) + '</h3>' : '') +
                (clip.by ? '<small>' + esc(clip.by) + '</small>' : '') +
                (clip.text ? '<p>' + esc(clip.text) + '</p>' : '') +
            '</div>' +

            '<div class="nt-reel-bar"><i></i></div>';

        if (clip.poster) {

            el.querySelector(".nt-reel-media").style.backgroundImage =
                'url("' + String(clip.poster).replace(/"/g, "%22") + '")';

        }

        refreshLike(el);

        return el;

    }

    function ytUrl(id) {

        return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) +
            "?autoplay=1&mute=1&loop=1&playlist=" + encodeURIComponent(id) +
            "&controls=0&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3" +
            "&disablekb=1&fs=0&enablejsapi=1&origin=" + encodeURIComponent(location.origin);

    }

    function fbUrl(link) {

        return "https://www.facebook.com/plugins/video.php?href=" +
            encodeURIComponent(link) +
            "&show_text=false&autoplay=true&mute=1&allowfullscreen=false";

    }

    function ytCommand(el, func) {

        try {

            if (el._yt && el._yt.contentWindow) {

                el._yt.contentWindow.postMessage(
                    JSON.stringify({ event: "command", func: func, args: [] }),
                    "*"
                );

            }

        } catch (error) { /* */ }

    }

    function loadSlide(el, eager) {

        if (el._loaded) {
            return;
        }

        var clip = el._clip;
        var media = el.querySelector(".nt-reel-media");

        /* يوتيوب تقيل: بنحمّله بس لما يبقى هو المعروض */
        if (clip.youtube) {

            if (!eager) {
                return;
            }

            el._loaded = true;

            var frame = document.createElement("iframe");

            frame.className = "nt-reel-yt" + (clip.facebook ? " nt-reel-fb" : "");

            if (clip.facebook) {
                el.classList.add("nt-reel-fbslide");
            }
            frame.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
            frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
            frame.setAttribute("title", clip.title || "مقتطف");

            frame.addEventListener("load", function () {

                el.classList.remove("nt-loading");

                if (!muted) {
                    ytCommand(el, "unMute");
                }

            });

            el.classList.add("nt-loading");

            frame.src = clip.facebook ? fbUrl(clip.facebook) : ytUrl(clip.youtube);

            media.appendChild(frame);

            el._yt = frame;

            return;

        }

        el._loaded = true;

        var video = document.createElement("video");

        video.className = "nt-reel-video";
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
        video.loop = true;
        video.muted = true;
        video.preload = eager ? "auto" : "metadata";

        video.addEventListener("loadedmetadata", function () {

            if (isFinite(video.duration) && video.duration > MAX_SECONDS) {
                tooLong(el);
            }

        });

        video.addEventListener("timeupdate", function () {

            if (video.duration) {

                el.querySelector(".nt-reel-bar i").style.width =
                    (video.currentTime / video.duration * 100) + "%";

            }

        });

        ["waiting", "stalled"].forEach(function (name) {

            video.addEventListener(name, function () {

                if (el === active) {
                    el.classList.add("nt-loading");
                }

            });

        });

        ["playing", "canplay"].forEach(function (name) {

            video.addEventListener(name, function () {

                el.classList.remove("nt-loading", "nt-failed");

            });

        });

        video.addEventListener("error", function () {

            el.classList.remove("nt-loading");
            el.classList.add("nt-failed");

        });

        video.src = clip.src;

        media.appendChild(video);

        el._video = video;

    }

    function unloadSlide(el) {

        if (!el._loaded) {
            return;
        }

        if (el._video) {

            try {

                el._video.pause();
                el._video.removeAttribute("src");
                el._video.load();

            } catch (error) { /* */ }

            el._video.remove();
            el._video = null;

        }

        if (el._yt) {

            el._yt.remove();
            el._yt = null;

        }

        el._loaded = false;

        el.classList.remove("nt-loading", "nt-failed", "nt-paused");

        el.querySelector(".nt-reel-bar i").style.width = "0";

    }

    function tooLong(el) {

        bad[el._clip.id] = true;

        if (io) {
            io.unobserve(el);
        }

        unloadSlide(el);

        el.hidden = true;

        if (el === active) {
            active = null;
        }

        checkEmpty();

    }

    function checkEmpty() {

        var anyVisible = all.some(function (slide) { return !slide.hidden; });

        stage.classList.toggle("nt-reels-empty", !anyVisible);

    }


    /* =====================================================
       تشغيل / إيقاف
    ===================================================== */

    function playSlide(el) {

        loadSlide(el, true);

        el.classList.remove("nt-paused", "nt-failed");

        el._userPaused = false;

        if (el._video) {

            var video = el._video;

            video.preload = "auto";
            video.muted = muted;

            if (!muted) {
                pauseReciter();
            }

            var attempt = video.play();

            if (attempt && attempt.catch) {

                attempt.catch(function (error) {

                    if (error && error.name === "NotAllowedError" && !video.muted) {

                        /* المتصفح مانع الصوت التلقائي: نشغّل صامت ونفهّم المستخدم */
                        setMuted(true, false);

                        video.muted = true;

                        var retry = video.play();

                        if (retry && retry.catch) {

                            retry.catch(function () {
                                el.classList.add("nt-paused");
                            });

                        }

                        notify("الصوت مقفول، دوس على 🔇 فوق عشان يشتغل");

                    }

                });

            }

        } else if (el._yt && !muted) {

            pauseReciter();

        }

        syncPlayer();

    }

    /* وقفة مؤقتة (الصفحة اتقفلت / التطبيق راح للخلفية) من غير ما نرجّع المقطع للأول */
    function suspend(el) {

        if (!el) {
            return;
        }

        if (el._video) {
            el._video.pause();
        }

        if (el._yt) {
            unloadSlide(el);
        }

    }

    /* المستخدم سابه: نوقفه ونرجّعه للأول */
    function leave(el) {

        if (el._video) {

            el._video.pause();

            try {
                el._video.currentTime = 0;
            } catch (error) { /* */ }

        }

        if (el._yt) {
            unloadSlide(el);
        }

        el._userPaused = false;

        el.classList.remove("nt-paused", "nt-loading");

    }

    function togglePause(el) {

        if (el._video) {

            if (el._video.paused) {

                playSlide(el);

            } else {

                el._video.pause();
                el._userPaused = true;
                el.classList.add("nt-paused");

            }

        } else if (el._clip.youtube) {

            if (el._userPaused) {

                el._userPaused = false;
                el.classList.remove("nt-paused");
                ytCommand(el, "playVideo");

            } else {

                el._userPaused = true;
                el.classList.add("nt-paused");
                ytCommand(el, "pauseVideo");

            }

        }

    }

    function activate(el) {

        if (el === active || el.hidden) {
            return;
        }

        var previous = active;

        active = el;

        if (previous) {
            leave(previous);
        }

        playSlide(el);

        var index = el._idx;

        all.forEach(function (slide) {

            if (slide.hidden) {
                return;
            }

            var distance = Math.abs(slide._idx - index);

            if (distance === 1 && !slide._clip.youtube) {
                loadSlide(slide, false);
            } else if (distance >= 3) {
                unloadSlide(slide);
            }

        });

        /* قرّبنا من آخر القايمة: نضيف دفعة جديدة (مبتخلصش) */
        if (index >= all.length - 3) {
            appendBatch();
        }

    }


    /* =====================================================
       الصوت
    ===================================================== */

    function updateMuteButton() {

        if (muteBtn) {
            muteBtn.textContent = muted ? "🔇" : "🔊";
        }

    }

    function setMuted(value, persist) {

        muted = !!value;

        if (persist) {
            writeText(LS_MUTE, muted ? "1" : "0");
        }

        updateMuteButton();

        if (!active) {
            return;
        }

        if (active._video) {
            active._video.muted = muted;
        }

        if (active._yt) {
            ytCommand(active, muted ? "mute" : "unMute");
        }

        if (!muted) {
            pauseReciter();
        }

        syncPlayer();

    }


    /* =====================================================
       أعجبني / مشاركة
    ===================================================== */

    function refreshLike(el) {

        var on = !!likes[el._clip.id];
        var btn = el.querySelector('[data-act="like"]');

        btn.classList.toggle("on", on);
        btn.querySelector("b").textContent = on ? "❤️" : "🤍";

    }

    function saveLikes() {

        writeText(LS_LIKES, JSON.stringify(Object.keys(likes)));

    }

    function setLike(el, forceOn) {

        var id = el._clip.id;

        if (forceOn || !likes[id]) {
            likes[id] = true;
        } else {
            delete likes[id];
        }

        saveLikes();

        /* نفس المقطع ممكن يتكرر في الفيد */
        all.forEach(function (slide) {

            if (slide._clip.id === id) {
                refreshLike(slide);
            }

        });

    }

    function burst(el) {

        var heart = el.querySelector(".nt-reel-heart");

        heart.classList.remove("nt-pop");

        void heart.offsetWidth;

        heart.classList.add("nt-pop");

    }

    function downloadClip(el) {

        var clip = el._clip;

        if (!clip || !clip.src) {
            return;
        }

        var name = String(clip.title || clip.id || "reel")
            .replace(/[\\/:*?"<>|]+/g, " ")
            .trim()
            .slice(0, 60) || "reel";

        var link = document.createElement("a");

        function save(href, revoke) {

            link.href = href;
            link.download = name + ".mp4";
            link.rel = "noopener";
            link.style.display = "none";

            document.body.appendChild(link);
            link.click();
            link.remove();

            if (revoke) {
                setTimeout(function () { URL.revokeObjectURL(href); }, 15000);
            }

        }

        notify("بدأ التحميل…");

        fetch(clip.src)
            .then(function (response) {

                if (!response.ok) {
                    throw new Error("http " + response.status);
                }

                return response.blob();

            })
            .then(function (blob) {

                save(URL.createObjectURL(blob), true);

                notify("تم التحميل ✅");

            })
            .catch(function () {

                /* لو الفيديو على دومين تاني أو النت ضعيف: تحميل مباشر */
                try {

                    save(clip.src, false);

                } catch (error) {

                    notify("مقدرناش نحمّل المقطع");

                }

            });

    }

    function shareClip(el) {

        var clip = el._clip;
        var title = clip.title || "مقتطف";
        var url = location.origin + location.pathname + "#reels";
        var text = title + " — نور التلاوة";

        if (navigator.share) {

            navigator.share({ title: title, text: text, url: url }).catch(function () { /* */ });

        } else if (navigator.clipboard && navigator.clipboard.writeText) {

            navigator.clipboard.writeText(text + "\n" + url).then(function () {
                notify("اتنسخ الرابط");
            }).catch(function () { /* */ });

        }

    }


    /* =====================================================
       اللمس والتحكم
    ===================================================== */

    function onFeedClick(event) {

        var actionBtn = event.target.closest("[data-act]");

        if (actionBtn) {

            var slide = actionBtn.closest(".nt-reel");

            var act = actionBtn.getAttribute("data-act");

            if (act === "like") {
                setLike(slide, false);
            } else if (act === "download") {
                downloadClip(slide);
            } else {
                shareClip(slide);
            }

            return;

        }

        var tap = event.target.closest(".nt-reel-tap");

        if (!tap) {
            return;
        }

        var el = tap.closest(".nt-reel");
        var now = Date.now();

        /* ضغطتين سريعتين = أعجبني */
        if (lastTapEl === el && now - lastTapAt < 300) {

            clearTimeout(tapTimer);

            lastTapAt = 0;

            setLike(el, true);
            burst(el);

            return;

        }

        lastTapAt = now;
        lastTapEl = el;

        clearTimeout(tapTimer);

        tapTimer = setTimeout(function () {
            togglePause(el);
        }, 280);

    }

    function step(direction) {

        if (!active) {
            return;
        }

        var target = active;

        do {

            target = direction > 0 ? target.nextElementSibling : target.previousElementSibling;

        } while (target && target.hidden);

        if (target) {

            feed.scrollTo({ top: target.offsetTop, behavior: "smooth" });

        }

    }

    document.addEventListener("keydown", function (event) {

        if (!pageActive || event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }

        var tag = event.target && event.target.tagName;

        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (event.target && event.target.isContentEditable)) {
            return;
        }

        if (document.querySelector(".nt-pf-overlay:not([hidden])")) {
            return;
        }

        if (event.key === "ArrowDown" || event.key === "PageDown" || event.key === "j") {

            event.preventDefault();
            step(1);

        } else if (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "k") {

            event.preventDefault();
            step(-1);

        } else if (event.key === " " && active) {

            event.preventDefault();
            togglePause(active);

        } else if (event.key === "m" || event.key === "M") {

            setMuted(!muted, true);

        }

    });


    /* =====================================================
       الفيد (دفعات لا نهائية)
    ===================================================== */

    function appendBatch() {

        var pool = clips.filter(function (clip) { return !bad[clip.id]; });

        if (!pool.length) {

            checkEmpty();

            return;

        }

        pool = shuffle(pool);

        /* نتفادى إن نفس المقطع يتكرر ورا بعضه مرتين */
        if (pool.length > 1 && pool[0].id === lastBatchId) {

            var swap = pool.length - 1;
            var first = pool[0];

            pool[0] = pool[swap];
            pool[swap] = first;

        }

        pool.forEach(function (clip) {

            var el = makeSlide(clip, all.length);

            all.push(el);

            feed.appendChild(el);

            if (io) {
                io.observe(el);
            }

        });

        lastBatchId = pool[pool.length - 1].id;

    }

    function buildFeed() {

        built = true;

        if (!clips.length) {

            stage.classList.add("nt-reels-empty");

            return;

        }

        io = new IntersectionObserver(function (entries) {

            if (!pageActive) {
                return;
            }

            entries.forEach(function (entry) {

                if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
                    activate(entry.target);
                }

            });

        }, { root: feed, threshold: [0.65] });

        appendBatch();

    }


    /* =====================================================
       المقاس: بنحسب الارتفاع بالظبط (النافبار فوق، ومشغّل
       القارئ تحت لو ظاهر) عشان مقطع واحد يملا الشاشة.
    ===================================================== */

    function syncPlayer() {

        document.body.classList.add("nt-reels-hide-player");

        layout();

    }

    function layout() {

        if (!stage || !pageActive) {
            return;
        }

        /* شاشة كاملة: النافبار ومشغّل القارئ مخفيين، فالمقطع ياخد الارتفاع كله */
        var height = Math.max(320, window.innerHeight);

        stage.style.height = height + "px";
        stage.style.setProperty("--nt-yt-w", Math.round(height * 16 / 9) + "px");

    }

    window.addEventListener("resize", layout);
    window.addEventListener("orientationchange", layout);

    if (hasReciter()) {

        ["play", "pause", "ended"].forEach(function (name) {

            audio.addEventListener(name, function () {

                if (pageActive) {
                    syncPlayer();
                }

            });

        });

    }


    /* =====================================================
       دخول / خروج من الصفحة
    ===================================================== */

    function onShow() {

        if (pageActive) {
            return;
        }

        pageActive = true;

        document.body.classList.add("nt-reels-open");

        window.scrollTo(0, 0);

        syncPlayer();

        if (!built) {

            buildFeed();

        } else if (active && !active.hidden) {

            playSlide(active);

        }

    }

    function onHide() {

        if (!pageActive) {
            return;
        }

        pageActive = false;

        document.body.classList.remove("nt-reels-open", "nt-reels-hide-player");

        stage.style.height = "";

        suspend(active);

    }

    document.addEventListener("visibilitychange", function () {

        if (!pageActive || !active) {
            return;
        }

        if (document.visibilityState === "hidden") {

            suspend(active);

        } else if (!active._userPaused) {

            playSlide(active);

        }

    });


    /* =====================================================
       ربط الواجهة: كارت في الرئيسية + لينك في النافبار
    ===================================================== */

    function addEntryPoints() {

        var grid = document.querySelector("#ntHomeFeatures .nt-grid");

        if (grid) {

            var card = document.createElement("a");

            card.className = "nt-feature";
            card.href = "#reels";

            card.innerHTML =
                '<span class="nt-feature-icon">🎬</span>' +
                '<span class="nt-feature-text">' +
                    '<strong>مقتطفات</strong>' +
                    '<small>مقاطع دينية قصيرة، اسحب لفوق وكمّل</small>' +
                '</span>';

            grid.appendChild(card);

        }

        if (!SHOW_IN_NAVBAR) {
            return;
        }

        var navLinks = document.querySelector(".nav-links");

        if (navLinks) {

            var link = document.createElement("a");

            link.href = "#reels";
            link.className = "nav-link";
            link.innerHTML = "<span>🎬</span> مقتطفات";

            var toolsLink = navLinks.querySelector('a[href="#tools"]');

            navLinks.insertBefore(link, toolsLink || null);

        }

        var mobileNav = document.getElementById("mobileNav");

        if (mobileNav) {

            var item = document.createElement("a");

            item.href = "#reels";
            item.textContent = "🎬 مقتطفات";

            mobileNav.insertBefore(item, mobileNav.querySelector(".nt-nav-group-label"));

        }

    }


    /* =====================================================
       تشغيل
    ===================================================== */

    function init() {

        buildSection();
        addEntryPoints();

        /* راوتر pages.js بيحط/يشيل nt-page-active على السكشن: بنتابعه */
        new MutationObserver(function () {

            if (section.classList.contains("nt-page-active")) {
                onShow();
            } else {
                onHide();
            }

        }).observe(section, { attributes: true, attributeFilter: ["class"] });

        /* لو التطبيق اتفتح على #reels مباشرة، الراوتر كان لسه معرفش السكشن */
        if (location.hash === "#reels") {
            window.dispatchEvent(new Event("hashchange"));
        }

    }

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", init);

    } else {

        init();

    }

})();