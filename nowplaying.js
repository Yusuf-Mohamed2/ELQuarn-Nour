/* =========================================================
   NOWPLAYING.JS  —  نور التلاوة
   =========================================================
   شاشة "يتم التشغيل الآن" كاملة (زي تطبيقات القرآن): بتتفتح لما
   تدوس على صورة الشيخ أو اسم السورة في شريط التشغيل اللي تحت.
   فيها: صورة الشيخ، اسمه، اسم السورة، الآية اللي بتتقرأ دلوقتي
   في النص، شريط التقدم، وأزرار التحكم.

   إضافي بالكامل: بيقرا من متغيرات app.js (audio, selectedReader,
   selectedSurah, currentAyahTimings...) وأزراره بتدوس على نفس
   أزرار الشريط الأصلية، فمفيش منطق مكرر.
========================================================= */

(function () {

    "use strict";

    const bar = document.querySelector(".now-playing");

    if (!bar) {
        return;
    }

    const surahTextCache = new Map();

    let root = null;
    let isOpen = false;
    let shownAyahKey = "";
    let shownCoverKey = "";
    let seeking = false;

    const $ = id => document.getElementById(id);


    /* ---------------------------------------------------
       بناء الواجهة (مرة واحدة)
    --------------------------------------------------- */

    function build() {

        root = document.createElement("div");

        root.className = "nt-np";
        root.id = "ntNp";
        root.hidden = true;
        root.setAttribute("role", "dialog");
        root.setAttribute("aria-modal", "true");
        root.setAttribute("aria-label", "يتم التشغيل الآن");

        root.innerHTML = `
            <div class="nt-np-top">
                <button type="button" class="nt-np-close" id="ntNpClose" aria-label="إغلاق">⌄</button>
                <span class="nt-np-top-title">يتم التشغيل الآن</span>
                <span class="nt-np-top-spacer"></span>
            </div>

            <div class="nt-np-body">

                <div class="nt-np-head">
                    <div class="nt-np-cover" id="ntNpCover">📖</div>
                    <div class="nt-np-titles">
                        <h2 class="nt-np-reader" id="ntNpReader">لم يتم اختيار قارئ</h2>
                        <p class="nt-np-surah" id="ntNpSurah">لم يتم اختيار سورة</p>
                    </div>
                </div>

                <div class="nt-np-ayah-card">
                    <div class="nt-np-ayah-meta" id="ntNpAyahMeta"></div>
                    <div class="nt-np-ayah-scroll" id="ntNpAyahScroll">
                        <div class="nt-np-ayah-text" id="ntNpAyahText"></div>
                    </div>
                </div>

            </div>

            <div class="nt-np-bottom">

                <div class="nt-np-progress">
                    <span class="nt-np-time" id="ntNpCur">00:00</span>
                    <input type="range" class="nt-np-seek" id="ntNpSeek"
                           min="0" max="100" step="0.1" value="0">
                    <span class="nt-np-time" id="ntNpDur">00:00</span>
                </div>

                <div class="nt-np-controls">
                    <button type="button" class="nt-np-btn" id="ntNpPrev" aria-label="السورة السابقة">⏮</button>
                    <button type="button" class="nt-np-btn nt-np-play" id="ntNpPlay" aria-label="تشغيل / إيقاف">▶</button>
                    <button type="button" class="nt-np-btn" id="ntNpNext" aria-label="السورة التالية">⏭</button>
                </div>

                <div class="nt-np-extras">
                    <button type="button" class="nt-np-btn nt-np-small" id="ntNpRepeat" aria-label="تكرار الآية">🔁</button>
                    <button type="button" class="nt-np-btn nt-np-small" id="ntNpMode" aria-label="وضع التشغيل">📋</button>
                    <button type="button" class="nt-np-btn nt-np-small" id="ntNpDownload" aria-label="تنزيل للاستماع بدون نت">⬇️</button>
                </div>

            </div>
        `;

        document.body.appendChild(root);

        $("ntNpClose").addEventListener("click", close);

        const proxy = (id, target) => {

            $(id).addEventListener("click", () => {

                const original = document.getElementById(target);

                if (original) {
                    original.click();
                }

                setTimeout(sync, 60);

            });

        };

        proxy("ntNpPlay", "mainPlayBtn");
        proxy("ntNpPrev", "previousBtn");
        proxy("ntNpNext", "nextBtn");
        proxy("ntNpRepeat", "repeatBtn");
        proxy("ntNpMode", "playModeBtn");
        proxy("ntNpDownload", "downloadReaderBtn");

        const seek = $("ntNpSeek");

        seek.addEventListener("input", () => {

            seeking = true;

            $("ntNpCur").textContent = fmt(Number(seek.value));

        });

        seek.addEventListener("change", () => {

            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                audio.currentTime = Number(seek.value);
            }

            seeking = false;

        });

        document.addEventListener("keydown", event => {

            if (event.key === "Escape" && isOpen) {
                close();
            }

        });

        /* أي تغيير في نص/حالة الأزرار الأصلية (زي نسبة التنزيل) ينعكس هنا */
        if (typeof MutationObserver !== "undefined") {

            const observer = new MutationObserver(() => {

                if (isOpen) {
                    syncButtons();
                }

            });

            ["mainPlayBtn", "repeatBtn", "playModeBtn", "downloadReaderBtn"]
                .forEach(id => {

                    const node = document.getElementById(id);

                    if (node) {

                        observer.observe(node, {
                            attributes: true,
                            childList: true,
                            characterData: true,
                            subtree: true
                        });

                    }

                });

        }

    }


    function fmt(seconds) {

        return typeof formatPlayerTime === "function"
            ? formatPlayerTime(seconds)
            : "00:00";

    }


    /* ---------------------------------------------------
       فتح / قفل
    --------------------------------------------------- */

    function open() {

        if (!selectedReader && !selectedSurah) {

            if (typeof showToast === "function") {
                showToast("اختر القارئ والسورة الأول");
            }

            return;

        }

        if (!root) {
            build();
        }

        isOpen = true;
        shownAyahKey = "";
        shownCoverKey = "";

        root.hidden = false;

        requestAnimationFrame(() => root.classList.add("nt-np-open"));

        document.body.classList.add("nt-np-lock");

        sync();

    }


    function close() {

        if (!root) {
            return;
        }

        isOpen = false;

        root.classList.remove("nt-np-open");

        document.body.classList.remove("nt-np-lock");

        setTimeout(() => {

            if (!isOpen) {
                root.hidden = true;
            }

        }, 250);

    }


    /* ---------------------------------------------------
       نص الآية
    --------------------------------------------------- */

    function loadSurahText(surah) {

        if (!surah) {
            return Promise.resolve(null);
        }

        if (surahTextCache.has(surah.id)) {
            return surahTextCache.get(surah.id);
        }

        const base =
            typeof QURAN_API === "string"
                ? QURAN_API
                : "https://api.alquran.cloud/v1/surah";

        const promise =
            fetch(`${base}/${surah.id}/quran-uthmani`)
                .then(response => (response.ok ? response.json() : null))
                .then(data => {

                    const ayahs = (data && data.data && data.data.ayahs) || [];

                    if (!ayahs.length) {
                        throw new Error("empty");
                    }

                    return ayahs.map(item => {

                        let text = String(item.text || "");

                        if (
                            surah.id !== 1 &&
                            window.NT &&
                            typeof window.NT.stripBasmala === "function"
                        ) {
                            text = window.NT.stripBasmala(text);
                        }

                        return {
                            number: item.numberInSurah,
                            text: text.trim()
                        };

                    });

                })
                .catch(() => {

                    surahTextCache.delete(surah.id);

                    return null;

                });

        surahTextCache.set(surah.id, promise);

        return promise;

    }


    /* رقم الآية اللي بتتقرأ دلوقتي */
    function currentAyahNumber() {

        try {

            if (
                currentAyahTimings.length &&
                selectedSurah &&
                timingSurahId === selectedSurah.id
            ) {

                const time =
                    Math.max(
                        0,
                        Number(audio.currentTime) -
                        (typeof HIGHLIGHT_LAG_SECONDS === "number" ? HIGHLIGHT_LAG_SECONDS : 0)
                    );

                const hit =
                    currentAyahTimings.find(item =>
                        time >= item.start && time < item.end
                    );

                if (hit) {
                    return hit.ayah;
                }

                const previous =
                    [...currentAyahTimings]
                        .reverse()
                        .find(item => time >= item.start);

                if (previous) {
                    return previous.ayah;
                }

                return currentAyahTimings[0].ayah;

            }

            if (activeAyahIndex >= 0) {
                return activeAyahIndex + 1;
            }

            if (selectedAyah) {
                return Number(selectedAyah);
            }

        } catch (error) { /* */ }

        return null;

    }


    function renderAyah() {

        const meta = $("ntNpAyahMeta");
        const textEl = $("ntNpAyahText");
        const scroll = $("ntNpAyahScroll");

        if (!selectedSurah) {

            meta.textContent = "";
            textEl.textContent = "";

            return;

        }

        const number = currentAyahNumber();

        const key = `${selectedSurah.id}:${number || 0}`;

        if (key === shownAyahKey) {
            return;
        }

        shownAyahKey = key;

        if (!number) {

            meta.textContent = "";

            textEl.classList.add("nt-np-hint");

            textEl.textContent =
                "هتظهر هنا الآية اللي بيقرأها الشيخ أول ما تبدأ التلاوة";

            return;

        }

        textEl.classList.remove("nt-np-hint");

        meta.textContent =
            `سورة ${selectedSurah.name} • الآية ${number}`;

        const surah = selectedSurah;

        loadSurahText(surah).then(list => {

            /* لو الآية اتغيرت وإحنا بنحمّل، منرسمش القديمة */
            if (shownAyahKey !== key) {
                return;
            }

            const item =
                list && list.find(entry => entry.number === number);

            if (!item) {

                textEl.classList.add("nt-np-hint");

                textEl.textContent =
                    "تعذر تحميل نص الآية، اتأكد من الإنترنت";

                return;

            }

            textEl.classList.remove("nt-np-hint");

            textEl.textContent = item.text;

            const badge = document.createElement("span");

            badge.className = "nt-np-ayah-num";
            badge.textContent = number;

            textEl.appendChild(document.createTextNode(" "));
            textEl.appendChild(badge);

            scroll.scrollTop = 0;

            textEl.classList.remove("nt-np-fade");

            void textEl.offsetWidth;

            textEl.classList.add("nt-np-fade");

        });

    }


    /* ---------------------------------------------------
       مزامنة الشاشة مع حالة المشغل
    --------------------------------------------------- */

    function renderCover() {

        const cover = $("ntNpCover");

        const key =
            selectedReader ? selectedReader.id : "none";

        if (key === shownCoverKey) {
            return;
        }

        shownCoverKey = key;

        cover.innerHTML = "";

        if (selectedReader && selectedReader.photo) {

            const img = document.createElement("img");

            img.src = selectedReader.photo;
            img.alt = selectedReader.name;

            img.onerror = () => {
                cover.textContent = selectedReader.initial || "📖";
            };

            cover.appendChild(img);

        } else {

            cover.textContent =
                selectedReader ? (selectedReader.initial || "📖") : "📖";

        }

    }


    function syncButtons() {

        const mirror = (id, originalId) => {

            const original = document.getElementById(originalId);
            const copy = $(id);

            if (!original || !copy) {
                return;
            }

            copy.textContent = original.textContent;

            copy.classList.toggle(
                "nt-np-active",
                original.classList.contains("active")
            );

            if (original.title) {
                copy.title = original.title;
            }

        };

        mirror("ntNpPlay", "mainPlayBtn");
        mirror("ntNpRepeat", "repeatBtn");
        mirror("ntNpMode", "playModeBtn");
        mirror("ntNpDownload", "downloadReaderBtn");

        const download = document.getElementById("downloadReaderBtn");

        if (download) {
            $("ntNpDownload").disabled = download.disabled;
        }

    }


    function syncProgress() {

        const seek = $("ntNpSeek");

        const hasDuration =
            Number.isFinite(audio.duration) && audio.duration > 0;

        $("ntNpDur").textContent = fmt(hasDuration ? audio.duration : 0);

        if (seeking) {
            return;
        }

        $("ntNpCur").textContent = fmt(audio.currentTime);

        seek.disabled = !hasDuration;
        seek.max = hasDuration ? audio.duration : 0;
        seek.value = hasDuration ? audio.currentTime : 0;

    }


    function sync() {

        if (!isOpen || !root) {
            return;
        }

        $("ntNpReader").textContent =
            selectedReader ? selectedReader.name : "لم يتم اختيار قارئ";

        $("ntNpSurah").textContent =
            selectedSurah ? `سورة ${selectedSurah.name}` : "لم يتم اختيار سورة";

        renderCover();
        renderAyah();
        syncButtons();
        syncProgress();

    }


    ["timeupdate", "play", "pause", "loadedmetadata", "durationchange", "emptied", "ended"]
        .forEach(name => audio.addEventListener(name, sync));


    /* ---------------------------------------------------
       فتح الشاشة بالضغط على الصورة أو الاسم
    --------------------------------------------------- */

    bar.classList.add("nt-np-trigger");

    bar.setAttribute("role", "button");
    bar.setAttribute("tabindex", "0");
    bar.setAttribute("title", "فتح شاشة التشغيل");

    bar.addEventListener("click", open);

    bar.addEventListener("keydown", event => {

        if (event.key === "Enter" || event.key === " ") {

            event.preventDefault();

            open();

        }

    });

    window.NTNowPlaying = { open, close };

})();