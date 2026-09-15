/* =========================================================
   FEATURES.JS  —  نور التلاوة
   =========================================================
   الملف ده طبقة إضافية بالكامل فوق app.js.

   مبدأ أساسي: مفيش سطر واحد هنا بيعدّل سلوك موجود.
   كل حاجة جديدة بتتزرع في الصفحة من الجافاسكريبت نفسه
   (مفيش HTML جديد في index.html غير سطرين: الستايل والسكريبت)،
   وكل الكلاسات بتبدأ بـ nt- فمفيش تعارض مع أي اسم قديم.

   بيستخدم المتغيرات والدوال الموجودة في app.js مباشرة
   (selectedSurah / selectedReader / audio / openMushaf ...)
   لأن كل السكريبتات العادية بتشترك في نفس النطاق العام.

   كل جزء ملفوف في try/catch، فلو حصل أي خطأ في مميزة
   واحدة، باقي التطبيق بيفضل شغال عادي خالص.
========================================================= */

(function () {

    "use strict";

    /* =====================================================
       أدوات مساعدة عامة
    ===================================================== */

    const KAABA_LAT = 21.4225;
    const KAABA_LNG = 39.8262;

    const TOTAL_QURAN_AYAHS =
        surahs.reduce((total, item) => total + item.ayahs, 0);


    function store(key, value) {

        try {

            localStorage.setItem(
                "noorTelawa_" + key,
                JSON.stringify(value)
            );

        } catch (error) {
            /* التخزين مقفول أو ممتلئ */
        }

    }


    function load(key, fallback) {

        try {

            const raw =
                localStorage.getItem("noorTelawa_" + key);

            if (raw === null) {
                return fallback;
            }

            return JSON.parse(raw);

        } catch (error) {
            return fallback;
        }

    }


    function el(tag, className, html) {

        const node =
            document.createElement(tag);

        if (className) {
            node.className = className;
        }

        if (html !== undefined) {
            node.innerHTML = html;
        }

        return node;

    }


    function safeToast(message) {

        try {
            showToast(message);
        } catch (error) {
            console.log(message);
        }

    }


    function vibrate(pattern) {

        try {

            if (navigator.vibrate) {
                navigator.vibrate(pattern);
            }

        } catch (error) {
            /* الجهاز مش داعم */
        }

    }


    /* =====================================================
       1) MEDIA SESSION
       =====================================================
       بيخلي اسم السورة والشيخ يظهروا على شاشة القفل وفي
       مركز الإشعارات، مع أزرار تشغيل/إيقاف/التالي/السابق.
       ده بيخلي التطبيق يحس كأنه تطبيق أصلي على الموبايل.
    ===================================================== */

    function updateMediaSession() {

        try {

            if (!("mediaSession" in navigator)) {
                return;
            }

            if (!selectedSurah) {
                return;
            }

            const readerName =
                selectedReader
                    ? selectedReader.name
                    : "نور التلاوة";

            navigator.mediaSession.metadata =
                new MediaMetadata({

                    title: `سورة ${selectedSurah.name}`,

                    artist: readerName,

                    album: "القرآن الكريم",

                    artwork: [
                        {
                            src: "icon-192.png",
                            sizes: "192x192",
                            type: "image/png"
                        },
                        {
                            src: "icon-512.png",
                            sizes: "512x512",
                            type: "image/png"
                        }
                    ]

                });

        } catch (error) {
            /* المتصفح مش داعم */
        }

    }


    function setupMediaSession() {

        if (!("mediaSession" in navigator)) {
            return;
        }

        const actions = {

            play: () => {

                audio.play().catch(() => {});

            },

            pause: () => {

                audio.pause();

            },

            nexttrack: () => {

                try {
                    playNextSurah();
                } catch (error) { /* */ }

            },

            previoustrack: () => {

                try {
                    playPreviousSurah();
                } catch (error) { /* */ }

            },

            seekbackward: details => {

                audio.currentTime =
                    Math.max(
                        0,
                        audio.currentTime - (details.seekOffset || 10)
                    );

            },

            seekforward: details => {

                if (!Number.isFinite(audio.duration)) {
                    return;
                }

                audio.currentTime =
                    Math.min(
                        audio.duration,
                        audio.currentTime + (details.seekOffset || 10)
                    );

            },

            seekto: details => {

                if (details.fastSeek && audio.fastSeek) {

                    audio.fastSeek(details.seekTime);

                    return;

                }

                audio.currentTime = details.seekTime;

            }

        };


        Object.keys(actions).forEach(action => {

            try {

                navigator.mediaSession.setActionHandler(
                    action,
                    actions[action]
                );

            } catch (error) {
                /* الأكشن ده مش مدعوم في المتصفح ده */
            }

        });


        audio.addEventListener("playing", () => {

            updateMediaSession();

            try {

                navigator.mediaSession.playbackState = "playing";

            } catch (error) { /* */ }

        });


        audio.addEventListener("pause", () => {

            try {

                navigator.mediaSession.playbackState = "paused";

            } catch (error) { /* */ }

        });


        audio.addEventListener("timeupdate", () => {

            try {

                if (
                    !navigator.mediaSession.setPositionState ||
                    !Number.isFinite(audio.duration) ||
                    audio.duration <= 0
                ) {
                    return;
                }

                navigator.mediaSession.setPositionState({
                    duration: audio.duration,
                    playbackRate: audio.playbackRate || 1,
                    position: Math.min(audio.currentTime, audio.duration)
                });

            } catch (error) { /* */ }

        });

    }


    /* =====================================================
       2) سرعة التلاوة
    ===================================================== */

    const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5];

    let playbackSpeed = load("speed", 1);


    function applyPlaybackSpeed(value) {

        playbackSpeed = value;

        store("speed", value);

        try {

            audio.playbackRate = value;

        } catch (error) { /* */ }

    }


    /* نرجّع السرعة لكل ملف جديد بيتحمّل */
    audio.addEventListener("loadedmetadata", () => {

        try {

            audio.playbackRate = playbackSpeed;

        } catch (error) { /* */ }

    });

    applyPlaybackSpeed(playbackSpeed);


    /* =====================================================
       3) مؤقت النوم
    ===================================================== */

    let sleepTimerId = null;
    let sleepTimerEndsAt = null;


    function startSleepTimer(minutes) {

        cancelSleepTimer(true);

        sleepTimerEndsAt =
            Date.now() + (minutes * 60 * 1000);

        sleepTimerId =
            setTimeout(() => {

                sleepTimerId = null;
                sleepTimerEndsAt = null;

                try {
                    audio.pause();
                } catch (error) { /* */ }

                safeToast("انتهى مؤقت النوم، تم إيقاف التلاوة");

            }, minutes * 60 * 1000);

        safeToast(`هيتوقف التشغيل بعد ${minutes} دقيقة`);

    }


    function cancelSleepTimer(silent) {

        if (sleepTimerId) {

            clearTimeout(sleepTimerId);

            sleepTimerId = null;
            sleepTimerEndsAt = null;

            if (!silent) {
                safeToast("تم إلغاء مؤقت النوم");
            }

        }

    }


    function sleepTimerRemainingLabel() {

        if (!sleepTimerEndsAt) {
            return "غير مفعّل";
        }

        const remaining =
            Math.max(0, sleepTimerEndsAt - Date.now());

        const minutes =
            Math.floor(remaining / 60000);

        const seconds =
            Math.floor((remaining % 60000) / 1000);

        return (
            `باقي ${minutes}:${String(seconds).padStart(2, "0")}`
        );

    }


    /* =====================================================
       4) وضع الحفظ
       =====================================================
       بيكرر الآية الحالية عدد مرات محدد وبعدين ينتقل
       تلقائيًا للآية اللي بعدها.

       مهم: بيشتغل بس لما يكون فيه آية محددة وتوقيتات
       متاحة، وبيتوقف تلقائيًا لو زرار التكرار العادي (🔁)
       مفعّل، عشان ميتعارضش مع المنطق الموجود في app.js.
    ===================================================== */

    let memoEnabled = false;
    let memoTarget = load("memoRepeats", 3);
    let memoCount = 0;
    let memoAyah = null;


    function setMemoEnabled(enabled) {

        memoEnabled = enabled;

        memoCount = 0;

        memoAyah =
            selectedAyah
                ? Number(selectedAyah)
                : null;

        if (enabled) {

            if (repeatEnabled) {

                safeToast("اقفل زرار التكرار 🔁 الأول عشان وضع الحفظ يشتغل");

            } else if (!selectedAyah) {

                safeToast("دوس على آية في المصحف الأول، وبعدين شغّل");

            } else {

                safeToast(`وضع الحفظ شغال: كل آية ${memoTarget} مرات`);

            }

        } else {

            safeToast("تم إيقاف وضع الحفظ");

        }

    }


    audio.addEventListener("timeupdate", () => {

        try {

            if (!memoEnabled || repeatEnabled) {
                return;
            }

            if (
                !selectedAyah ||
                selectedAyahEnd ||
                !currentAyahTimings.length ||
                !selectedSurah
            ) {
                return;
            }

            const current = Number(selectedAyah);

            if (memoAyah !== current) {

                memoAyah = current;
                memoCount = 0;

            }

            const timing =
                currentAyahTimings.find(
                    item => item.ayah === current
                );

            if (!timing) {
                return;
            }

            if (audio.currentTime < timing.end - 0.06) {
                return;
            }

            memoCount += 1;

            if (memoCount < memoTarget) {

                audio.currentTime = timing.start;

                return;

            }

            /* خلصنا التكرار: ننتقل للآية اللي بعدها */

            memoCount = 0;

            const next = current + 1;

            const nextTiming =
                currentAyahTimings.find(
                    item => item.ayah === next
                );

            if (!nextTiming || next > selectedSurah.ayahs) {

                audio.pause();

                memoEnabled = false;

                safeToast("خلصت السورة - تم إيقاف وضع الحفظ");

                return;

            }

            setSelectedAyah(next);

            memoAyah = next;

            audio.currentTime = nextTiming.start;

        } catch (error) {
            /* أي مشكلة: منعطلش التشغيل العادي */
        }

    });


    /* =====================================================
       5) حجم خط المصحف + وضع التسميع
    ===================================================== */

    let mushafScale = load("mushafScale", 1);


    function applyMushafScale(value) {

        mushafScale =
            Math.min(1.8, Math.max(0.7, value));

        store("mushafScale", mushafScale);

        document.documentElement.style.setProperty(
            "--nt-mushaf-scale",
            String(mushafScale)
        );

    }


    let hideAyahText = false;


    function applyHideAyahText(enabled) {

        hideAyahText = enabled;

        const page =
            document.getElementById("mushafPage");

        if (!page) {
            return;
        }

        page.classList.toggle("nt-hide-text", enabled);

        if (!enabled) {

            page
                .querySelectorAll(".ayah.nt-revealed")
                .forEach(item => item.classList.remove("nt-revealed"));

        }

    }


    applyMushafScale(mushafScale);


    /* =====================================================
       6) العلامات المرجعية (Bookmarks)
    ===================================================== */

    function getBookmarks() {

        const list = load("bookmarks", []);

        return Array.isArray(list) ? list : [];

    }


    function addBookmark(surahId, ayahNumber, note) {

        const surah = getSurahById(surahId);

        if (!surah) {
            return;
        }

        const list = getBookmarks();

        const exists =
            list.some(item =>
                item.surahId === surah.id &&
                Number(item.ayah) === Number(ayahNumber)
            );

        if (exists) {

            safeToast("العلامة دي محفوظة عندك بالفعل");

            return;

        }

        list.unshift({

            id: "bm_" + Date.now(),

            surahId: surah.id,

            surahName: surah.name,

            ayah: Number(ayahNumber),

            note: note || "",

            readerId:
                selectedReader
                    ? selectedReader.id
                    : null,

            createdAt: Date.now()

        });

        store("bookmarks", list.slice(0, 200));

        vibrate(30);

        safeToast(`تم حفظ علامة عند ${surah.name} - آية ${ayahNumber}`);

    }


    function removeBookmark(id) {

        store(
            "bookmarks",
            getBookmarks().filter(item => item.id !== id)
        );

    }


    async function openBookmark(bookmark) {

        const surah = getSurahById(bookmark.surahId);

        if (!surah) {
            return;
        }

        closeSheet();

        if (bookmark.readerId) {

            const reader = getReaderById(bookmark.readerId);

            if (reader) {
                selectReader(reader);
            }

        }

        await openMushaf(surah, true);

        setSelectedAyah(bookmark.ayah);

        scrollToAyah(bookmark.ayah, true);

    }


    function scrollToAyah(ayahNumber, mark) {

        requestAnimationFrame(() => {

            const page =
                document.getElementById("mushafPage");

            if (!page) {
                return;
            }

            const target =
                page.querySelector(
                    `.ayah[data-number="${ayahNumber}"]`
                );

            if (!target) {
                return;
            }

            target.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            if (mark) {

                page
                    .querySelectorAll(".ayah.tap-selected")
                    .forEach(item => item.classList.remove("tap-selected"));

                target.classList.add("tap-selected");

            }

        });

    }


    /* =====================================================
       7) الورد اليومي / خطة الختمة
       =====================================================
       بنحسب بالآيات مش بالصفحات، عشان الحساب يبقى دقيق
       وشغال من غير نت تمامًا (عندنا عدد آيات كل سورة في
       data.js أصلاً).
    ===================================================== */

    /* تحويل: رقم آية مطلق (1 .. 6236) <-> سورة + آية */

    function absoluteToPosition(absolute) {

        let remaining = absolute;

        for (let index = 0; index < surahs.length; index++) {

            const surah = surahs[index];

            if (remaining <= surah.ayahs) {

                return {
                    surah: surah,
                    ayah: Math.max(1, remaining)
                };

            }

            remaining -= surah.ayahs;

        }

        const last = surahs[surahs.length - 1];

        return {
            surah: last,
            ayah: last.ayahs
        };

    }


    function getWirdPlan() {

        return load("wird", null);

    }


    function startWirdPlan(days) {

        const plan = {

            days: days,

            perDay: Math.ceil(TOTAL_QURAN_AYAHS / days),

            position: 1,

            startedAt: Date.now(),

            lastDoneOn: null

        };

        store("wird", plan);

        safeToast(`تم إنشاء خطة ختمة في ${days} يوم`);

        return plan;

    }


    function completeTodayWird() {

        const plan = getWirdPlan();

        if (!plan) {
            return;
        }

        plan.position =
            Math.min(
                TOTAL_QURAN_AYAHS + 1,
                plan.position + plan.perDay
            );

        plan.lastDoneOn = todayKey();

        store("wird", plan);

        if (plan.position > TOTAL_QURAN_AYAHS) {

            safeToast("تقبل الله منك، تمت الختمة 🌙");

        } else {

            safeToast("تم تسجيل ورد اليوم، بارك الله فيك");

        }

    }


    function todayKey() {

        const now = new Date();

        return (
            `${now.getFullYear()}-` +
            `${now.getMonth() + 1}-` +
            `${now.getDate()}`
        );

    }


    async function openTodayWird() {

        const plan = getWirdPlan();

        if (!plan || plan.position > TOTAL_QURAN_AYAHS) {
            return;
        }

        const start =
            absoluteToPosition(plan.position);

        closeSheet();

        await openMushaf(start.surah, true);

        setSelectedAyah(start.ayah);

        scrollToAyah(start.ayah, true);

    }


    /* =====================================================
       8) التفسير والترجمة
    ===================================================== */

    const ayahInfoCache = {};


    async function fetchAyahInfo(surahId, ayahNumber) {

        const key = `${surahId}:${ayahNumber}`;

        if (ayahInfoCache[key]) {
            return ayahInfoCache[key];
        }

        const response =
            await fetch(
                "https://api.alquran.cloud/v1/ayah/" +
                `${key}/editions/quran-uthmani,ar.muyassar,en.sahih`
            );

        if (!response.ok) {
            throw new Error("tafsir request failed");
        }

        const payload = await response.json();

        const editions = payload?.data || [];

        const result = {

            arabic:
                editions.find(item =>
                    item.edition?.identifier === "quran-uthmani"
                )?.text || "",

            tafsir:
                editions.find(item =>
                    item.edition?.identifier === "ar.muyassar"
                )?.text || "",

            translation:
                editions.find(item =>
                    item.edition?.identifier === "en.sahih"
                )?.text || ""

        };

        ayahInfoCache[key] = result;

        /* بنخزنها كمان محليًا عشان تفضل متاحة من غير نت */
        const offline = load("ayahInfo", {});

        offline[key] = result;

        store("ayahInfo", offline);

        return result;

    }


    function readOfflineAyahInfo(surahId, ayahNumber) {

        const offline = load("ayahInfo", {});

        return offline[`${surahId}:${ayahNumber}`] || null;

    }


    async function showAyahInfo(surahId, ayahNumber, mode) {

        const surah = getSurahById(surahId);

        openSheet(
            mode === "translation"
                ? `الترجمة - ${surah ? surah.name : ""} ${ayahNumber}`
                : `التفسير - ${surah ? surah.name : ""} ${ayahNumber}`,
            `<div class="nt-empty">جاري التحميل...</div>`
        );

        let info = null;

        try {

            info = await fetchAyahInfo(surahId, ayahNumber);

        } catch (error) {

            info = readOfflineAyahInfo(surahId, ayahNumber);

        }

        if (!info) {

            setSheetBody(
                `<div class="nt-empty">
                    تعذر تحميل المحتوى. تأكد من الإنترنت وحاول تاني.
                 </div>`
            );

            return;

        }

        const body =
            mode === "translation"
                ? info.translation
                : info.tafsir;

        setSheetBody(`
            <div class="nt-card">
                <h4>الآية</h4>
                <div style="font-family:'Amiri Quran','Amiri',serif;font-size:22px;line-height:2.1;">
                    ${escapeHtml(info.arabic)}
                </div>
            </div>

            <div class="nt-card">
                <h4>${mode === "translation" ? "المعنى بالإنجليزية" : "التفسير الميسّر"}</h4>
                <div class="nt-muted" style="font-size:14px;${mode === "translation" ? "direction:ltr;text-align:left;" : ""}">
                    ${escapeHtml(body || "غير متاح لهذه الآية")}
                </div>
            </div>
        `);

    }


    /* =====================================================
       9) البحث داخل المصحف
    ===================================================== */

    async function searchQuranText(keyword) {

        setSheetBody(`<div class="nt-empty">جاري البحث...</div>`);

        try {

            const response =
                await fetch(
                    "https://api.alquran.cloud/v1/search/" +
                    encodeURIComponent(keyword) +
                    "/all/quran-uthmani"
                );

            if (!response.ok) {
                throw new Error("search failed");
            }

            const payload = await response.json();

            const matches =
                payload?.data?.matches || [];

            renderSearchResults(keyword, matches);

        } catch (error) {

            setSheetBody(`
                <div class="nt-empty">
                    تعذر البحث دلوقتي. البحث في نص المصحف محتاج إنترنت.
                </div>
                ${searchFormHtml(keyword)}
            `);

            bindSearchForm();

        }

    }


    function searchFormHtml(value) {

        return `
            <div class="nt-card">
                <h4>ابحث في نص المصحف</h4>
                <input
                    class="nt-input"
                    id="ntSearchInput"
                    placeholder="مثلاً: الصابرين"
                    value="${escapeHtml(value || "")}">
                <div class="nt-row" style="margin-top:10px;">
                    <button class="nt-btn nt-primary" id="ntSearchGo">بحث</button>
                </div>
            </div>
        `;

    }


    function bindSearchForm() {

        const input =
            document.getElementById("ntSearchInput");

        const button =
            document.getElementById("ntSearchGo");

        if (!input || !button) {
            return;
        }

        const run = () => {

            const value = input.value.trim();

            if (value.length < 2) {

                safeToast("اكتب كلمة من حرفين على الأقل");

                return;

            }

            searchQuranText(value);

        };

        button.addEventListener("click", run);

        input.addEventListener("keydown", event => {

            if (event.key === "Enter") {

                event.preventDefault();

                run();

            }

        });

        input.focus();

    }


    function renderSearchResults(keyword, matches) {

        if (!matches.length) {

            setSheetBody(`
                <div class="nt-empty">مفيش نتائج لكلمة "${escapeHtml(keyword)}"</div>
                ${searchFormHtml(keyword)}
            `);

            bindSearchForm();

            return;

        }

        const items =
            matches
                .slice(0, 60)
                .map(match => `
                    <div class="nt-list-item">
                        <div class="nt-list-main">
                            <strong>${escapeHtml(match.surah?.name || "")} - آية ${match.numberInSurah}</strong>
                            <div class="nt-muted"
                                 style="font-family:'Amiri Quran','Amiri',serif;font-size:16px;">
                                ${escapeHtml(match.text || "")}
                            </div>
                        </div>
                        <button class="nt-btn"
                                data-nt-open-ayah="${match.surah?.number}:${match.numberInSurah}">
                            افتح
                        </button>
                    </div>
                `)
                .join("");

        setSheetBody(`
            <div class="nt-muted" style="margin-bottom:10px;">
                ${matches.length} نتيجة لكلمة "${escapeHtml(keyword)}"
                ${matches.length > 60 ? " (بنعرض أول 60)" : ""}
            </div>
            ${items}
            ${searchFormHtml(keyword)}
        `);

        bindSearchForm();

    }


    /* =====================================================
       10) إدارة التنزيلات
    ===================================================== */

    async function renderDownloads() {

        setSheetBody(`<div class="nt-empty">جاري القراءة...</div>`);

        if (!("caches" in window)) {

            setSheetBody(
                `<div class="nt-empty">المتصفح ده مش بيدعم التخزين للاستماع بدون نت</div>`
            );

            return;

        }

        try {

            const cache =
                await caches.open("quran-audio-v1");

            const requests =
                await cache.keys();

            let usageLabel = "";

            try {

                if (navigator.storage && navigator.storage.estimate) {

                    const estimate =
                        await navigator.storage.estimate();

                    usageLabel =
                        `المساحة المستخدمة من التطبيق كله: ` +
                        `${(estimate.usage / (1024 * 1024)).toFixed(1)} ميجا`;

                }

            } catch (error) { /* */ }


            if (!requests.length) {

                setSheetBody(`
                    <div class="nt-empty">
                        مفيش تلاوات متخزنة للاستماع بدون نت لحد دلوقتي.
                        <br><br>
                        أي سورة بتسمعها بتتخزن تلقائيًا، أو استخدم زرار ⬇️
                        في المشغّل لتنزيل الشيخ كامل.
                    </div>
                `);

                return;

            }


            /* بنجمّع الملفات حسب المجلد (كل مجلد = تسجيل شيخ) */
            const groups = {};

            requests.forEach(request => {

                const url = new URL(request.url);

                const parts =
                    url.pathname.split("/").filter(Boolean);

                const fileName =
                    parts.pop() || "";

                const folder =
                    url.origin + "/" + parts.join("/");

                if (!groups[folder]) {

                    groups[folder] = {
                        folder: folder,
                        files: []
                    };

                }

                groups[folder].files.push({
                    url: request.url,
                    surahId: parseInt(fileName, 10) || null
                });

            });


            const groupHtml =
                Object.values(groups)
                    .map((group, index) => {

                        const names =
                            group.files
                                .map(file => {

                                    const surah =
                                        file.surahId
                                            ? getSurahById(file.surahId)
                                            : null;

                                    return surah ? surah.name : "";

                                })
                                .filter(Boolean)
                                .slice(0, 6)
                                .join("، ");

                        return `
                            <div class="nt-list-item">
                                <div class="nt-list-main">
                                    <strong>${group.files.length} سورة محفوظة</strong>
                                    <div class="nt-muted" style="word-break:break-all;">
                                        ${escapeHtml(names)}${group.files.length > 6 ? "..." : ""}
                                    </div>
                                </div>
                                <button class="nt-btn nt-danger"
                                        data-nt-del-folder="${index}">
                                    مسح
                                </button>
                            </div>
                        `;

                    })
                    .join("");


            setSheetBody(`
                <div class="nt-card">
                    <h4>التلاوات المحفوظة</h4>
                    <div class="nt-muted">
                        إجمالي ${requests.length} ملف صوتي متاح بدون إنترنت.
                        <br>${escapeHtml(usageLabel)}
                    </div>
                </div>

                ${groupHtml}

                <div class="nt-row" style="margin-top:14px;">
                    <button class="nt-btn nt-danger" id="ntClearAllAudio">
                        مسح كل التلاوات المحفوظة
                    </button>
                </div>
            `);


            const groupList = Object.values(groups);

            document
                .querySelectorAll("[data-nt-del-folder]")
                .forEach(button => {

                    button.addEventListener("click", async () => {

                        const group =
                            groupList[
                                Number(button.dataset.ntDelFolder)
                            ];

                        if (!group) {
                            return;
                        }

                        for (const file of group.files) {
                            await cache.delete(file.url);
                        }

                        safeToast("تم المسح");

                        notifyCacheChanged();

                        renderDownloads();

                    });

                });


            const clearAll =
                document.getElementById("ntClearAllAudio");

            if (clearAll) {

                clearAll.addEventListener("click", async () => {

                    for (const request of requests) {
                        await cache.delete(request);
                    }

                    safeToast("تم مسح كل التلاوات المحفوظة");

                    notifyCacheChanged();

                    renderDownloads();

                });

            }

        } catch (error) {

            setSheetBody(
                `<div class="nt-empty">تعذر قراءة التنزيلات</div>`
            );

        }

    }


    function notifyCacheChanged() {

        try {

            if (
                navigator.serviceWorker &&
                navigator.serviceWorker.controller
            ) {

                navigator.serviceWorker.controller.postMessage({
                    type: "REFRESH_AUDIO_INDEX"
                });

            }

        } catch (error) { /* */ }

    }


    /* =====================================================
       11) القبلة
    ===================================================== */

    function qiblaBearing(lat, lng) {

        const toRad = value => value * Math.PI / 180;
        const toDeg = value => value * 180 / Math.PI;

        const phi1 = toRad(lat);
        const phi2 = toRad(KAABA_LAT);

        const deltaLambda =
            toRad(KAABA_LNG - lng);

        const y =
            Math.sin(deltaLambda) * Math.cos(phi2);

        const x =
            Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

        return (toDeg(Math.atan2(y, x)) + 360) % 360;

    }


    let qiblaOrientationHandler = null;


    function stopQiblaCompass() {

        if (!qiblaOrientationHandler) {
            return;
        }

        window.removeEventListener(
            "deviceorientationabsolute",
            qiblaOrientationHandler
        );

        window.removeEventListener(
            "deviceorientation",
            qiblaOrientationHandler
        );

        qiblaOrientationHandler = null;

    }


    function renderQibla() {

        const saved = load("qiblaLocation", null);

        setSheetBody(`
            <div class="nt-card">
                <h4>اتجاه القبلة</h4>
                <div class="nt-muted" id="ntQiblaStatus">
                    ${saved
                        ? "اتجاه القبلة محسوب من آخر موقع محفوظ"
                        : "محتاجين موقعك مرة واحدة بس عشان نحسب الاتجاه"}
                </div>
            </div>

            <div class="nt-compass">
                <div class="nt-compass-needle" id="ntQiblaNeedle">
                    <span class="nt-compass-kaaba">🕋</span>
                </div>
                <div class="nt-compass-center"></div>
            </div>

            <div class="nt-muted" style="text-align:center;" id="ntQiblaDegrees"></div>

            <div class="nt-row" style="margin-top:14px;justify-content:center;">
                <button class="nt-btn nt-primary" id="ntQiblaLocate">
                    حدّد موقعي
                </button>
            </div>

            <div class="nt-card" style="margin-top:14px;">
                <div class="nt-muted">
                    حط الموبايل مسطّح في إيدك وادّور حوالين نفسك لحد ما
                    علامة 🕋 تبقى قدامك. لو جهازك مش فيه بوصلة، استخدم
                    الدرجة المكتوبة تحت مع بوصلة عادية.
                </div>
            </div>
        `);


        const locateButton =
            document.getElementById("ntQiblaLocate");

        if (locateButton) {

            locateButton.addEventListener("click", () => {

                if (!navigator.geolocation) {

                    safeToast("المتصفح مش بيدعم تحديد الموقع");

                    return;

                }

                safeToast("جاري تحديد موقعك...");

                navigator.geolocation.getCurrentPosition(

                    position => {

                        const location = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };

                        store("qiblaLocation", location);

                        applyQibla(location);

                    },

                    () => {

                        safeToast("لم نتمكن من تحديد موقعك");

                    },

                    { timeout: 10000, maximumAge: 600000 }

                );

            });

        }


        if (saved) {
            applyQibla(saved);
        }

    }


    function applyQibla(location) {

        const bearing =
            qiblaBearing(location.lat, location.lng);

        const degreesLabel =
            document.getElementById("ntQiblaDegrees");

        if (degreesLabel) {

            degreesLabel.textContent =
                `القبلة على ${bearing.toFixed(1)}° من الشمال`;

        }

        const needle =
            document.getElementById("ntQiblaNeedle");

        if (!needle) {
            return;
        }

        /* من غير بوصلة: بنوري الاتجاه بالنسبة للشمال */
        needle.style.transform =
            `rotate(${bearing}deg)`;


        stopQiblaCompass();

        qiblaOrientationHandler = event => {

            let heading = null;

            if (typeof event.webkitCompassHeading === "number") {

                heading = event.webkitCompassHeading;

            } else if (
                typeof event.alpha === "number" &&
                event.absolute !== false
            ) {

                heading = 360 - event.alpha;

            }

            if (heading === null) {
                return;
            }

            const liveNeedle =
                document.getElementById("ntQiblaNeedle");

            if (!liveNeedle) {

                stopQiblaCompass();

                return;

            }

            liveNeedle.style.transform =
                `rotate(${bearing - heading}deg)`;

            const status =
                document.getElementById("ntQiblaStatus");

            if (status) {

                status.textContent =
                    "البوصلة شغالة - لف بالموبايل لحد ما 🕋 تبقى لفوق";

            }

        };


        const startListening = () => {

            window.addEventListener(
                "deviceorientationabsolute",
                qiblaOrientationHandler
            );

            window.addEventListener(
                "deviceorientation",
                qiblaOrientationHandler
            );

        };


        try {

            if (
                typeof DeviceOrientationEvent !== "undefined" &&
                typeof DeviceOrientationEvent.requestPermission === "function"
            ) {

                DeviceOrientationEvent
                    .requestPermission()
                    .then(result => {

                        if (result === "granted") {
                            startListening();
                        }

                    })
                    .catch(() => {});

            } else {

                startListening();

            }

        } catch (error) { /* */ }

    }


    /* =====================================================
       12) السبحة
    ===================================================== */

    const TASBEEH_PRESETS = [
        { text: "سبحان الله", target: 33 },
        { text: "الحمد لله", target: 33 },
        { text: "الله أكبر", target: 34 },
        { text: "لا إله إلا الله", target: 100 },
        { text: "أستغفر الله", target: 100 },
        { text: "اللهم صل على محمد", target: 100 }
    ];


    function renderTasbeeh() {

        const state =
            load("tasbeeh", { index: 0, count: 0 });

        const preset =
            TASBEEH_PRESETS[state.index] || TASBEEH_PRESETS[0];

        setSheetBody(`
            <div class="nt-row" style="margin-bottom:12px;">
                ${TASBEEH_PRESETS.map((item, index) => `
                    <button class="nt-chip ${index === state.index ? "nt-active" : ""}"
                            data-nt-tasbeeh="${index}">
                        ${escapeHtml(item.text)}
                    </button>
                `).join("")}
            </div>

            <div class="nt-tasbeeh-count" id="ntTasbeehCount">
                ${state.count}
            </div>

            <div class="nt-muted" style="text-align:center;">
                الهدف: ${preset.target}
            </div>

            <button class="nt-tasbeeh-tap" id="ntTasbeehTap">
                ${escapeHtml(preset.text)}
                <br>
                <span style="font-size:12px;font-weight:500;opacity:.75;">
                    دوس هنا للعد
                </span>
            </button>

            <div class="nt-row" style="justify-content:center;">
                <button class="nt-btn" id="ntTasbeehReset">تصفير</button>
            </div>
        `);


        const countLabel =
            document.getElementById("ntTasbeehCount");


        const save = () => store("tasbeeh", state);


        document
            .querySelectorAll("[data-nt-tasbeeh]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    state.index = Number(button.dataset.ntTasbeeh);
                    state.count = 0;

                    save();

                    renderTasbeeh();

                });

            });


        const tapButton =
            document.getElementById("ntTasbeehTap");

        if (tapButton) {

            tapButton.addEventListener("click", () => {

                state.count += 1;

                save();

                if (countLabel) {
                    countLabel.textContent = state.count;
                }

                vibrate(18);

                if (state.count === preset.target) {

                    vibrate([40, 60, 40]);

                    safeToast(`تمام، وصلت ${preset.target}`);

                }

            });

        }


        const resetButton =
            document.getElementById("ntTasbeehReset");

        if (resetButton) {

            resetButton.addEventListener("click", () => {

                state.count = 0;

                save();

                if (countLabel) {
                    countLabel.textContent = "0";
                }

            });

        }

    }


    /* =====================================================
       13) مشاركة الآية كصورة
    ===================================================== */

    async function shareAyahImage(surahId, ayahNumber) {

        const surah = getSurahById(surahId);

        let text = "";

        const page =
            document.getElementById("mushafPage");

        const node =
            page
                ? page.querySelector(`.ayah[data-number="${ayahNumber}"]`)
                : null;

        if (node) {

            text =
                node.textContent
                    .replace(/\s+/g, " ")
                    .replace(new RegExp(`\\s*${ayahNumber}\\s*$`), "")
                    .trim();

        }

        if (!text) {

            const info =
                readOfflineAyahInfo(surahId, ayahNumber);

            text = info ? info.arabic : "";

        }

        if (!text) {

            safeToast("افتح الآية في المصحف الأول");

            return;

        }


        const size = 1080;

        const canvas =
            document.createElement("canvas");

        canvas.width = size;
        canvas.height = size;

        const ctx =
            canvas.getContext("2d");


        /* خلفية */
        const gradient =
            ctx.createLinearGradient(0, 0, size, size);

        gradient.addColorStop(0, "#0a100f");
        gradient.addColorStop(0.55, "#12211c");
        gradient.addColorStop(1, "#0a100f");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);


        /* إطار ذهبي */
        ctx.strokeStyle = "rgba(213,180,106,0.55)";
        ctx.lineWidth = 3;
        ctx.strokeRect(46, 46, size - 92, size - 92);


        /* نص الآية */
        ctx.direction = "rtl";
        ctx.textAlign = "center";
        ctx.fillStyle = "#f3f5f4";

        const fontSize =
            text.length > 320
                ? 34
                : text.length > 180
                    ? 42
                    : text.length > 90
                        ? 52
                        : 62;

        ctx.font =
            `${fontSize}px "Amiri Quran", "Amiri", serif`;

        const maxWidth = size - 200;

        const words = text.split(" ");

        const lines = [];

        let line = "";

        words.forEach(word => {

            const candidate =
                line ? line + " " + word : word;

            if (
                ctx.measureText(candidate).width > maxWidth &&
                line
            ) {

                lines.push(line);

                line = word;

            } else {

                line = candidate;

            }

        });

        if (line) {
            lines.push(line);
        }


        const lineHeight = fontSize * 1.85;

        let y =
            (size / 2) -
            ((lines.length - 1) * lineHeight) / 2;

        lines.forEach(item => {

            ctx.fillText(item, size / 2, y);

            y += lineHeight;

        });


        /* المرجع */
        ctx.fillStyle = "#d5b46a";
        ctx.font = '600 38px "Cairo", sans-serif';

        ctx.fillText(
            `سورة ${surah ? surah.name : ""} - الآية ${ayahNumber}`,
            size / 2,
            size - 150
        );

        ctx.fillStyle = "rgba(145,160,155,0.85)";
        ctx.font = '500 26px "Cairo", sans-serif';

        ctx.fillText("نور التلاوة", size / 2, size - 95);


        const blob =
            await new Promise(resolve =>
                canvas.toBlob(resolve, "image/png")
            );

        if (!blob) {

            safeToast("تعذر إنشاء الصورة");

            return;

        }


        const fileName =
            `noor-telawa-${surahId}-${ayahNumber}.png`;

        try {

            const file =
                new File([blob], fileName, { type: "image/png" });

            if (
                navigator.canShare &&
                navigator.canShare({ files: [file] })
            ) {

                await navigator.share({
                    files: [file],
                    title: "آية من القرآن الكريم"
                });

                return;

            }

        } catch (error) {
            /* المستخدم لغى المشاركة أو الجهاز مش داعم */
        }


        /* بديل: تنزيل الصورة */
        const link =
            document.createElement("a");

        link.href = URL.createObjectURL(blob);
        link.download = fileName;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(link.href), 4000);

        safeToast("تم حفظ صورة الآية");

    }


    /* =====================================================
       واجهة: صندوق الأدوات
    ===================================================== */

    let backdrop = null;
    let sheetTitle = null;
    let sheetBody = null;
    let sheetBack = null;


    function buildSheet() {

        backdrop = el("div", "nt-sheet-backdrop");

        backdrop.innerHTML = `
            <div class="nt-sheet" role="dialog" aria-modal="true">
                <div class="nt-sheet-head">
                    <button class="nt-icon-btn" id="ntSheetBack" title="رجوع">‹</button>
                    <h3 id="ntSheetTitle">الأدوات</h3>
                    <button class="nt-icon-btn" id="ntSheetClose" title="إغلاق">×</button>
                </div>
                <div class="nt-sheet-body" id="ntSheetBody"></div>
            </div>
        `;

        document.body.appendChild(backdrop);

        sheetTitle = document.getElementById("ntSheetTitle");
        sheetBody = document.getElementById("ntSheetBody");
        sheetBack = document.getElementById("ntSheetBack");

        document
            .getElementById("ntSheetClose")
            .addEventListener("click", closeSheet);

        sheetBack.addEventListener("click", renderToolsMenu);

        backdrop.addEventListener("click", event => {

            if (event.target === backdrop) {
                closeSheet();
            }

        });


        /* تفويض: أي زرار بيفتح آية */
        sheetBody.addEventListener("click", async event => {

            const button =
                event.target.closest("[data-nt-open-ayah]");

            if (!button) {
                return;
            }

            const [surahId, ayahNumber] =
                button.dataset.ntOpenAyah.split(":").map(Number);

            const surah = getSurahById(surahId);

            if (!surah) {
                return;
            }

            closeSheet();

            await openMushaf(surah, true);

            setSelectedAyah(ayahNumber);

            scrollToAyah(ayahNumber, true);

        });

    }


    function openSheet(title, html) {

        if (!backdrop) {
            buildSheet();
        }

        sheetTitle.textContent = title;

        sheetBody.innerHTML = html;

        sheetBody.scrollTop = 0;

        backdrop.classList.add("nt-open");

        sheetBack.style.visibility =
            title === "الأدوات" ? "hidden" : "visible";

    }


    function setSheetBody(html) {

        if (!sheetBody) {
            return;
        }

        sheetBody.innerHTML = html;

        sheetBody.scrollTop = 0;

    }


    function closeSheet() {

        if (!backdrop) {
            return;
        }

        backdrop.classList.remove("nt-open");

        stopQiblaCompass();

    }


    const TOOLS = [

        { icon: "🔖", label: "العلامات المرجعية", run: renderBookmarks },
        { icon: "🗓️", label: "الورد اليومي", run: renderWird },
        { icon: "🔍", label: "بحث في المصحف", run: renderSearch },
        { icon: "🧠", label: "وضع الحفظ", run: renderMemorization },
        { icon: "🎚️", label: "سرعة التلاوة", run: renderSpeed },
        { icon: "⏰", label: "مؤقت النوم", run: renderSleep },
        { icon: "🔠", label: "حجم الخط والتسميع", run: renderReadingPrefs },
        { icon: "📥", label: "التلاوات المحفوظة", run: renderDownloads },
        { icon: "🕋", label: "اتجاه القبلة", run: renderQibla },
        { icon: "📿", label: "السبحة", run: renderTasbeeh },
        { icon: "🎓", label: "إعادة الجولة", run: replayTour }

    ];


    function renderToolsMenu() {

        openSheet(
            "الأدوات",
            `<div class="nt-tools-grid">
                ${TOOLS.map((tool, index) => `
                    <button class="nt-tool" data-nt-tool="${index}">
                        <span class="nt-tool-icon">${tool.icon}</span>
                        <span>${tool.label}</span>
                    </button>
                `).join("")}
            </div>`
        );

        document
            .querySelectorAll("[data-nt-tool]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    const tool =
                        TOOLS[Number(button.dataset.ntTool)];

                    if (!tool) {
                        return;
                    }

                    sheetTitle.textContent = tool.label;

                    sheetBack.style.visibility = "visible";

                    tool.run();

                });

            });

    }


    /* ---------- شاشات الأدوات ---------- */

    function renderBookmarks() {

        const list = getBookmarks();

        if (!list.length) {

            setSheetBody(`
                <div class="nt-empty">
                    مفيش علامات محفوظة لحد دلوقتي.
                    <br><br>
                    اضغط ضغطة مطوّلة على أي آية في المصحف
                    واختار "حفظ علامة".
                </div>
            `);

            return;

        }

        setSheetBody(
            list.map(item => `
                <div class="nt-list-item">
                    <div class="nt-list-main">
                        <strong>${escapeHtml(item.surahName)} - آية ${item.ayah}</strong>
                        <div class="nt-muted">
                            ${escapeHtml(item.note || "")}
                        </div>
                    </div>
                    <button class="nt-btn" data-nt-bm-open="${item.id}">افتح</button>
                    <button class="nt-btn nt-danger" data-nt-bm-del="${item.id}">حذف</button>
                </div>
            `).join("")
        );


        sheetBody
            .querySelectorAll("[data-nt-bm-open]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    const bookmark =
                        getBookmarks().find(
                            item => item.id === button.dataset.ntBmOpen
                        );

                    if (bookmark) {
                        openBookmark(bookmark);
                    }

                });

            });


        sheetBody
            .querySelectorAll("[data-nt-bm-del]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    removeBookmark(button.dataset.ntBmDel);

                    renderBookmarks();

                });

            });

    }


    function renderWird() {

        const plan = getWirdPlan();

        if (!plan) {

            setSheetBody(`
                <div class="nt-card">
                    <h4>ابدأ خطة ختمة</h4>
                    <div class="nt-muted">
                        اختار تختم القرآن في كام يوم، وإحنا هنحسب لك
                        وردك اليومي ونفكرك بيه كل يوم.
                    </div>
                    <div class="nt-row" style="margin-top:12px;">
                        ${[30, 60, 90, 180, 365].map(days => `
                            <button class="nt-chip" data-nt-wird="${days}">
                                ${days} يوم
                            </button>
                        `).join("")}
                    </div>
                </div>
            `);

            sheetBody
                .querySelectorAll("[data-nt-wird]")
                .forEach(button => {

                    button.addEventListener("click", () => {

                        startWirdPlan(Number(button.dataset.ntWird));

                        renderWird();

                    });

                });

            return;

        }


        const done = plan.position - 1;

        const percent =
            Math.min(100, (done / TOTAL_QURAN_AYAHS) * 100);

        const finished =
            plan.position > TOTAL_QURAN_AYAHS;

        const start =
            absoluteToPosition(Math.min(plan.position, TOTAL_QURAN_AYAHS));

        const endAbsolute =
            Math.min(
                TOTAL_QURAN_AYAHS,
                plan.position + plan.perDay - 1
            );

        const end =
            absoluteToPosition(endAbsolute);

        const doneToday =
            plan.lastDoneOn === todayKey();


        setSheetBody(`
            <div class="nt-card">
                <h4>تقدمك في الختمة</h4>
                <div class="nt-progress"><i style="width:${percent}%"></i></div>
                <div class="nt-muted">
                    ${done} آية من ${TOTAL_QURAN_AYAHS}
                    (${percent.toFixed(1)}%)
                </div>
            </div>

            ${finished ? `
                <div class="nt-empty">تمت الختمة، تقبل الله منك 🌙</div>
            ` : `
                <div class="nt-card">
                    <h4>ورد النهارده</h4>
                    <div class="nt-muted">
                        من سورة <strong>${escapeHtml(start.surah.name)}</strong> آية ${start.ayah}
                        <br>
                        إلى سورة <strong>${escapeHtml(end.surah.name)}</strong> آية ${end.ayah}
                        <br>
                        (حوالي ${plan.perDay} آية)
                    </div>
                    <div class="nt-row" style="margin-top:12px;">
                        <button class="nt-btn nt-primary" id="ntWirdOpen">ابدأ الورد</button>
                        <button class="nt-btn" id="ntWirdDone" ${doneToday ? "disabled" : ""}>
                            ${doneToday ? "تم تسجيل ورد اليوم" : "خلصت وردي"}
                        </button>
                    </div>
                </div>
            `}

            <div class="nt-row">
                <button class="nt-btn nt-danger" id="ntWirdReset">إلغاء الخطة</button>
            </div>
        `);


        const openButton = document.getElementById("ntWirdOpen");

        if (openButton) {

            openButton.addEventListener("click", openTodayWird);

        }


        const doneButton = document.getElementById("ntWirdDone");

        if (doneButton && !doneToday) {

            doneButton.addEventListener("click", () => {

                completeTodayWird();

                renderWird();

            });

        }


        document
            .getElementById("ntWirdReset")
            .addEventListener("click", () => {

                store("wird", null);

                renderWird();

            });

    }


    function renderSearch() {

        setSheetBody(`
            <div class="nt-muted" style="margin-bottom:12px;">
                ابحث بأي كلمة وهنجيب لك كل الآيات اللي فيها،
                وتقدر تفتح أي نتيجة في المصحف على طول.
            </div>
            ${searchFormHtml("")}
        `);

        bindSearchForm();

    }


    function renderMemorization() {

        setSheetBody(`
            <div class="nt-card">
                <h4>وضع الحفظ</h4>
                <div class="nt-muted">
                    بيكرر الآية اللي إنت واقف عندها عدد مرات تختاره،
                    وبعدين ينتقل لوحده للآية اللي بعدها.
                    <br><br>
                    الطريقة: افتح السورة في المصحف، دوس على الآية
                    اللي عايز تحفظها، بعدين شغّل التلاوة.
                </div>
            </div>

            <div class="nt-card">
                <h4>عدد التكرارات</h4>
                <div class="nt-row">
                    ${[2, 3, 5, 7, 10].map(count => `
                        <button class="nt-chip ${count === memoTarget ? "nt-active" : ""}"
                                data-nt-memo="${count}">
                            ${count} مرات
                        </button>
                    `).join("")}
                </div>
            </div>

            <div class="nt-row">
                <button class="nt-btn ${memoEnabled ? "nt-danger" : "nt-primary"}"
                        id="ntMemoToggle">
                    ${memoEnabled ? "إيقاف وضع الحفظ" : "تشغيل وضع الحفظ"}
                </button>
            </div>
        `);


        sheetBody
            .querySelectorAll("[data-nt-memo]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    memoTarget = Number(button.dataset.ntMemo);

                    store("memoRepeats", memoTarget);

                    memoCount = 0;

                    renderMemorization();

                });

            });


        document
            .getElementById("ntMemoToggle")
            .addEventListener("click", () => {

                setMemoEnabled(!memoEnabled);

                renderMemorization();

            });

    }


    function renderSpeed() {

        setSheetBody(`
            <div class="nt-card">
                <h4>سرعة التلاوة</h4>
                <div class="nt-muted">
                    مفيدة جدًا في الحفظ: بطّأ الشيخ عشان تقدر تردد
                    وراه، أو سرّع لو بتراجع سورة حافظها.
                </div>
                <div class="nt-row" style="margin-top:12px;">
                    ${SPEED_OPTIONS.map(value => `
                        <button class="nt-chip ${value === playbackSpeed ? "nt-active" : ""}"
                                data-nt-speed="${value}">
                            ${value}×
                        </button>
                    `).join("")}
                </div>
            </div>
        `);

        sheetBody
            .querySelectorAll("[data-nt-speed]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    applyPlaybackSpeed(Number(button.dataset.ntSpeed));

                    renderSpeed();

                });

            });

    }


    function renderSleep() {

        setSheetBody(`
            <div class="nt-card">
                <h4>مؤقت النوم</h4>
                <div class="nt-muted" id="ntSleepStatus">
                    ${sleepTimerRemainingLabel()}
                </div>
                <div class="nt-row" style="margin-top:12px;">
                    ${[10, 15, 30, 45, 60, 90].map(minutes => `
                        <button class="nt-chip" data-nt-sleep="${minutes}">
                            ${minutes} دقيقة
                        </button>
                    `).join("")}
                </div>
                <div class="nt-row" style="margin-top:12px;">
                    <button class="nt-btn nt-danger" id="ntSleepCancel">إلغاء المؤقت</button>
                </div>
            </div>
        `);


        const status =
            document.getElementById("ntSleepStatus");

        const ticker =
            setInterval(() => {

                if (!document.body.contains(status)) {

                    clearInterval(ticker);

                    return;

                }

                status.textContent = sleepTimerRemainingLabel();

            }, 1000);


        sheetBody
            .querySelectorAll("[data-nt-sleep]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    startSleepTimer(Number(button.dataset.ntSleep));

                });

            });


        document
            .getElementById("ntSleepCancel")
            .addEventListener("click", () => {

                cancelSleepTimer(false);

            });

    }


    function renderReadingPrefs() {

        setSheetBody(`
            <div class="nt-card">
                <h4>حجم خط المصحف</h4>
                <div class="nt-row">
                    <button class="nt-btn" id="ntFontDown">− أصغر</button>
                    <span class="nt-chip nt-active" id="ntFontValue">
                        ${Math.round(mushafScale * 100)}%
                    </span>
                    <button class="nt-btn" id="ntFontUp">+ أكبر</button>
                    <button class="nt-btn" id="ntFontReset">الافتراضي</button>
                </div>
            </div>

            <div class="nt-card">
                <h4>وضع التسميع</h4>
                <div class="nt-muted">
                    بيخفي نص الآيات ويسيب أرقامها، فتقدر تسمّع لنفسك.
                    دوس على أي آية عشان تكشفها وتتأكد.
                </div>
                <div class="nt-row" style="margin-top:12px;">
                    <button class="nt-btn ${hideAyahText ? "nt-danger" : "nt-primary"}"
                            id="ntHideToggle">
                        ${hideAyahText ? "إظهار النص" : "إخفاء النص"}
                    </button>
                </div>
            </div>
        `);


        const value =
            document.getElementById("ntFontValue");


        const refresh = () => {

            value.textContent =
                `${Math.round(mushafScale * 100)}%`;

        };


        document
            .getElementById("ntFontUp")
            .addEventListener("click", () => {

                applyMushafScale(mushafScale + 0.1);

                refresh();

            });

        document
            .getElementById("ntFontDown")
            .addEventListener("click", () => {

                applyMushafScale(mushafScale - 0.1);

                refresh();

            });

        document
            .getElementById("ntFontReset")
            .addEventListener("click", () => {

                applyMushafScale(1);

                refresh();

            });

        document
            .getElementById("ntHideToggle")
            .addEventListener("click", () => {

                applyHideAyahText(!hideAyahText);

                renderReadingPrefs();

            });

    }


    function replayTour() {

        setSheetBody(`
            <div class="nt-card">
                <h4>إعادة عرض الجولة</h4>
                <div class="nt-muted">
                    هتفتح لك جولة التعريف بالتطبيق من أولها تاني.
                </div>
                <div class="nt-row" style="margin-top:12px;">
                    <button class="nt-btn nt-primary" id="ntTourGo">افتح الجولة</button>
                </div>
            </div>
        `);

        document
            .getElementById("ntTourGo")
            .addEventListener("click", () => {

                try {

                    localStorage.removeItem("noorTelawaTourSeen_v1");

                } catch (error) { /* */ }

                location.href = "./tour.html";

            });

    }


    /* =====================================================
       قائمة الآية (ضغطة مطوّلة)
    ===================================================== */

    let ayahMenu = null;
    let longPressTimer = null;
    let suppressNextClick = false;
    let menuAyahNumber = null;
    let pressStartX = 0;
    let pressStartY = 0;


    function cancelLongPress() {

        if (longPressTimer) {

            clearTimeout(longPressTimer);

            longPressTimer = null;

        }

    }


    function buildAyahMenu() {

        ayahMenu = el("div", "nt-ayah-menu");

        ayahMenu.innerHTML = `
            <button data-nt-act="bookmark">🔖 حفظ علامة</button>
            <button data-nt-act="tafsir">📖 التفسير</button>
            <button data-nt-act="translation">🌐 الترجمة</button>
            <button data-nt-act="image">🖼️ مشاركة كصورة</button>
            <button data-nt-act="play">▶️ تشغيل من هنا</button>
        `;

        document.body.appendChild(ayahMenu);


        ayahMenu.addEventListener("click", async event => {

            const button =
                event.target.closest("[data-nt-act]");

            if (!button || !menuAyahNumber || !selectedSurah) {
                return;
            }

            const action = button.dataset.ntAct;

            const surahId = selectedSurah.id;

            const ayahNumber = menuAyahNumber;

            hideAyahMenu();


            if (action === "bookmark") {

                addBookmark(surahId, ayahNumber, "");

            } else if (action === "tafsir") {

                showAyahInfo(surahId, ayahNumber, "tafsir");

            } else if (action === "translation") {

                showAyahInfo(surahId, ayahNumber, "translation");

            } else if (action === "image") {

                await shareAyahImage(surahId, ayahNumber);

            } else if (action === "play") {

                setSelectedAyah(ayahNumber);

                try {

                    await playSelectedSurah(false);

                } catch (error) {

                    safeToast("اختر الشيخ الأول");

                }

            }

        });


        document.addEventListener("click", event => {

            if (
                ayahMenu &&
                ayahMenu.classList.contains("nt-open") &&
                !ayahMenu.contains(event.target)
            ) {

                hideAyahMenu();

            }

        });


        window.addEventListener("scroll", hideAyahMenu, { passive: true });

    }


    function showAyahMenu(x, y, ayahNumber) {

        if (!ayahMenu) {
            buildAyahMenu();
        }

        menuAyahNumber = ayahNumber;

        ayahMenu.classList.add("nt-open");

        const rect =
            ayahMenu.getBoundingClientRect();

        const left =
            Math.min(
                Math.max(10, x - rect.width / 2),
                window.innerWidth - rect.width - 10
            );

        const top =
            Math.min(
                y + 10,
                window.innerHeight - rect.height - 10
            );

        ayahMenu.style.left = left + "px";
        ayahMenu.style.top = Math.max(10, top) + "px";

        vibrate(25);

    }


    function hideAyahMenu() {

        if (ayahMenu) {
            ayahMenu.classList.remove("nt-open");
        }

    }


    function setupAyahInteractions() {

        const page =
            document.getElementById("mushafPage");

        if (!page) {
            return;
        }


        /*
            مهم: بنستخدم مرحلة الالتقاط (capture) عشان نقدر
            نمنع الـ click الأصلي بتاع app.js بعد الضغطة
            المطوّلة بس، من غير ما نلمس الكود القديم خالص.
        */
        page.addEventListener("click", event => {

            if (suppressNextClick) {

                suppressNextClick = false;

                event.stopPropagation();

                event.preventDefault();

            }

        }, true);


        page.addEventListener("pointerdown", event => {

            /*
                بنصفّر العلم مع كل لمسة جديدة، فلو ضغطة مطوّلة
                سابقة ما تبعهاش click (بيحصل على بعض الموبايلات)
                ما تعطّلش اللمسة اللي بعدها.
            */
            suppressNextClick = false;

            const ayah =
                event.target.closest(".ayah");

            if (!ayah) {
                return;
            }

            const number =
                Number(ayah.dataset.number);

            const x = event.clientX;
            const y = event.clientY;

            pressStartX = x;
            pressStartY = y;

            longPressTimer =
                setTimeout(() => {

                    longPressTimer = null;

                    suppressNextClick = true;

                    showAyahMenu(x, y, number);

                }, 480);

        });


        ["pointerup", "pointercancel", "pointerleave"].forEach(type => {

            page.addEventListener(type, () => {

                cancelLongPress();

            });

        });


        /*
            لو المستخدم بيسحب الصفحة (scroll) مش بيضغط ضغطة
            مطوّلة، فبنلغي المؤقت أول ما إصبعه يتحرك مسافة
            معقولة.
        */
        page.addEventListener("pointermove", event => {

            if (!longPressTimer) {
                return;
            }

            if (
                Math.abs(event.clientX - pressStartX) < 8 &&
                Math.abs(event.clientY - pressStartY) < 8
            ) {
                return;
            }

            cancelLongPress();

        });


        /* كليك يمين على الكمبيوتر */
        page.addEventListener("contextmenu", event => {

            const ayah =
                event.target.closest(".ayah");

            if (!ayah) {
                return;
            }

            event.preventDefault();

            showAyahMenu(
                event.clientX,
                event.clientY,
                Number(ayah.dataset.number)
            );

        });


        /* في وضع التسميع: الدوس بيكشف الآية */
        page.addEventListener("click", event => {

            if (!hideAyahText) {
                return;
            }

            const ayah =
                event.target.closest(".ayah");

            if (ayah) {
                ayah.classList.toggle("nt-revealed");
            }

        });


        /*
            المصحف بيترسم من الأول كل مرة تتفتح سورة جديدة،
            فلازم نرجّع إعدادات العرض بتاعتنا بعد كل رسم.
        */
        if (typeof MutationObserver !== "undefined") {

            new MutationObserver(() => {

                if (hideAyahText) {
                    page.classList.add("nt-hide-text");
                }

            }).observe(page, { childList: true });

        }

    }


    /* =====================================================
       تذكير الورد اليومي
    ===================================================== */

    function maybeRemindWird() {

        const plan = getWirdPlan();

        if (
            !plan ||
            plan.position > TOTAL_QURAN_AYAHS ||
            plan.lastDoneOn === todayKey()
        ) {
            return;
        }

        setTimeout(() => {

            const start =
                absoluteToPosition(plan.position);

            safeToast(
                `ورد النهارده: سورة ${start.surah.name} من آية ${start.ayah}`
            );

        }, 6000);

    }


    /* =====================================================
       الزرار العائم
    ===================================================== */

    function buildFab() {

        const fab = el("button", "nt-fab", "🧰");

        fab.type = "button";

        fab.title = "أدوات نور التلاوة";

        fab.setAttribute("aria-label", "أدوات نور التلاوة");

        fab.addEventListener("click", renderToolsMenu);

        document.body.appendChild(fab);

    }


    /* =====================================================
       تشغيل كل حاجة
    ===================================================== */

    /* =====================================================
       تحديث تلقائي للـ Service Worker
       =====================================================
       من غير الكود ده، لو رفعنا نسخة جديدة من التطبيق، المستخدم
       كان لازم يقفل التطبيق ويفتحه أكتر من مرة عشان يشوف أي
       حاجة جديدة (زرار الأدوات مثلاً). دلوقتي بنكتشف وجود نسخة
       جديدة جاهزة وبنعمل تحديث فوري تلقائي (إعادة تحميل مرة
       واحدة بس)، من غير ما ينتظر المستخدم يعمل حاجة.
    ===================================================== */

    function watchForServiceWorkerUpdate() {

        if (!("serviceWorker" in navigator)) {
            return;
        }

        let refreshedOnce = false;

        /*
            أول ما نسخة جديدة تاخد الأمر (بعد skipWaiting)،
            بنعمل reload تلقائي مرة واحدة عشان نجيب أحدث
            index.html وكل الملفات الجديدة معاه.
        */
        navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => {

                if (refreshedOnce) {
                    return;
                }

                refreshedOnce = true;

                location.reload();

            }
        );


        navigator.serviceWorker.getRegistration().then(registration => {

            if (!registration) {
                return;
            }

            /*
                لو فيه نسخة جديدة بالفعل واقفة ومستنية
                (حصل مثلاً لو التطبيق كان مفتوح من زمان)،
                بنفعّلها فورًا.
            */
            if (registration.waiting) {

                registration.waiting.postMessage({
                    type: "SKIP_WAITING"
                });

            }


            registration.addEventListener("updatefound", () => {

                const installing = registration.installing;

                if (!installing) {
                    return;
                }

                installing.addEventListener("statechange", () => {

                    if (
                        installing.state === "installed" &&
                        navigator.serviceWorker.controller
                    ) {

                        installing.postMessage({
                            type: "SKIP_WAITING"
                        });

                    }

                });

            });

        }).catch(() => {});

    }


    function init() {

        const steps = [
            buildFab,
            setupMediaSession,
            setupAyahInteractions,
            maybeRemindWird,
            watchForServiceWorkerUpdate
        ];

        steps.forEach(step => {

            try {

                step();

            } catch (error) {

                console.warn("Feature init failed:", error);

            }

        });

    }


    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", init);

    } else {

        init();

    }

})();