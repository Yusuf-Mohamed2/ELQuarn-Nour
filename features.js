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
    let memoEndAyah = null;

    /*
        طريقة التكرار (في صفحة وضع الحفظ بس):
        - "range": تكرار المقطع كله (من آية X لآية Y) عدد المرات
          المطلوب ورا بعض، وبعدها يقف. ده الوضع الافتراضي.
        - "each": الطريقة القديمة: كل آية لوحدها عدد مرات وبعدين
          اللي بعدها.
    */
    let memoMode = load("memoMode", "range");

    if (memoMode !== "range" && memoMode !== "each") {
        memoMode = "range";
    }

    let memoRangeFrom = null;
    let memoRangeTo = null;
    let memoRangeEntered = false;
    let memoLastLoopAt = 0;
    let memoPollId = null;


    function setMemoEnabled(enabled) {

        memoEnabled = enabled;

        memoCount = 0;

        memoRangeEntered = false;
        memoLastLoopAt = 0;

        if (enabled && memoMode === "range") {
            memoStartPoll();
        } else {
            memoStopPoll();
        }

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

                safeToast(
                    memoMode === "range"
                        ? `وضع الحفظ شغال: المقطع كله ${memoTarget} مرات`
                        : `وضع الحفظ شغال: كل آية ${memoTarget} مرات`
                );

            }

        } else {

            safeToast("تم إيقاف وضع الحفظ");

        }

    }


    /* MEMO-RANGE-BEGIN */

    function memoStopPoll() {

        if (memoPollId) {

            clearInterval(memoPollId);

            memoPollId = null;

        }

    }


    /*
        الـ timeupdate بيوصل كل ~250 ملي ثانية بس، ده معناه إن
        الصوت ممكن يعدّي نهاية المقطع بربع ثانية قبل ما نرجّعه
        (فتسمع أول كلمة من الآية اللي بعده). عشان كده في وضع
        "المقطع كله" بنفحص كل 50 ملي ثانية أثناء التشغيل بس.
    */
    function memoStartPoll() {

        memoStopPoll();

        memoPollId = setInterval(() => {

            if (!memoEnabled) {

                memoStopPoll();

                return;

            }

            if (memoMode !== "range" || audio.paused) {
                return;
            }

            memoTick();

        }, 50);

    }


    function updateMemoRoundLabel() {

        const label =
            document.getElementById("ntMemoRoundLabel");

        if (label) {

            label.textContent =
                `المرة ${Math.min(memoCount + 1, memoTarget)} من ${memoTarget}`;

        }

    }


    /*
        تكرار المقطع كله: بنشغّل من بداية آية "من" لنهاية آية "إلى"،
        ولما نوصل لآخره نرجع لبداية المقطع (مش لبداية آخر آية).
        بعد آخر مرة بنوقف.
    */
    function memoRangeTick() {

        if (
            !selectedSurah ||
            memoRangeFrom === null ||
            memoRangeTo === null
        ) {
            return;
        }

        const from = memoRangeFrom;
        const to = memoRangeTo;

        const startTiming =
            currentAyahTimings.find(item => item.ayah === from);

        const endTiming =
            currentAyahTimings.find(item => item.ayah === to);

        if (!startTiming || !endTiming) {
            return;
        }

        const time = audio.currentTime;

        /* تمييز الآية اللي بتتقرأ دلوقتي جوه المقطع */

        const playing =
            currentAyahTimings.find(item =>
                item.ayah >= from &&
                item.ayah <= to &&
                time >= item.start - 0.05 &&
                time < item.end
            );

        if (playing && playing.ayah !== memoAyah) {

            memoAyah = playing.ayah;

            highlightMemoAyah(playing.ayah);
            updateMemoAyahLabel(playing.ayah);

        }

        /*
            حد نهاية المقطع. لو المقطع بينتهي عند آخر السورة، نوقف
            قبل نهاية الملف بشوية، لأن لو الملف خلص فعليًا فـ app.js
            هيحاول يكمّل لآية/سورة تانية لوحده.
        */

        let limit = endTiming.end;

        const duration = audio.duration;

        if (Number.isFinite(duration) && duration > 0) {
            limit = Math.min(limit, duration - 0.25);
        }

        limit = Math.max(limit, startTiming.start + 0.5);

        /*
            مبنعدّ النهاية إلا بعد ما الصوت يكون دخل المقطع فعلًا،
            عشان لو كان فيه صوت تاني شغال قبل ما نبدأ، مايتحسبش
            على إنه خلّص مرة.
        */

        if (!memoRangeEntered) {

            if (
                time >= startTiming.start - 0.3 &&
                time < limit - 0.04
            ) {
                memoRangeEntered = true;
            } else {
                return;
            }

        }

        if (time < limit - 0.04) {
            return;
        }

        const now = Date.now();

        if (now - memoLastLoopAt < 500) {
            return;
        }

        memoLastLoopAt = now;

        memoCount += 1;

        if (memoCount < memoTarget) {

            audio.currentTime = startTiming.start;

            memoAyah = from;

            highlightMemoAyah(from);
            updateMemoAyahLabel(from);
            updateMemoRoundLabel();

            return;

        }

        /* خلصنا كل المرات: نوقف */

        memoCount = 0;

        audio.pause();

        memoEnabled = false;

        memoStopPoll();

        const finishedWholeSurah =
            from === 1 && to >= selectedSurah.ayahs;

        safeToast(
            finishedWholeSurah
                ? "خلصت السورة - تم إيقاف وضع الحفظ"
                : "خلصت الآيات اللي حددتها - تم إيقاف وضع الحفظ"
        );

        finishMemorization(finishedWholeSurah);

    }

    /* MEMO-RANGE-END */


    function memoTick() {

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

            if (memoMode === "range") {

                memoRangeTick();

                return;

            }

            const current = Number(selectedAyah);

            if (memoAyah !== current) {

                memoAyah = current;
                memoCount = 0;

                highlightMemoAyah(current);
                updateMemoAyahLabel(current);

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

            if (
                !nextTiming ||
                next > selectedSurah.ayahs ||
                (memoEndAyah && next > memoEndAyah)
            ) {

                const finishedWholeSurah = next > selectedSurah.ayahs;

                audio.pause();

                memoEnabled = false;

                safeToast(
                    finishedWholeSurah
                        ? "خلصت السورة - تم إيقاف وضع الحفظ"
                        : "خلصت الآيات اللي حددتها - تم إيقاف وضع الحفظ"
                );

                finishMemorization(finishedWholeSurah);

                return;

            }

            setSelectedAyah(next);

            memoAyah = next;

            audio.currentTime = nextTiming.start;

            highlightMemoAyah(next);
            updateMemoAyahLabel(next);

        } catch (error) {
            /* أي مشكلة: منعطلش التشغيل العادي */
        }

    }


    audio.addEventListener("timeupdate", memoTick);


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

        const page = tasmeeMushafRoot();

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
       5‑ب) التسميع الذكي (تصحيح النطق صوتيًا + تنبيه أحكام)
       =====================================================
       - بيسمع المستخدم وهو بيتلو عن طريق التعرف على الصوت
         (Web Speech API) وبيقارن كلامه بنص الآية كلمة كلمة.
         لو فيه كلمة غلط أو ناقصة بيوقفه عندها ويطلب منه
         يعيد لحد ما ينطقها صح.

       - نقطة أمانة مهمة: متصفحات الموبايل والكمبيوتر بترجع
         بس نص مكتوب من الصوت (Speech-to-Text)، من غير أي
         تفاصيل صوتية زي مدة المد أو قوة الغنة. يعني مفيش
         طريقة حقيقية إن الكود "يسمع" أحكام التجويد فعلاً.
         عشان كده إحنا مش بنعمل تصحيح وهمي للتجويد؛ بدل من
         كده، أول ما الكلمات تتأكد إنها صح، بنوري فورًا أهم
         أحكام التجويد الموجودة في نفس الآية (غنة، قلقلة،
         مدود، أحكام النون الساكنة والتنوين) كتظليل ملوّن
         + تسمية، عشان يراجعها بنفسه وهو بيسمّع، بدل ما ندّعي
         إننا رصدنا غلطة مش قادرين نتأكد منها فعلاً.
    ===================================================== */

    let tasmeeRecognition = null;
    let tasmeeActive = false;
    let tasmeeSurah = null;
    let tasmeeAyahList = [];
    let tasmeeIndex = 0;

    /*
        الكلمة اللي واقفين عندها جوه الآية + آخر غلطة اتكشفت.
        الغلطة دي بتفضل معروضة على الشاشة ومتتمسحش إلا لما
        المستخدم ينطق الكلمة صح فعلاً.
    */
    let tasmeeWordIndex = 0;
    let tasmeeError = null;
    let tasmeeExitHandler = null;

    /* كلمات اتسمعت بس لسه مش نهائية (بتظهر فورًا وإنت بتتكلم) */
    let tasmeeLive = -1;
    let tasmeeLastDone = null;
    let tasmeeRestartTimer = null;
    let tasmeeLastStart = 0;
    let tasmeeQuickEnds = 0;
    let tasmeeWakeLock = null;

    /*
        تأكيد الغلط: أول مرة كلمة متطابقش مبنحكمش عليها غلط (الموبايل
        بيسمع غلط كتير)، بنعلّمها "مش واضحة" بس. لو اتكررت نفس
        الكلمة تاني، ساعتها بس نعرض الغلط.
    */
    let tasmeeStrike = { key: "", n: 0 };
    let tasmeeSoft = -1;


    function levenshtein(a, b) {

        const dp = [];

        for (let i = 0; i <= a.length; i++) {
            dp.push([i, ...Array(b.length).fill(0)]);
        }

        for (let j = 0; j <= b.length; j++) {
            dp[0][j] = j;
        }

        for (let i = 1; i <= a.length; i++) {

            for (let j = 1; j <= b.length; j++) {

                dp[i][j] =
                    a[i - 1] === b[j - 1]
                        ? dp[i - 1][j - 1]
                        : 1 + Math.min(
                            dp[i - 1][j],
                            dp[i][j - 1],
                            dp[i - 1][j - 1]
                        );

            }

        }

        return dp[a.length][b.length];

    }


    function wordsClose(a, b) {

        if (a === b) {
            return true;
        }

        const tolerance =
            Math.max(1, Math.floor(Math.max(a.length, b.length) * 0.3));

        return levenshtein(a, b) <= tolerance;

    }


    /* ---------------------------------------------------
       المصحف اللي بنسمّع منه
       ---------------------------------------------------
       لو المستخدم جوه صفحة التسميع المستقلة بنقرأ من مصحفها
       هي، وغير كده بنفضل شغالين على مصحف التطبيق العادي
       بالظبط زي الأول.
    --------------------------------------------------- */

    function tasmeeMushafRoot() {

        const tasmeePage =
            document.getElementById("ntTasmeeMushaf");

        if (
            tasmeePage &&
            document.body.dataset.ntPage === "tasmee"
        ) {
            return tasmeePage;
        }

        return document.getElementById("mushafPage");

    }


    /*
        تنضيف أقوى من normalizeText: بيشيل كمان الألف الخنجرية
        والعلامات الصغيرة اللي في رسم المصحف العثماني، عشان
        المقارنة تبقى بين حروف فعلية بس.
    */
    function tasmeeNormalize(text) {

        return String(text || "")
            .replace(/[\u0671\u0622\u0623\u0625]/g, "ا")
            .replace(/[\u0649]/g, "ي")

            /* شيل التشكيل وعلامات الوقف، وسيب الألف الخنجرية */
            .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED\u0640]/g, "")

            /*
                الألف الخنجرية (ٰ) في رسم المصحف بتساوي ألف
                منطوقة في أغلب الكلمات (الصٰلحٰت = الصالحات)،
                فبنحوّلها ألف. بس فيه كلمات مشهورة بتتكتب من
                غير ألف في الإملاء العادي (الله، هذا، ذلك،
                الرحمن، لكن، أولئك)، ودي بنشيلها فيها عشان
                تطابق اللي بيرجع من التعرف على الصوت.
            */
            .replace(/لل\u0670/g, "لل")
            .replace(/ه\u0670ذ/g, "هذ")
            .replace(/ذ\u0670ل/g, "ذل")
            .replace(/م\u0670ن/g, "من")
            .replace(/ل\u0670ك/g, "لك")
            .replace(/ل\u0670ئ/g, "لئ")
            .replace(/\u0670/g, "ا")

            .replace(/[^\u0621-\u064A\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .replace(/ة/g, "ه")
            .replace(/ؤ/g, "و")
            .replace(/ئ/g, "ي");

    }


    /*
        رسم المصحف في الـ API بيلزق البسملة في أول آية من كل
        سورة. ده كان بيخلي التسميع يطلب من المستخدم يقول
        البسملة مع أول آية ويحسبها غلط لو قال الآية على طول.
        هنا بنشيلها من نص الآية (إلا لو الآية هي البسملة
        نفسها زي أول الفاتحة).
    */
    function stripBasmala(text) {

        const words =
            String(text || "").split(/\s+/).filter(Boolean);

        if (words.length <= 4) {
            return text;
        }

        const head =
            tasmeeNormalize(words.slice(0, 4).join(" "))
                .replace(/\s+/g, "");

        const isBasmala =
            head === "بسماللهالرحمنالرحيم" ||
            head === "بسماللهالرحمانالرحيم";

        return isBasmala ? words.slice(4).join(" ") : text;

    }


    function getTasmeeAyahs() {

        const page = tasmeeMushafRoot();

        if (!page) {
            return [];
        }

        return Array.from(page.querySelectorAll(".ayah"))
            .map(node => {

                const numberEl = node.querySelector(".ayah-number");
                const numberText = numberEl ? numberEl.textContent.trim() : "";

                let text = node.textContent.trim();

                if (numberText) {

                    text = text
                        .replace(new RegExp(numberText + "\\s*$"), "")
                        .trim();

                }

                text = stripBasmala(text).trim();

                return {
                    number: Number(node.dataset.number),
                    text,
                    words: text.split(/\s+/).filter(Boolean)
                };

            })
            .filter(item => item.text);

    }


    /* ---------------------------------------------------
       محرك أحكام تجويد مبسّط: بيشتغل على رسم النص بتشكيله
       الكامل عشان يورّي تذكير بصري بس، مش تصحيح صوتي.
    --------------------------------------------------- */

    const TW_SHADDA = "\u0651";
    const TW_SUKUN = "\u0652";
    const TW_FATHA = "\u064E";
    const TW_DAMMA = "\u064F";
    const TW_KASRA = "\u0650";
    const TW_TANWEEN = /[\u064B\u064C\u064D]/;
    const TW_HAMZA = /[ءأإؤئآ]/;

    const IDGHAM_GHUNNA_LETTERS = "ينمو";
    const IDGHAM_NO_GHUNNA_LETTERS = "لر";
    const IQLAB_LETTERS = "ب";
    const IZHAR_LETTERS = "ءهعحغخ";


    function analyzeTajweed(text) {

        const marks = [];

        /* غنة: شدة على نون أو ميم */
        for (let i = 0; i < text.length - 1; i++) {

            if (
                (text[i] === "ن" || text[i] === "م") &&
                text[i + 1] === TW_SHADDA
            ) {

                marks.push({
                    start: i,
                    end: i + 2,
                    cls: "nt-tw-ghunna",
                    label: "غُنّة"
                });

            }

        }


        /* قلقلة: أحد حروف (قطب جد) وبعده سكون */
        for (let i = 0; i < text.length - 1; i++) {

            if (
                "قطبجد".includes(text[i]) &&
                text[i + 1] === TW_SUKUN
            ) {

                marks.push({
                    start: i,
                    end: i + 2,
                    cls: "nt-tw-qalqalah",
                    label: "قلقلة"
                });

            }

        }


        /* مدود: حرف مد بعد حركة تناسبه (بيدعم رسم المصحف بعلامة المد ٓ) */
        const TW_MADDAH = "\u0653";
        const TW_MARK = /[\u064B-\u065F\u0670]/;

        for (let i = 1; i < text.length; i++) {

            /* الشدة ممكن تيجي قبل أو بعد الفتحة، فنعدّي عليها */
            const prev = text[i - 1] === TW_SHADDA ? text[i - 2] : text[i - 1];

            const isAlefMadd =
                prev === TW_FATHA && (text[i] === "ا" || text[i] === "آ");
            const isWawMadd = prev === TW_DAMMA && text[i] === "و";
            const isYaMadd = prev === TW_KASRA && text[i] === "ي";

            if (!isAlefMadd && !isWawMadd && !isYaMadd) {
                continue;
            }

            let k = i + 1;
            const hasMaddah = text[i] === "آ" || text[k] === TW_MADDAH;

            if (text[k] === TW_MADDAH) {
                k += 1;
            }

            const after = text[k] || "";

            /* علامات الحرف اللي بعد المد (شدة / سكون) */
            let m = k + 1;
            let afterMarks = "";

            while (m < text.length && TW_MARK.test(text[m])) {
                afterMarks += text[m];
                m += 1;
            }

            const heavy =
                afterMarks.includes(TW_SHADDA) ||
                afterMarks.includes(TW_SUKUN);

            let label = "مدّ طبيعي (حركتين)";

            if (TW_HAMZA.test(after)) {

                label = "مدّ جايز/واجب (٤-٥ حركات)";

            } else if (heavy) {

                label = "مدّ لازم (٦ حركات)";

            }

            marks.push({
                start: i - 1,
                end: k,
                cls: "nt-tw-madd",
                label
            });

        }


        /* أحكام النون الساكنة والتنوين */
        const wordsWithIndex = [];

        {

            let start = 0;

            text.split(" ").forEach(word => {

                wordsWithIndex.push({ word, start });

                start += word.length + 1;

            });

        }


        wordsWithIndex.forEach((entry, wIndex) => {

            const word = entry.word;

            for (let i = 0; i < word.length; i++) {

                const isNoonSakinah =
                    word[i] === "ن" && word[i + 1] === TW_SUKUN;

                const isTanween =
                    TW_TANWEEN.test(word[i]);

                if (!isNoonSakinah && !isTanween) {
                    continue;
                }

                const hotspotEnd = isNoonSakinah ? i + 2 : i + 1;

                let nextChar = word[hotspotEnd];

                if (!nextChar) {

                    const nextWord =
                        wordsWithIndex[wIndex + 1]
                            ? wordsWithIndex[wIndex + 1].word
                            : "";

                    nextChar = nextWord.replace(/^ال/, "")[0] || "";

                }

                if (!nextChar) {
                    continue;
                }

                let label;

                if (IQLAB_LETTERS.includes(nextChar)) {
                    label = "إقلاب";
                } else if (IDGHAM_GHUNNA_LETTERS.includes(nextChar)) {
                    label = "إدغام بغنة";
                } else if (IDGHAM_NO_GHUNNA_LETTERS.includes(nextChar)) {
                    label = "إدغام بلا غنة";
                } else if (IZHAR_LETTERS.includes(nextChar)) {
                    label = "إظهار";
                } else {
                    label = "إخفاء";
                }

                marks.push({
                    start: entry.start + i,
                    end: entry.start + hotspotEnd,
                    cls: "nt-tw-noon",
                    label
                });

            }

        });


        /* إزالة أي تداخل بين الأحكام، مع الأولوية للأهم */
        const priority = {
            "nt-tw-ghunna": 4,
            "nt-tw-qalqalah": 3,
            "nt-tw-noon": 2,
            "nt-tw-madd": 1
        };

        marks.sort((a, b) =>
            a.start - b.start || priority[b.cls] - priority[a.cls]
        );

        const accepted = [];
        let lastEnd = -1;

        marks.forEach(mark => {

            if (mark.start < lastEnd) {
                return;
            }

            accepted.push(mark);

            lastEnd = mark.end;

        });

        return accepted;

    }


    function renderTajweedHtml(text) {

        const marks = analyzeTajweed(text);

        if (!marks.length) {
            return { html: escapeHtml(text), legend: [] };
        }

        let html = "";
        let cursor = 0;

        const legendSet = new Set();

        marks.forEach(mark => {

            html += escapeHtml(text.slice(cursor, mark.start));

            html +=
                `<mark class="nt-tw ${mark.cls}" title="${escapeHtml(mark.label)}">`;

            html += escapeHtml(text.slice(mark.start, mark.end));

            html += "</mark>";

            legendSet.add(mark.label + "|" + mark.cls);

            cursor = mark.end;

        });

        html += escapeHtml(text.slice(cursor));

        const legend =
            Array.from(legendSet).map(entry => {

                const [label, cls] = entry.split("|");

                return { label, cls };

            });

        return { html, legend };

    }


    /* ---------------------------------------------------
       تشغيل/إيقاف جلسة التسميع
    --------------------------------------------------- */

    function stopTasmee(silent) {

        tasmeeActive = false;
        tasmeeError = null;
        tasmeeWordIndex = 0;
        tasmeeLive = -1;

        clearTimeout(tasmeeRestartTimer);

        holdScreenAwake(false);

        if (tasmeeRecognition) {

            try {

                tasmeeRecognition.onend = null;
                tasmeeRecognition.onresult = null;
                tasmeeRecognition.onerror = null;
                tasmeeRecognition.stop();

            } catch (error) { /* */ }

        }

        applyHideAyahText(false);

        if (!silent) {
            safeToast("تم إيقاف التسميع");
        }

    }


    function updateTasmeeStatus(text, isError) {

        const status =
            document.getElementById("ntTasmeeStatus");

        if (!status) {
            return;
        }

        status.textContent = text;

        status.classList.toggle("nt-tasmee-error", Boolean(isError));

    }


    function revealTasmeeAyah(current) {

        const page = tasmeeMushafRoot();

        if (page) {

            const ayahEl =
                page.querySelector(`.ayah[data-number="${current.number}"]`);

            if (ayahEl) {
                ayahEl.classList.add("nt-revealed");
            }

        }

        const box =
            document.getElementById("ntTasmeeAyahBox");

        if (!box) {
            return;
        }

        const { html, legend } = renderTajweedHtml(current.text);

        box.innerHTML = `
            <div class="nt-tasmee-ayah-text">
                ${html}
                <span class="nt-tasmee-ayah-num">${current.number}</span>
            </div>
            ${legend.length ? `
                <div class="nt-row nt-tasmee-legend">
                    ${legend.map(item => `
                        <span class="nt-chip nt-tw-chip ${item.cls}">
                            ${escapeHtml(item.label)}
                        </span>
                    `).join("")}
                </div>
            ` : ""}
        `;

    }


    /* ---------------------------------------------------
       تشخيص الغلط في كلمة واحدة
       ---------------------------------------------------
       بنحاول نقول للمستخدم غلط في إيه بالظبط:
       حرف مختلف، ولا مد ناقص/زايد، ولا كلمة كاملة غلط،
       وبنفكّره بأحكام التجويد اللي في نفس الكلمة.
    --------------------------------------------------- */

    function wordTajweedLabels(rawWord) {

        try {

            const marks = analyzeTajweed(String(rawWord || ""));

            const labels = [];

            marks.forEach(mark => {

                if (!labels.includes(mark.label)) {
                    labels.push(mark.label);
                }

            });

            return labels;

        } catch (error) {

            return [];

        }

    }


    function firstDifferentIndex(a, b) {

        const max = Math.max(a.length, b.length);

        for (let i = 0; i < max; i++) {

            if (a[i] !== b[i]) {
                return i;
            }

        }

        return -1;

    }


    function diagnoseTasmeeWord(rawWord, spokenRaw) {

        const target = tasmeeNormalize(rawWord);
        const spoken = tasmeeNormalize(spokenRaw || "");

        const rules = wordTajweedLabels(rawWord);

        const base = {
            word: rawWord,
            heard: spokenRaw || "",
            rules
        };


        if (!spoken) {

            return Object.assign(base, {
                kind: "missing",
                title: "كلمة ناقصة",
                detail: "الكلمة دي مقولتش خالص — قولها وكمّل."
            });

        }


        /* مد: نفس الحروف بالظبط والفرق بس في حروف المد */

        const targetSkeleton = target.replace(/[اوي]/g, "");
        const spokenSkeleton = spoken.replace(/[اوي]/g, "");

        if (targetSkeleton === spokenSkeleton && target !== spoken) {

            const targetMadd = (target.match(/[اوي]/g) || []).length;
            const spokenMadd = (spoken.match(/[اوي]/g) || []).length;

            if (spokenMadd < targetMadd) {

                return Object.assign(base, {
                    kind: "madd",
                    title: "مد ناقص",
                    detail:
                        "المد في الكلمة دي جه قصير — مُدّه بمقداره الصح وكررها."
                });

            }

            return Object.assign(base, {
                kind: "madd",
                title: "مد زايد",
                detail:
                    "مدّيت أكتر من اللازم — رجّع المد لمقداره الصح وكررها."
            });

        }


        /* حرف مختلف */

        const index = firstDifferentIndex(target, spoken);

        if (index >= 0 && target[index] && spoken[index]) {

            return Object.assign(base, {
                kind: "letter",
                title: "حرف مش مظبوط",
                detail:
                    `نطقت حرف «${spoken[index]}» والصح «${target[index]}» ` +
                    "— ركّز على مخرج الحرف وكرر الكلمة."
            });

        }

        if (index >= 0 && target[index] && !spoken[index]) {

            return Object.assign(base, {
                kind: "letter",
                title: "حرف ناقص",
                detail:
                    `ناقص حرف «${target[index]}» في آخر الكلمة — كررها كاملة.`
            });

        }

        if (index >= 0 && !target[index] && spoken[index]) {

            return Object.assign(base, {
                kind: "letter",
                title: "حرف زايد",
                detail:
                    `زوّدت حرف «${spoken[index]}» مش موجود في الكلمة — كررها.`
            });

        }

        return Object.assign(base, {
            kind: "wrong",
            title: "كلمة مش مظبوطة",
            detail: "الكلمة اللي اتسمعت مش هي المطلوبة — كررها بالراحة."
        });

    }


    /* ---------------------------------------------------
       مقارنة الكلمات (متسامحة مع المد وأخطاء التعرف على الصوت)
       ---------------------------------------------------
       التعرف على الصوت بيرجّع نص بس، مش بيقيس طول المد. فلما
       المستخدم يمد الحاقة أو الضالين 6 حركات، النص بييجي
       ببعض الحروف مكررة أو متغيّرة، فبنوحّد الحروف المتكررة
       وحروف المد، وبنعتبر الحروف المتشابهة في السمع واحدة.
    --------------------------------------------------- */

    function tasmeeKey(word) {

        return tasmeeNormalize(word)
            .replace(/\s+/g, "")
            .replace(/[ظض]/g, "ض")
            .replace(/[ذز]/g, "ز")
            .replace(/[ثصس]/g, "س")
            .replace(/ط/g, "ت")
            .replace(/ق/g, "ك")
            .replace(/[حه]/g, "ه")
            .replace(/ع/g, "ا")
            .replace(/(.)\1+/g, "$1");

    }

    function wordSimilarity(a, b) {

        const ka = tasmeeKey(a);
        const kb = tasmeeKey(b);
        const longest = Math.max(ka.length, kb.length) || 1;

        return 1 - levenshtein(ka, kb) / longest;

    }

    function wordsMatch(target, spoken) {

        if (wordsClose(target, spoken)) {
            return true;
        }

        const a = tasmeeKey(target);
        const b = tasmeeKey(spoken);

        if (a === b) {
            return true;
        }

        /* نفس الحروف الأساسية والفرق في حروف المد بس */
        const skeletonA = a.replace(/[اويى]/g, "");
        const skeletonB = b.replace(/[اويى]/g, "");

        if (skeletonA.length >= 2 && skeletonA === skeletonB) {
            return true;
        }

        const tolerance =
            Math.max(1, Math.floor(Math.max(a.length, b.length) * 0.3));

        return levenshtein(a, b) <= tolerance;

    }


    function matchSpoken(current, spokenWords, startIndex) {

        let index = startIndex;
        let s = 0;

        while (s < spokenWords.length && index < current.words.length) {

            const target = tasmeeNormalize(current.words[index]);

            if (wordsMatch(target, spokenWords[s])) {

                index += 1;
                s += 1;

                continue;

            }

            /* التعرف فصل كلمة المصحف لكلمتين (يا أيها) */
            let matched = false;
            let mergedSpoken = spokenWords[s];

            for (let k = 1; k <= 2; k++) {

                if (s + k >= spokenWords.length) {
                    break;
                }

                mergedSpoken += spokenWords[s + k];

                if (wordsMatch(target, mergedSpoken)) {

                    index += 1;
                    s += k + 1;
                    matched = true;

                    break;

                }

            }

            if (matched) {
                continue;
            }

            /* رسم المصحف لزّق كلمتين في كلمة */
            let mergedTarget = target;

            for (let k = 1; k <= 2; k++) {

                if (index + k >= current.words.length) {
                    break;
                }

                mergedTarget += tasmeeNormalize(current.words[index + k]);

                if (wordsMatch(mergedTarget, spokenWords[s])) {

                    index += k + 1;
                    s += 1;
                    matched = true;

                    break;

                }

            }

            if (matched) {
                continue;
            }

            /*
                كلمة سمعها المحرك مشوّهة بس شبه المطلوبة، والكلمة
                اللي بعدها مظبوطة: نعدّيها بدل ما نوقف التسميع.
            */
            if (
                index + 1 < current.words.length &&
                s + 1 < spokenWords.length &&
                wordSimilarity(target, spokenWords[s]) >= 0.5 &&
                wordsMatch(
                    tasmeeNormalize(current.words[index + 1]),
                    spokenWords[s + 1]
                )
            ) {

                index += 2;
                s += 2;

                continue;

            }

            break;

        }

        return {
            index,
            spokenIndex: s,
            offset: 0
        };

    }


    /*
        محاذاة كلام المستخدم مع الآية من أي مكان.

        الموبايل (أندرويد خصوصًا) بيرجّع النص تراكمي: كل نتيجة جديدة
        فيها الكلمات القديمة + الجديدة، أو مكررة. فبدل ما نقارن من أول
        كلمة ونحسب أي كلمة قديمة غلط، بنجرّب:
          أ) نتخطى أي عدد من الكلمات من الأول ونكمل من الكلمة اللي واقفين عندها.
          ب) نبدأ من أول الآية (النص التراكمي بيغطي اللي اتسمّع قبل كده)
             ونوصل لمكاننا الحالي أو أبعد.
        ونختار الأكتر تقدّمًا والأقل كلمات زايدة.
    */
    function alignTasmee(current, words, startIndex) {

        const total = current.words.length;
        let best = null;

        function consider(attempt, offset) {

            const consumedEnd = offset + attempt.spokenIndex;
            const leftover = words.length - consumedEnd;

            const score =
                attempt.index * 1000 - leftover * 10 - offset;

            if (!best || score > best.score) {

                best = {
                    index: attempt.index,
                    spokenIndex: attempt.spokenIndex,
                    offset,
                    consumedEnd,
                    leftover,
                    score
                };

            }

        }

        /* أ) من مكاننا الحالي، مع تخطي كلمات من أول الكلام */
        const need = Math.min(2, total - startIndex);

        consider(matchSpoken(current, words, startIndex), 0);

        for (let off = 1; off < words.length; off++) {

            const tail = words.slice(off);

            const attempt = matchSpoken(current, tail, startIndex);

            const enough =
                attempt.index - startIndex >= Math.min(need, tail.length);

            if (enough && attempt.index > startIndex) {
                consider(attempt, off);
            }

        }

        /* ب) من أول الآية: النص التراكمي اللي فيه اللي اتقال قبل كده */
        if (startIndex > 0) {

            for (let off = 0; off < words.length; off++) {

                const attempt =
                    matchSpoken(current, words.slice(off), 0);

                if (attempt.spokenIndex >= 2 && attempt.index >= startIndex) {
                    consider(attempt, off);
                }

            }

        }

        return best || {
            index: startIndex,
            spokenIndex: 0,
            offset: 0,
            consumedEnd: 0,
            leftover: words.length,
            score: 0
        };

    }

    /*
        لو أول كلمات الكلام مطابقتش (المستخدم رجع كلمتين أو تلاتة
        قبل الغلط عشان ياخد جري)، نجرّب نتخطاهم.
    */
    function bestAttempt(current, words, startIndex) {

        const first = matchSpoken(current, words, startIndex);

        if (first.index > startIndex) {
            return first;
        }

        const need = Math.min(2, current.words.length - startIndex);

        for (let off = 1; off <= 3 && off < words.length; off++) {

            const attempt =
                matchSpoken(current, words.slice(off), startIndex);

            if (attempt.index - startIndex >= need) {

                attempt.offset = off;

                return attempt;

            }

        }

        return first;

    }


    /* ---------------------------------------------------
       الاستماع المستمر
    --------------------------------------------------- */

    function holdScreenAwake(on) {

        try {

            if (on) {

                if (navigator.wakeLock && !tasmeeWakeLock) {

                    navigator.wakeLock.request("screen").then(lock => {

                        tasmeeWakeLock = lock;

                        lock.addEventListener("release", () => {
                            tasmeeWakeLock = null;
                        });

                    }).catch(() => { /* */ });

                }

            } else if (tasmeeWakeLock) {

                tasmeeWakeLock.release();

                tasmeeWakeLock = null;

            }

        } catch (error) { /* */ }

    }

    function startTasmeeListening() {

        if (!tasmeeActive) {
            return;
        }

        clearTimeout(tasmeeRestartTimer);

        const SpeechRecognitionCtor =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognitionCtor) {

            updateTasmeeStatus("متصفحك مش بيدعم التعرف على الصوت", true);

            stopTasmee(true);

            return;

        }

        try {

            if (tasmeeRecognition) {

                try {

                    tasmeeRecognition.onend = null;
                    tasmeeRecognition.onresult = null;
                    tasmeeRecognition.onerror = null;
                    tasmeeRecognition.abort();

                } catch (error) { /* */ }

            }

            tasmeeRecognition = new SpeechRecognitionCtor();

            /*
                continuous + interimResults: الميكروفون مبيقفش، والكلمات
                بتظهر وإنت بتتكلم من غير ما تستنى وقفة. تقدر تقول
                الآية كلها أو جزء منها أو كذا آية ورا بعض.
            */
            tasmeeRecognition.lang = "ar-SA";
            tasmeeRecognition.continuous = true;
            tasmeeRecognition.interimResults = true;
            tasmeeRecognition.maxAlternatives = 3;

            tasmeeRecognition.onstart = () => {

                tasmeeLastStart = Date.now();

                updateTasmeeStatus(
                    tasmeeError
                        ? "🎙️ بيسمعك — كرر الكلمة اللي فيها الغلط"
                        : "🎙️ بيسمعك طول الوقت... اتلُ عادي",
                    Boolean(tasmeeError)
                );

            };

            tasmeeRecognition.onresult = event => {

                for (let i = event.resultIndex; i < event.results.length; i++) {

                    const result = event.results[i];

                    if (!result.isFinal) {

                        handleTasmeeInterim(result[0].transcript);

                        continue;

                    }

                    const alternatives = [];

                    for (let j = 0; j < result.length; j++) {
                        alternatives.push(result[j].transcript);
                    }

                    handleTasmeeResult(alternatives);

                    if (!tasmeeActive) {
                        return;
                    }

                }

            };

            tasmeeRecognition.onerror = event => {

                if (!tasmeeActive) {
                    return;
                }

                if (
                    event.error === "not-allowed" ||
                    event.error === "service-not-allowed"
                ) {

                    updateTasmeeStatus("محتاجين إذن الميكروفون عشان نكمل ⚠️", true);

                    stopTasmee(true);

                    return;

                }

                if (event.error === "network") {

                    updateTasmeeStatus("الإنترنت ضعيف — بنحاول نرجع الاستماع 🔄", true);

                }

            };

            tasmeeRecognition.onend = () => {

                /* المتصفح بيقفل الاستماع لوحده كل فترة: نفتحه فورًا */

                if (!tasmeeActive) {
                    return;
                }

                tasmeeLive = -1;

                tasmeeQuickEnds =
                    Date.now() - tasmeeLastStart < 1500
                        ? tasmeeQuickEnds + 1
                        : 0;

                const delay =
                    Math.min(120 * Math.pow(2, tasmeeQuickEnds), 3000);

                clearTimeout(tasmeeRestartTimer);

                tasmeeRestartTimer =
                    setTimeout(startTasmeeListening, delay);

            };

            tasmeeRecognition.start();

        } catch (error) {

            updateTasmeeStatus("تعذر تشغيل الميكروفون", true);

        }

    }


    /* ---------------------------------------------------
       نتيجة مؤقتة: بنوري الكلمات فورًا من غير ما نحكم
       عليها غلط (الحكم بيكون على النتيجة النهائية بس)
    --------------------------------------------------- */

    function handleTasmeeInterim(transcript) {

        if (!tasmeeActive) {
            return;
        }

        const current = tasmeeAyahList[tasmeeIndex];

        if (!current) {
            return;
        }

        const words =
            tasmeeNormalize(transcript).split(/\s+/).filter(Boolean);

        if (!words.length) {
            return;
        }

        const attempt = alignTasmee(current, words, tasmeeWordIndex);

        const live = attempt.index > tasmeeWordIndex ? attempt.index : -1;

        if (live !== tasmeeLive) {

            tasmeeLive = live;

            updateTasmeeWordsDom();

        }

    }

    function updateTasmeeWordsDom() {

        const current = tasmeeAyahList[tasmeeIndex];

        if (!current) {
            return;
        }

        const words = document.getElementById("ntTasmeeWords");

        if (words) {
            words.innerHTML = tasmeeWordsHtml(current);
        }

        const bar = document.getElementById("ntTasmeeProg");

        if (bar) {

            const total = current.words.length || 1;

            bar.style.width =
                Math.round(
                    (Math.max(tasmeeWordIndex, tasmeeLive) / total) * 100
                ) + "%";

        }

        const hint = document.getElementById("ntTasmeeHint");

        if (hint) {
            hint.innerHTML = tasmeeHintHtml(current);
        }

    }

    /* تنبيه مدود الكلمة اللي جاية (التعرف مبيقيسش طول المد) */
    function tasmeeHintHtml(current) {

        const cursor = Math.max(tasmeeWordIndex, tasmeeLive);

        if (!current.words[cursor]) {
            return "";
        }

        const labels =
            wordTajweedLabels(current.words[cursor])
                .filter(label => label.indexOf("مد") === 0);

        if (!labels.length) {
            return "";
        }

        return `
            <span class="nt-muted">الكلمة الجاية فيها:</span>
            ${labels.map(label => `
                <span class="nt-chip nt-tw-chip nt-tw-madd">${escapeHtml(label)}</span>
            `).join("")}
        `;

    }


    /* ---------------------------------------------------
       خلصنا آية: نكمل على اللي بعدها فورًا (من غير ما نضيّع
       الكلام اللي اتقال بعدها)
    --------------------------------------------------- */

    function completeTasmeeAyah(ayah) {

        revealTasmeeAyah(ayah);

        tasmeeLastDone = ayah;
        tasmeeError = null;
        tasmeeWordIndex = 0;
        tasmeeLive = -1;
        tasmeeSoft = -1;
        tasmeeStrike = { key: "", n: 0 };

        vibrate([20, 40, 20]);

        tasmeeIndex += 1;

        if (tasmeeIndex >= tasmeeAyahList.length) {

            finishTasmee();

            return;

        }

        scrollToAyah(tasmeeAyahList[tasmeeIndex].number, false);

    }


    function handleTasmeeResult(alternatives) {

        if (!tasmeeActive) {
            return;
        }

        let current = tasmeeAyahList[tasmeeIndex];

        if (!current) {
            return;
        }

        const list =
            Array.isArray(alternatives) ? alternatives : [alternatives];

        let best = null;
        let bestWords = [];

        list.forEach(transcript => {

            const words =
                tasmeeNormalize(transcript).split(/\s+/).filter(Boolean);

            if (!words.length) {
                return;
            }

            const attempt = alignTasmee(current, words, tasmeeWordIndex);

            if (!best || attempt.score > best.score) {

                best = attempt;
                bestWords = words;

            }

        });

        tasmeeLive = -1;

        if (!best) {
            return;
        }

        let remaining = bestWords.slice(best.consumedEnd);
        let attempt = best;
        let progressed = false;
        let guard = 0;

        for (;;) {

            const before = tasmeeWordIndex;

            tasmeeWordIndex = Math.max(tasmeeWordIndex, attempt.index);

            if (tasmeeWordIndex > before) {
                progressed = true;
            }

            if (tasmeeWordIndex < current.words.length) {
                break;
            }

            /* الآية خلصت: نقفلها ونكمل بباقي الكلام على اللي بعدها */

            completeTasmeeAyah(current);

            progressed = true;

            if (!tasmeeActive) {
                return;
            }

            current = tasmeeAyahList[tasmeeIndex];

            if (!current || !remaining.length || ++guard > 40) {

                attempt = null;

                break;

            }

            attempt = alignTasmee(current, remaining, 0);

            remaining = remaining.slice(attempt.consumedEnd);

        }

        if (progressed) {

            tasmeeStrike = { key: "", n: 0 };
            tasmeeSoft = -1;

        }

        /* فيه كلمة مش متطابقة */

        if (attempt && remaining.length) {

            const key = tasmeeIndex + ":" + tasmeeWordIndex;

            tasmeeStrike =
                tasmeeStrike.key === key
                    ? { key, n: tasmeeStrike.n + 1 }
                    : { key, n: 1 };

            /*
                أول مرة: مش غلط مؤكد، ممكن المحرك سمع غلط. بنعلّم
                الكلمة "مش واضحة" ونطلب منه يقولها تاني من غير ما
                نعرض كارت غلط. التكرار بس هو اللي بيبقى غلط.
            */
            if (tasmeeStrike.n < 2 && !tasmeeError) {

                tasmeeSoft = tasmeeWordIndex;

                renderTasmeeLive();

                updateTasmeeStatus("🤔 الكلمة مش واضحة — قولها تاني بهدوء");

                return;

            }

            tasmeeSoft = -1;

            tasmeeError =
                diagnoseTasmeeWord(
                    current.words[tasmeeWordIndex],
                    remaining[0]
                );

            vibrate(40);

            renderTasmeeLive();

            updateTasmeeStatus(
                "وقفنا عند كلمة فيها غلط — كررها صح عشان نكمل 🔁",
                true
            );

            return;

        }

        /*
            مفيش كلمات زايدة. الغلط القديم بيتمسح بس لو فيه تقدّم
            حقيقي (يعني الكلمة اتقالت صح). نتيجة مكررة أو فاضية
            متمسحش الغلط.
        */
        if (progressed) {
            tasmeeError = null;
            tasmeeSoft = -1;
        }

        renderTasmeeLive();

        updateTasmeeStatus(
            progressed
                ? "تمام ✅ كمّل"
                : tasmeeError
                    ? "🎙️ بيسمعك — كرر الكلمة اللي فيها الغلط"
                    : "🎙️ بيسمعك طول الوقت... اتلُ عادي",
            !progressed && Boolean(tasmeeError)
        );

    }


    function finishTasmee() {

        stopTasmee(true);

        const status = document.getElementById("ntTasmeeStatus");
        const box = document.getElementById("ntTasmeeAyahBox");

        if (status) {
            status.textContent = "خلصت التسميع 🎉";
        }

        if (box) {

            box.innerHTML = `
                <div class="nt-card" style="text-align:center;">
                    <div style="font-size:34px; margin-bottom:8px;">🤍</div>
                    <div style="font-weight:700; margin-bottom:6px;">
                        اللهم تقبل منك، بارك الله فيك
                    </div>
                    <div class="nt-muted">
                        اللهم صلِّ وسلم على سيدنا محمد ﷺ
                    </div>
                </div>
            `;

        }

    }


    /* ---------------------------------------------------
       شاشة التسميع وهي شغالة
    --------------------------------------------------- */

    function tasmeeWordsHtml(current) {

        const cursor =
            tasmeeLive > tasmeeWordIndex ? tasmeeLive : tasmeeWordIndex;

        return current.words.map((word, index) => {

            if (index < tasmeeWordIndex) {

                return `<span class="nt-word nt-word-done">${escapeHtml(word)}</span>`;

            }

            if (index < cursor) {

                return `<span class="nt-word nt-word-live">${escapeHtml(word)}</span>`;

            }

            if (index === cursor) {

                if (tasmeeSoft === index && !tasmeeError) {
                    return `<span class="nt-word nt-word-check">${escapeHtml(word)}</span>`;
                }

                return tasmeeError && cursor === tasmeeWordIndex
                    ? `<span class="nt-word nt-word-wrong">${escapeHtml(word)}</span>`
                    : `<span class="nt-word nt-word-now">؟</span>`;

            }

            return `<span class="nt-word nt-word-hidden">${
                "•".repeat(Math.min(word.length, 7))
            }</span>`;

        }).join(" ");

    }


    function tasmeeAyahBoxHtml(ayah) {

        if (!ayah) {
            return '<div class="nt-empty">هتظهر لك الآية كاملة هنا بعد ما تتلوها صح</div>';
        }

        const { html, legend } = renderTajweedHtml(ayah.text);

        return `
            <div class="nt-tasmee-ayah-text">
                ${html}
                <span class="nt-tasmee-ayah-num">${ayah.number}</span>
            </div>
            ${legend.length ? `
                <div class="nt-row nt-tasmee-legend">
                    ${legend.map(item => `
                        <span class="nt-chip nt-tw-chip ${item.cls}">
                            ${escapeHtml(item.label)}
                        </span>
                    `).join("")}
                </div>
            ` : ""}
        `;

    }


    function tasmeeErrorHtml() {

        if (!tasmeeError) {
            return "";
        }

        const { html } = renderTajweedHtml(tasmeeError.word);

        return `
            <div class="nt-card nt-error-card">
                <h4>❌ ${escapeHtml(tasmeeError.title)}</h4>

                <div class="nt-error-word">${html}</div>

                <div class="nt-muted" style="margin-top:8px;">
                    ${escapeHtml(tasmeeError.detail)}
                </div>

                ${tasmeeError.heard ? `
                    <div class="nt-muted" style="margin-top:6px;">
                        اللي اتسمع منك: «${escapeHtml(tasmeeError.heard)}»
                    </div>
                ` : ""}

                ${tasmeeError.rules.length ? `
                    <div class="nt-row" style="margin-top:10px;">
                        <span class="nt-muted">أحكام في الكلمة دي:</span>
                        ${tasmeeError.rules.map(label => `
                            <span class="nt-chip">${escapeHtml(label)}</span>
                        `).join("")}
                    </div>
                ` : ""}

                <div class="nt-muted" style="margin-top:10px; font-weight:700;">
                    التنبيه ده هيفضل قدامك لحد ما تنطقها صح.
                </div>
            </div>
        `;

    }


    function renderTasmeeLive() {

        const current = tasmeeAyahList[tasmeeIndex];

        if (!current) {
            return;
        }

        const done = tasmeeWordIndex;
        const total = current.words.length || 1;

        setSheetBody(`
            <div class="nt-card">
                <div class="nt-row" style="justify-content:space-between;">
                    <strong>سورة ${escapeHtml(tasmeeSurah ? tasmeeSurah.name : "")}</strong>
                    <span class="nt-chip nt-active">آية ${current.number}</span>
                </div>

                <div class="nt-progress">
                    <i id="ntTasmeeProg" style="width:${Math.round((done / total) * 100)}%"></i>
                </div>

                <div class="nt-muted" id="ntTasmeeStatus" style="font-weight:700;">
                    ${tasmeeError
                        ? "🎙️ بيسمعك — كرر الكلمة اللي فيها الغلط"
                        : "🎙️ بيسمعك طول الوقت... اتلُ عادي"}
                </div>
            </div>

            ${tasmeeErrorHtml()}

            <div class="nt-card">
                <h4>تقدمك في الآية</h4>
                <div class="nt-words" id="ntTasmeeWords">${tasmeeWordsHtml(current)}</div>
                <div class="nt-row" id="ntTasmeeHint" style="margin-top:8px;">${tasmeeHintHtml(current)}</div>
            </div>

            <div class="nt-card" id="ntTasmeeAyahBox">
                ${tasmeeAyahBoxHtml(tasmeeLastDone)}
            </div>

            <div class="nt-row">
                <button class="nt-btn" id="ntTasmeeRetry">🔁 إعادة الاستماع</button>
                <button class="nt-btn" id="ntTasmeeSkipWord">⏭️ تخطي الكلمة</button>
                <button class="nt-btn" id="ntTasmeeSkip">⏭️ تخطي الآية</button>
                <button class="nt-btn nt-danger" id="ntTasmeeStop">⏹️ إيقاف</button>
            </div>
        `);

        const retryBtn = document.getElementById("ntTasmeeRetry");
        const skipWordBtn = document.getElementById("ntTasmeeSkipWord");
        const skipBtn = document.getElementById("ntTasmeeSkip");
        const stopBtn = document.getElementById("ntTasmeeStop");

        if (retryBtn) {

            retryBtn.addEventListener("click", () => {

                updateTasmeeStatus("🎙️ استعد...");

                startTasmeeListening();

            });

        }

        if (skipWordBtn) {

            skipWordBtn.addEventListener("click", () => {

                tasmeeWordIndex =
                    Math.min(tasmeeWordIndex + 1, current.words.length);

                tasmeeError = null;
                tasmeeLive = -1;
                tasmeeSoft = -1;
                tasmeeStrike = { key: "", n: 0 };

                if (tasmeeWordIndex >= current.words.length) {

                    completeTasmeeAyah(current);

                    if (!tasmeeActive) {
                        return;
                    }

                }

                renderTasmeeLive();

            });

        }

        if (skipBtn) {

            skipBtn.addEventListener("click", () => {

                tasmeeIndex += 1;
                tasmeeWordIndex = 0;
                tasmeeError = null;
                tasmeeLive = -1;
                tasmeeSoft = -1;
                tasmeeStrike = { key: "", n: 0 };

                if (tasmeeIndex >= tasmeeAyahList.length) {

                    finishTasmee();

                    return;

                }

                scrollToAyah(tasmeeAyahList[tasmeeIndex].number, false);

                renderTasmeeLive();

            });

        }

        if (stopBtn) {

            stopBtn.addEventListener("click", () => {

                stopTasmee();

                if (typeof tasmeeExitHandler === "function") {

                    tasmeeExitHandler();

                    return;

                }

                renderSmartTasmee();

            });

        }

    }


    function startTasmee(startNumber, surahOverride) {

        const ayahs = getTasmeeAyahs();

        if (!ayahs.length) {

            safeToast("افتح سورة في المصحف الأول");

            return false;

        }

        tasmeeSurah = surahOverride || selectedSurah;
        tasmeeAyahList = ayahs;

        const startIndex =
            ayahs.findIndex(item => item.number === Number(startNumber));

        tasmeeIndex = startIndex >= 0 ? startIndex : 0;
        tasmeeWordIndex = 0;
        tasmeeError = null;
        tasmeeLive = -1;
        tasmeeLastDone = null;
        tasmeeStrike = { key: "", n: 0 };
        tasmeeSoft = -1;
        tasmeeQuickEnds = 0;
        tasmeeActive = true;

        holdScreenAwake(true);

        applyHideAyahText(true);

        scrollToAyah(tasmeeAyahList[tasmeeIndex].number, false);

        renderTasmeeLive();

        startTasmeeListening();

        return true;

    }


    function renderSmartTasmee() {

        if (tasmeeActive) {

            renderTasmeeLive();

            return;

        }

        const SpeechRecognitionCtor =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognitionCtor) {

            setSheetBody(`
                <div class="nt-card">
                    <h4>مش متاح على المتصفح ده</h4>
                    <div class="nt-muted">
                        التعرف على الصوت مش مدعوم في المتصفح ده.
                        جرّب كروم على الأندرويد أو الكمبيوتر.
                    </div>
                </div>
            `);

            return;

        }

        const ayahs = getTasmeeAyahs();

        if (!selectedSurah || !ayahs.length) {

            setSheetBody(`
                <div class="nt-card">
                    <h4>افتح سورة الأول</h4>
                    <div class="nt-muted">
                        اختار سورة وافتحها في المصحف، وبعدين ارجع
                        هنا وابدأ التسميع الذكي.
                    </div>
                    <div class="nt-row" style="margin-top:12px;">
                        <select class="nt-select" id="ntTasmeeSurahSelect">
                            ${surahs.map(item => `
                                <option value="${item.id}">${escapeHtml(item.name)}</option>
                            `).join("")}
                        </select>
                        <button class="nt-btn nt-primary" id="ntTasmeeOpen">افتح المصحف</button>
                    </div>
                </div>
            `);

            document
                .getElementById("ntTasmeeOpen")
                .addEventListener("click", async () => {

                    const id =
                        Number(document.getElementById("ntTasmeeSurahSelect").value);

                    const surah = getSurahById(id);

                    if (!surah) {
                        return;
                    }

                    closeSheet();

                    await openMushaf(surah, true);

                    safeToast("افتح أدوات نور التلاوة تاني وابدأ التسميع الذكي 🎙️");

                });

            return;

        }

        setSheetBody(`
            <div class="nt-card">
                <h4>التسميع الذكي 🎙️</h4>
                <div class="nt-muted">
                    هيسمعك وانت بتقرا، وهيوقفك عند أي كلمة غلط أو
                    ناقصة ويقولك غلطت في إيه (حرف، مد، أو حكم في
                    الكلمة)، والتنبيه بيفضل ظاهر لحد ما تنطقها صح.
                </div>
                <div class="nt-row" style="margin-top:12px;">
                    <span class="nt-muted">ابدأ من آية رقم</span>
                    <input class="nt-input" style="max-width:90px;"
                           type="number" id="ntTasmeeStart"
                           min="1" max="${selectedSurah.ayahs}"
                           value="${selectedAyah ? Number(selectedAyah) : 1}">
                </div>
                <div class="nt-row" style="margin-top:12px;">
                    <button class="nt-btn nt-primary" id="ntTasmeeGo">ابدأ 🎙️</button>
                </div>
            </div>
        `);

        document
            .getElementById("ntTasmeeGo")
            .addEventListener("click", () => {

                const value =
                    Number(document.getElementById("ntTasmeeStart").value) || 1;

                startTasmee(value);

            });

    }


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


    /* =====================================================
       قائمتي (Playlist)
       =====================================================
       كل عنصر في القائمة بقى { surahId, readerId } بدل رقم
       السورة لوحده، عشان كل سورة تتحفظ بصوت قارئ معيّن اخترته
       وقت الإضافة، فمتضطرش تختار قارئ من الأول وقت التشغيل.
       لسه بنقبل الشكل القديم (مصفوفة أرقام بس) لو موجود من
       نسخة سابقة، عشان قوائم المستخدمين القديمة متضيعش.
    ===================================================== */

    function getPlaylistItems() {

        const list =
            load("playlist", []);

        if (!Array.isArray(list)) {
            return [];
        }

        return list
            .map(item => {

                if (typeof item === "number") {

                    return {
                        surahId: item,
                        readerId: null
                    };

                }

                if (item && typeof item === "object") {

                    const surahId =
                        Number(item.surahId);

                    if (!Number.isFinite(surahId)) {
                        return null;
                    }

                    return {
                        surahId,
                        readerId: item.readerId || null
                    };

                }

                return null;

            })
            .filter(Boolean);

    }


    function isInPlaylist(surahId) {

        return getPlaylistItems().some(
            item => item.surahId === Number(surahId)
        );

    }


    function addToPlaylist(surahId, readerId) {

        const id =
            Number(surahId);

        const surah =
            getSurahById(id);

        if (!surah) {
            return;
        }

        const list =
            getPlaylistItems();

        if (list.some(item => item.surahId === id)) {

            safeToast(
                `${surah.name} موجودة في قائمتي بالفعل`
            );

            return;

        }

        const reader =
            readerId
                ? getReaderById(readerId)
                : null;

        list.push({
            surahId: id,
            readerId: reader ? reader.id : null
        });

        store("playlist", list);

        vibrate(20);

        safeToast(
            reader
                ? `تمت إضافة ${surah.name} بصوت ${reader.name} لقائمتي`
                : `تمت إضافة ${surah.name} لقائمتي`
        );

    }


    function removeFromPlaylist(surahId) {

        const id =
            Number(surahId);

        store(
            "playlist",
            getPlaylistItems().filter(
                item => item.surahId !== id
            )
        );

    }


    function clearPlaylist() {

        store("playlist", []);

    }


    function renderPlaylist() {

        const items =
            getPlaylistItems()
                .map(item => {

                    const surah =
                        getSurahById(item.surahId);

                    if (!surah) {
                        return null;
                    }

                    const reader =
                        item.readerId
                            ? getReaderById(item.readerId)
                            : null;

                    return { surah, reader };

                })
                .filter(Boolean);


        const headerHtml = `
            <div class="nt-row" style="margin-bottom:14px;">
                <button class="nt-btn nt-primary" id="ntPlaylistPlayAll" ${items.length ? "" : "disabled"}>
                    ▶ شغّل القائمة كلها
                </button>
                <button class="nt-btn nt-danger" id="ntPlaylistClear" ${items.length ? "" : "disabled"}>
                    🗑 إفراغ القائمة
                </button>
            </div>

            <div class="nt-card">
                <h4>إضافة سورة</h4>
                <input
                    type="text"
                    class="nt-input"
                    id="ntPlaylistSearch"
                    placeholder="اكتب اسم السورة...">
                <div id="ntPlaylistSearchResults" style="margin-top:10px;"></div>
            </div>
        `;


        const listHtml =
            items.length
                ? items.map(({ surah, reader }) => `
                    <div class="nt-list-item">
                        <div class="nt-list-main">
                            <strong>${escapeHtml(surah.name)}</strong>
                            <div class="nt-muted">
                                ${
                                    reader
                                        ? `بصوت ${escapeHtml(reader.name)}`
                                        : "من غير قارئ محدد"
                                }
                            </div>
                        </div>
                        <button class="nt-btn" data-nt-pl-play="${surah.id}">▶</button>
                        <button class="nt-btn nt-danger" data-nt-pl-del="${surah.id}">حذف</button>
                    </div>
                `).join("")
                : `<div class="nt-empty">قائمتي فاضية لحد دلوقتي. دوّر على سورة فوق وضيفها.</div>`;


        setSheetBody(
            headerHtml + listHtml
        );


        function wireListButtons() {

            sheetBody
                .querySelectorAll("[data-nt-pl-play]")
                .forEach(button => {

                    button.addEventListener("click", () => {

                        closeSheet();

                        if (typeof window.playFromPlaylist === "function") {
                            window.playFromPlaylist(
                                Number(button.dataset.ntPlPlay)
                            );
                        }

                    });

                });

            sheetBody
                .querySelectorAll("[data-nt-pl-del]")
                .forEach(button => {

                    button.addEventListener("click", () => {

                        removeFromPlaylist(
                            button.dataset.ntPlDel
                        );

                        renderPlaylist();

                    });

                });

        }

        wireListButtons();


        const playAllBtn =
            document.getElementById("ntPlaylistPlayAll");

        if (playAllBtn) {

            playAllBtn.addEventListener("click", () => {

                closeSheet();

                if (typeof window.playFromPlaylist === "function") {
                    window.playFromPlaylist(null);
                }

            });

        }


        const clearBtn =
            document.getElementById("ntPlaylistClear");

        if (clearBtn) {

            clearBtn.addEventListener("click", () => {

                clearPlaylist();

                renderPlaylist();

            });

        }


        /*
            بحث فوري لإضافة سور: بمجرد ما تكتب أي حرف بيفلتر
            على طول (زي بحث احترافي) بدل ما تدوس Enter. وبعد
            ما تختار سورة، بنفتح قائمة القراء عشان تحدد تحطها
            بصوت مين.
        */
        const searchInputEl =
            document.getElementById("ntPlaylistSearch");

        const resultsEl =
            document.getElementById("ntPlaylistSearchResults");

        if (searchInputEl && resultsEl) {

            searchInputEl.addEventListener("input", () => {

                const query =
                    searchInputEl.value.trim();

                if (!query) {

                    resultsEl.innerHTML = "";

                    return;

                }

                const results =
                    searchSurahs(query).slice(0, 8);

                if (!results.length) {

                    resultsEl.innerHTML =
                        `<div class="nt-empty">مفيش سور بالاسم ده</div>`;

                    return;

                }

                resultsEl.innerHTML =
                    results.map(surah => `
                        <div class="nt-list-item">
                            <div class="nt-list-main">
                                <strong>${escapeHtml(surah.name)}</strong>
                            </div>
                            <button class="nt-btn nt-primary" data-nt-pl-add="${surah.id}">
                                ${isInPlaylist(surah.id) ? "✓ مضافة" : "+ إضافة"}
                            </button>
                        </div>
                    `).join("");

                resultsEl
                    .querySelectorAll("[data-nt-pl-add]")
                    .forEach(button => {

                        button.addEventListener("click", () => {

                            const surahId =
                                Number(button.dataset.ntPlAdd);

                            if (isInPlaylist(surahId)) {

                                removeFromPlaylist(surahId);

                                renderPlaylist();

                                return;

                            }

                            const surah =
                                getSurahById(surahId);

                            if (!surah) {
                                return;
                            }

                            if (typeof window.openAyahReaderPicker !== "function") {
                                return;
                            }

                            window.openAyahReaderPicker({

                                subtitle:
                                    `عايز تحط "${surah.name}" في قائمتك بصوت مين؟`,

                                onPick: reader => {

                                    addToPlaylist(
                                        surahId,
                                        reader.id
                                    );

                                    renderPlaylist();

                                }

                            });

                        });

                    });

            });

        }

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
                tasmeeActive
                    ? tasmeeMushafRoot()
                    : document.getElementById("mushafPage");

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
    let qiblaEventNames = [];


    function stopQiblaCompass() {

        if (!qiblaOrientationHandler) {
            return;
        }

        qiblaEventNames.forEach(name => {
            window.removeEventListener(name, qiblaOrientationHandler);
        });

        qiblaOrientationHandler = null;
        qiblaEventNames = [];

    }


    /*
        اتجاه الجهاز بالنسبة للشمال المغناطيسي من قراءات alpha/beta/gamma:
        - الموبايل مسطّح تقريبًا: اتجاه الحافة العلوية = 360 - alpha.
        - الموبايل واقف: اتجاه الكاميرا الخلفية (المعادلة الكاملة).
    */
    function compassHeadingFromEuler(alpha, beta, gamma) {

        if (Math.abs(beta) < 60) {
            return (360 - alpha + 360) % 360;
        }

        const r = Math.PI / 180;
        const cA = Math.cos(alpha * r), sA = Math.sin(alpha * r);
        const cB = Math.cos(beta * r), sB = Math.sin(beta * r);
        const cG = Math.cos(gamma * r), sG = Math.sin(gamma * r);

        const east = -cA * sG - sA * sB * cG;
        const north = -sA * sG + cA * sB * cG;

        return (Math.atan2(east, north) * 180 / Math.PI + 360) % 360;

    }


    function needsCompassPermission() {

        return typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function";

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

            <div class="nt-compass" id="ntQiblaCompass">
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
                <button class="nt-btn" id="ntQiblaStart" hidden>
                    تشغيل البوصلة
                </button>
            </div>

            <div class="nt-card" style="margin-top:14px;">
                <div class="nt-muted">
                    حط الموبايل مسطّح في إيدك وبعيد عن المعادن والمغناطيس
                    (جراب مغناطيسي، سماعات، سيارة)، ولف لحد ما 🕋 تبقى
                    لفوق وتبقى البوصلة خضرا. لو الاتجاه بيتهز أو مش
                    منطقي، <b>عاير البوصلة</b> بتحريك الموبايل على شكل 8
                    في الهوا كذا مرة.
                </div>
            </div>
        `);

        const locateButton =
            document.getElementById("ntQiblaLocate");

        locateButton.addEventListener("click", () => {

            if (!navigator.geolocation) {

                safeToast("المتصفح مش بيدعم تحديد الموقع");

                return;

            }

            /* على الآيفون الإذن لازم يتطلب مباشرة من الضغطة نفسها */
            const permission = needsCompassPermission()
                ? DeviceOrientationEvent.requestPermission().catch(() => "denied")
                : null;

            safeToast("جاري تحديد موقعك...");

            navigator.geolocation.getCurrentPosition(

                position => {

                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    store("qiblaLocation", location);

                    applyQibla(location, permission);

                },

                () => {

                    safeToast("لم نتمكن من تحديد موقعك");

                },

                { timeout: 15000, maximumAge: 0, enableHighAccuracy: true }

            );

        });

        if (saved) {
            applyQibla(saved, null);
        }

    }


    function applyQibla(location, permission) {

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

        const compass = document.getElementById("ntQiblaCompass");
        const startButton = document.getElementById("ntQiblaStart");

        let smoothSin = 0;
        let smoothCos = 0;
        let hasSmooth = false;
        let shownAngle = bearing;
        let wasAligned = false;
        let gotReading = false;

        const handler = event => {

            let heading = null;
            let lowAccuracy = false;

            if (typeof event.webkitCompassHeading === "number") {

                heading = event.webkitCompassHeading;

                lowAccuracy =
                    typeof event.webkitCompassAccuracy === "number" &&
                    (event.webkitCompassAccuracy < 0 ||
                     event.webkitCompassAccuracy > 25);

            } else if (
                event.absolute === true &&
                typeof event.alpha === "number"
            ) {

                /* قراءة نسبية (absolute=false) بتدّي شمال غلط، فبنتجاهلها */
                heading = compassHeadingFromEuler(
                    event.alpha,
                    event.beta || 0,
                    event.gamma || 0
                );

            }

            if (heading === null || !isFinite(heading)) {
                return;
            }

            const liveNeedle =
                document.getElementById("ntQiblaNeedle");

            if (!liveNeedle) {

                stopQiblaCompass();

                return;

            }

            gotReading = true;

            /* تنعيم القراءة عشان الإبرة متهزش (بالجيب وجيب التمام عشان 359 و1 يتحسبوا صح) */
            const rad = heading * Math.PI / 180;

            if (!hasSmooth) {

                smoothSin = Math.sin(rad);
                smoothCos = Math.cos(rad);
                hasSmooth = true;

            } else {

                smoothSin += (Math.sin(rad) - smoothSin) * 0.2;
                smoothCos += (Math.cos(rad) - smoothCos) * 0.2;

            }

            const smooth =
                (Math.atan2(smoothSin, smoothCos) * 180 / Math.PI + 360) % 360;

            const corrected = smooth;

            const target = (bearing - corrected + 360) % 360;

            /* أقصر لفّة: متلفش لفة كاملة لما تعدّي 0/360 */
            const delta = ((target - shownAngle) % 360 + 540) % 360 - 180;

            shownAngle += delta;

            liveNeedle.style.transform = `rotate(${shownAngle}deg)`;

            const offBy = Math.abs(((bearing - corrected) % 360 + 540) % 360 - 180);
            const aligned = offBy <= 4;

            if (compass) {
                compass.classList.toggle("nt-qibla-ok", aligned);
            }

            if (aligned && !wasAligned) {

                try {
                    if (navigator.vibrate) {
                        navigator.vibrate(40);
                    }
                } catch (error) { /* */ }

            }

            wasAligned = aligned;

            const status =
                document.getElementById("ntQiblaStatus");

            if (status) {

                status.textContent = aligned
                    ? "✅ أنت دلوقتي في اتجاه القبلة"
                    : lowAccuracy
                        ? "⚠️ دقة البوصلة ضعيفة، حرّك الموبايل على شكل 8 لمعايرتها"
                        : "لف بالموبايل لحد ما 🕋 تبقى لفوق";

            }

        };

        const startListening = () => {

            qiblaOrientationHandler = handler;

            /* مصدر واحد بس: المطلق لو متاح، عشان القراءتين مايتخلطوش */
            qiblaEventNames =
                ("ondeviceorientationabsolute" in window)
                    ? ["deviceorientationabsolute"]
                    : ["deviceorientation"];

            qiblaEventNames.forEach(name => {
                window.addEventListener(name, handler);
            });

            if (startButton) {
                startButton.hidden = true;
            }

            setTimeout(() => {

                const status = document.getElementById("ntQiblaStatus");

                if (!gotReading && status && qiblaOrientationHandler === handler) {

                    status.textContent =
                        "جهازك مش بيدّي قراءة بوصلة موثوقة. استخدم الدرجة المكتوبة تحت مع بوصلة عادية.";

                }

            }, 3000);

        };

        try {

            if (needsCompassPermission()) {

                const askFromButton = () => {

                    DeviceOrientationEvent.requestPermission()
                        .then(result => {
                            if (result === "granted") {
                                startListening();
                            } else {
                                safeToast("لازم تسمح بالوصول للحسّاسات عشان البوصلة تشتغل");
                            }
                        })
                        .catch(() => {});

                };

                if (permission) {

                    permission.then(result => {

                        if (result === "granted") {
                            startListening();
                        }

                    });

                } else if (startButton) {

                    startButton.hidden = false;
                    startButton.onclick = askFromButton;

                }

            } else {

                startListening();

            }

        } catch (error) { /* */ }

    }


    /* =====================================================
       12) السبحة
    ===================================================== */

    /*
        مهم: الأذكار الستة الأولى لازم تفضل في أماكنها بنفس الترتيب،
        لأن العدّاد المحفوظ بيتخزن برقم الذكر. أي ذكر جديد يتضاف
        في آخر القائمة بس.
    */
    const TASBEEH_PRESETS = [
        { text: "سبحان الله", target: 33, virtue: "التسبيح بعد الصلاة: سبحان الله 33، والحمد لله 33، والله أكبر 33، ثم تمام المائة بـ لا إله إلا الله وحده لا شريك له... (رواه مسلم)" },
        { text: "الحمد لله", target: 33, virtue: "قال ﷺ: \"والحمد لله تملأ الميزان\" (رواه مسلم)" },
        { text: "الله أكبر", target: 34, virtue: "تمام المائة بعد الصلاة: الله أكبر 34 (رواه مسلم)" },
        { text: "لا إله إلا الله", target: 100, virtue: "قال ﷺ: \"أفضل الذكر لا إله إلا الله\" (رواه الترمذي)" },
        { text: "أستغفر الله", target: 100, virtue: "قال ﷺ: \"يا أيها الناس توبوا إلى الله فإني أتوب في اليوم إليه مائة مرة\" (رواه مسلم)" },
        { text: "اللهم صل على محمد", target: 100, virtue: "قال ﷺ: \"من صلى عليّ صلاة صلى الله عليه بها عشرًا\" (رواه مسلم)" },
        { text: "سبحان الله وبحمده", target: 100, virtue: "من قالها مائة مرة في اليوم حُطّت خطاياه وإن كانت مثل زبد البحر (متفق عليه)" },
        { text: "سبحان الله وبحمده، سبحان الله العظيم", target: 100, virtue: "كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن (متفق عليه)" },
        { text: "لا حول ولا قوة إلا بالله", target: 100, virtue: "قال ﷺ: \"كنز من كنوز الجنة\" (متفق عليه)" },
        { text: "لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير", target: 100, virtue: "من قالها مائة مرة في اليوم كانت له عدل عشر رقاب، وكُتبت له مائة حسنة، ومُحيت عنه مائة سيئة (متفق عليه)" },
        { text: "أستغفر الله العظيم وأتوب إليه", target: 100, virtue: "الاستغفار سبب لمغفرة الذنوب وسعة الرزق" },
        { text: "رب اغفر لي وتب علي إنك أنت التواب الرحيم", target: 100, virtue: "كان يُعدّ للنبي ﷺ في المجلس الواحد مائة مرة (رواه أبو داود والترمذي)" },
        { text: "سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر", target: 100, virtue: "قال ﷺ: \"أحب الكلام إلى الله أربع: سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر\" (رواه مسلم)" },
        { text: "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار", target: 33, virtue: "كان أكثر دعاء النبي ﷺ (متفق عليه)" },
        { text: "لا إله إلا أنت سبحانك إني كنت من الظالمين", target: 33, virtue: "دعوة ذي النون: ما دعا بها مسلم في شيء إلا استجاب الله له (رواه الترمذي)" }
    ];


    /*
        العدّاد بيتخزن في localStorage على طول أول ما تدوس،
        فأي خروج من التطبيق (أو قفل الموبايل) مش بيضيّع
        العدد. وبنخزن عدد منفصل لكل ذكر + إجمالي عام،
        عشان لما تبدّل بين الأذكار كل واحد يرجع بعدده.
    */
    function loadTasbeehState() {

        const raw = load("tasbeeh", null);

        const state = { index: 0, counts: {}, total: 0 };

        if (raw && typeof raw === "object") {

            state.index = Number(raw.index) || 0;

            state.total = Number(raw.total) || 0;

            if (raw.counts && typeof raw.counts === "object") {

                state.counts = raw.counts;

            } else if (typeof raw.count === "number") {

                /* نسخة قديمة كانت بتخزن عداد واحد بس */
                state.counts[state.index] = raw.count;

                state.total = state.total || raw.count;

            }

        }

        return state;

    }


    /* قائمة الأذكار الكاملة مقفولة افتراضيًا، وبتفتح بزرار الذكر الحالي */
    let tasbeehListOpen = false;


    function renderTasbeeh() {

        const state = loadTasbeehState();

        const preset =
            TASBEEH_PRESETS[state.index] || TASBEEH_PRESETS[0];

        const currentCount =
            Number(state.counts[state.index]) || 0;

        setSheetBody(`
            <div class="nt-tasbeeh-picker">

                <button class="nt-tasbeeh-nav" id="ntTasbeehPrev"
                        aria-label="الذكر السابق"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"/></svg></button>

                <button class="nt-tasbeeh-current" id="ntTasbeehToggle"
                        aria-expanded="${tasbeehListOpen ? "true" : "false"}">
                    <span class="nt-tasbeeh-current-text">
                        ${escapeHtml(preset.text)}
                    </span>
                    <small>
                        ${state.index + 1} / ${TASBEEH_PRESETS.length}
                        &nbsp;·&nbsp;
                        ${tasbeehListOpen ? "إخفاء القائمة ▴" : "كل الأذكار ▾"}
                    </small>
                </button>

                <button class="nt-tasbeeh-nav" id="ntTasbeehNext"
                        aria-label="الذكر التالي"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 6 9 12 15 18"/></svg></button>

            </div>

            ${tasbeehListOpen ? `
                <div class="nt-tasbeeh-list">
                    ${TASBEEH_PRESETS.map((item, index) => `
                        <button class="nt-tasbeeh-item ${index === state.index ? "nt-active" : ""}"
                                data-nt-tasbeeh="${index}">
                            <span>${escapeHtml(item.text)}</span>
                            <b>${Number(state.counts[index]) || 0}</b>
                        </button>
                    `).join("")}
                </div>
            ` : ""}

            <div class="nt-tasbeeh-count" id="ntTasbeehCount">
                ${currentCount}
            </div>

            <div class="nt-muted" style="text-align:center;">
                الهدف: ${preset.target}
            </div>

            ${preset.virtue ? `
                <div class="nt-tasbeeh-virtue">${escapeHtml(preset.virtue)}</div>
            ` : ""}

            <button class="nt-tasbeeh-tap" id="ntTasbeehTap">
                ${escapeHtml(preset.text)}
                <br>
                <span style="font-size:12px;font-weight:500;opacity:.75;">
                    دوس هنا للعد
                </span>
            </button>

            <div class="nt-row" style="justify-content:center;">
                <button class="nt-btn" id="ntTasbeehReset">تصفير الذكر ده</button>
            </div>

            <div class="nt-muted" style="text-align:center; margin-top:12px;">
                إجمالي تسبيحك: <strong id="ntTasbeehTotal">${state.total}</strong>
                <br>
                العدد بيتحفظ لوحده، تقدر تقفل التطبيق وترجع تكمّل.
            </div>
        `);


        const countLabel =
            document.getElementById("ntTasbeehCount");

        const totalLabel =
            document.getElementById("ntTasbeehTotal");


        const save = () => store("tasbeeh", state);


        document
            .querySelectorAll("[data-nt-tasbeeh]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    state.index = Number(button.dataset.ntTasbeeh);

                    tasbeehListOpen = false;

                    save();

                    renderTasbeeh();

                });

            });


        const stepDhikr = (step) => {

            const total = TASBEEH_PRESETS.length;

            state.index =
                (state.index + step + total) % total;

            save();

            renderTasbeeh();

        };

        const prevDhikr =
            document.getElementById("ntTasbeehPrev");

        const nextDhikr =
            document.getElementById("ntTasbeehNext");

        const toggleList =
            document.getElementById("ntTasbeehToggle");

        if (prevDhikr) {
            prevDhikr.addEventListener("click", () => stepDhikr(-1));
        }

        if (nextDhikr) {
            nextDhikr.addEventListener("click", () => stepDhikr(1));
        }

        if (toggleList) {

            toggleList.addEventListener("click", () => {

                tasbeehListOpen = !tasbeehListOpen;

                renderTasbeeh();

            });

        }


        const tapButton =
            document.getElementById("ntTasbeehTap");

        if (tapButton) {

            tapButton.addEventListener("click", () => {

                const next =
                    (Number(state.counts[state.index]) || 0) + 1;

                state.counts[state.index] = next;

                state.total = (Number(state.total) || 0) + 1;

                save();

                if (countLabel) {
                    countLabel.textContent = next;
                }

                if (totalLabel) {
                    totalLabel.textContent = state.total;
                }

                vibrate(18);

                if (next === preset.target) {

                    vibrate([40, 60, 40]);

                    safeToast(`تمام، وصلت ${preset.target}`);

                }

            });

        }


        const resetButton =
            document.getElementById("ntTasbeehReset");

        if (resetButton) {

            resetButton.addEventListener("click", () => {

                state.counts[state.index] = 0;

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

    /*
        وضع الصفحات (pages.js): بدل ما الأدوات تتفتح في صندوق
        منزلق من تحت، كل أداة بتترسم جوه صفحة مستقلة. كل اللي
        بيحصل إن sheetBody بيتحوّل يشاور على حاوية الصفحة،
        فكل دوال الرسم القديمة بتشتغل زي ما هي من غير أي تغيير.
    */
    let realSheetBody = null;
    let pageHost = null;


    function setPageHost(host) {

        pageHost = host || null;

        sheetBody = pageHost || realSheetBody;

    }


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
        realSheetBody = document.getElementById("ntSheetBody");
        sheetBack = document.getElementById("ntSheetBack");

        sheetBody = pageHost || realSheetBody;

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
        realSheetBody.addEventListener("click", async event => {

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

        /* في وضع الصفحات بنرسم في الصفحة نفسها */
        if (pageHost) {

            pageHost.innerHTML = html;

            return;

        }

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

        if (pageHost) {

            stopQiblaCompass();

            return;

        }

        if (!backdrop) {
            return;
        }

        backdrop.classList.remove("nt-open");

        stopQiblaCompass();

        try {

            if (tasmeeActive) {
                stopTasmee(true);
            }

        } catch (error) { /* */ }

    }


    const TOOLS = [

        { key: "playlist", icon: "🎵", label: "قائمتي", desc: "اختار السور اللي عايزها واسمعها بالترتيب اللي انت حددّه", run: renderPlaylist },
        { key: "bookmarks", icon: "🔖", label: "العلامات المرجعية", desc: "الآيات اللي حفظتها للرجوع ليها بسرعة", run: renderBookmarks },
        { key: "wird", icon: "🗓️", label: "الورد اليومي", desc: "خطة ختمة بعدد أيام أنت اللي بتحدده", run: renderWird },
        { key: "search", icon: "🔍", label: "بحث في المصحف", desc: "دوّر على أي كلمة في القرآن كله", run: renderSearch },
        { key: "memorization", icon: "🧠", label: "وضع الحفظ", desc: "تكرار الآية أكتر من مرة لتثبيت الحفظ", run: renderMemorization },
        { key: "speed", icon: "🎚️", label: "سرعة التلاوة", desc: "بطّأ أو سرّع صوت الشيخ", run: renderSpeed },
        { key: "sleep", icon: "⏰", label: "مؤقت النوم", desc: "التلاوة تقف لوحدها بعد وقت تحدده", run: renderSleep },
        { key: "reading", icon: "🔠", label: "حجم الخط", desc: "كبّر أو صغّر خط المصحف", run: renderReadingPrefs },
        { key: "tasmee", icon: "🎙️", label: "التسميع الذكي", desc: "سمّع من حفظك وهو يصحح لك", run: renderSmartTasmee },
        { key: "downloads", icon: "📥", label: "التلاوات المحفوظة", desc: "اللي نزّلته للاستماع من غير نت", run: renderDownloads },
        { key: "qibla", icon: "🕋", label: "اتجاه القبلة", desc: "بوصلة بتوريك اتجاه الكعبة", run: renderQibla },
        { key: "tasbeeh", icon: "📿", label: "السبحة", desc: "عدّاد تسبيح بيحفظ العدد", run: renderTasbeeh },
        { key: "tour", icon: "🎓", label: "إعادة الجولة", desc: "اعرض جولة التعريف بالتطبيق تاني", run: replayTour }

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

                    if (sheetTitle) {
                        sheetTitle.textContent = tool.label;
                    }

                    if (sheetBack) {
                        sheetBack.style.visibility = "visible";
                    }

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


    let wirdLoadedSurahId = null;


    function getWirdMushafSurahId() {

        return load("wirdMushafSurah", null);

    }


    async function loadWirdSurah(surah, mushafRoot) {

        if (!mushafRoot || !surah) {
            return false;
        }

        if (Number(wirdLoadedSurahId) === Number(surah.id)) {
            return true;
        }

        mushafRoot.innerHTML = `
            <div class="nt-tasmee-hint">جاري تحميل سورة ${escapeHtml(surah.name)}...</div>
        `;

        try {

            const response =
                await fetch(`${QURAN_API}/${surah.id}/quran-uthmani`);

            if (!response.ok) {
                throw new Error("failed");
            }

            const data = await response.json();

            const ayahs = (data && data.data && data.data.ayahs) || [];

            if (!ayahs.length) {
                throw new Error("empty");
            }

            renderWirdMushafText(surah, ayahs, mushafRoot);

            wirdLoadedSurahId = surah.id;

            store("wirdMushafSurah", surah.id);

            return true;

        } catch (error) {

            mushafRoot.innerHTML = `
                <div class="nt-tasmee-hint">
                    تعذر تحميل السورة، اتأكد من الاتصال وجرب تاني
                </div>
            `;

            wirdLoadedSurahId = null;

            return false;

        }

    }


    function renderWirdMushafText(surah, ayahs, mushafRoot) {

        mushafRoot.innerHTML = "";
        mushafRoot.classList.remove("nt-hide-text");

        if (surah.id !== 1 && surah.id !== 9) {

            const basmala = document.createElement("div");

            basmala.className = "basmala";

            basmala.textContent = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ";

            mushafRoot.appendChild(basmala);

        }

        const container = document.createElement("div");

        container.className = "ayahs";
        container.dataset.surah = surah.id;
        container.dataset.surahName = surah.name;

        ayahs.forEach(ayah => {

            const text =
                surah.id === 1
                    ? String(ayah.text || "")
                    : stripBasmala(String(ayah.text || ""));

            const span = document.createElement("span");

            span.className = "ayah";
            span.dataset.number = ayah.numberInSurah;
            span.dataset.page = ayah.page || "";
            span.dataset.juz = ayah.juz || "";
            if (ayah.sajda) {
                span.dataset.sajda = "1";
            }

            span.innerHTML = `
                ${escapeHtml(text.trim())}
                <span class="ayah-number">${ayah.numberInSurah}</span>
            `;

            container.appendChild(span);

        });

        mushafRoot.appendChild(container);

    }


    function scrollToWirdAyah(mushafRoot, ayahNumber) {

        if (!mushafRoot) {
            return;
        }

        requestAnimationFrame(() => {

            const target =
                mushafRoot.querySelector(`.ayah[data-number="${ayahNumber}"]`);

            if (!target) {
                return;
            }

            target.scrollIntoView({ behavior: "smooth", block: "center" });

            mushafRoot
                .querySelectorAll(".ayah.tap-selected")
                .forEach(item => item.classList.remove("tap-selected"));

            target.classList.add("tap-selected");

        });

    }


    function syncWirdSurahPicker(surahId) {

        const picker = document.getElementById("ntWirdPickSurah");

        if (picker) {
            picker.value = String(surahId);
        }

    }


    /*
        لوحة اختيار سورة تحت المصحف المستقل بتاع صفحة الورد،
        عشان المستخدم يقدر يقرا أي سورة هنا من غير ما يأثر على
        مصحف صفحة "المصحف" ولا مصحف "وضع الحفظ".
    */
    function renderWirdMushafPicker(host, mushafRoot, defaultSurahId) {

        if (!mushafRoot) {
            return;
        }

        const currentId =
            wirdLoadedSurahId ||
            getWirdMushafSurahId() ||
            defaultSurahId ||
            1;

        host.insertAdjacentHTML("beforeend", `
            <div class="nt-card">
                <h4>مصحف الورد</h4>
                <div class="nt-muted" style="margin-bottom:8px;">
                    المصحف ده تحت خاص بصفحة الورد بس، ولو غيرت السورة
                    هنا هيفضل واقف عليها المرة الجاية، من غير ما يأثر
                    على مصحف أي صفحة تانية.
                </div>
                <select class="nt-select" id="ntWirdPickSurah">
                    ${surahs.map(item => `
                        <option value="${item.id}" ${
                            Number(item.id) === Number(currentId) ? "selected" : ""
                        }>
                            ${item.id}. ${escapeHtml(item.name)}
                        </option>
                    `).join("")}
                </select>
            </div>
        `);

        const picker = document.getElementById("ntWirdPickSurah");

        if (picker) {

            picker.addEventListener("change", () => {

                const picked = getSurahById(Number(picker.value));

                if (picked) {
                    loadWirdSurah(picked, mushafRoot);
                }

            });

        }

        if (Number(wirdLoadedSurahId) !== Number(currentId)) {

            const picked = getSurahById(currentId);

            if (picked) {
                loadWirdSurah(picked, mushafRoot);
            }

        }

    }


    /*
        host: حاوية التحكم (تقدمك في الختمة + الأزرار).
        mushafRoot: حاوية المصحف المستقل بتاع صفحة الورد بس،
        لو مبعوتش (مثلاً الصندوق المنزلق القديم) بيرجع للسلوك
        القديم اللي بيفتح مصحف صفحة "المصحف" العادي.
    */
    function renderWird(host, mushafRoot) {

        host = host || sheetBody;

        if (!host) {
            return;
        }

        const plan = getWirdPlan();

        if (!plan) {

            host.innerHTML = `
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
            `;

            host
                .querySelectorAll("[data-nt-wird]")
                .forEach(button => {

                    button.addEventListener("click", () => {

                        startWirdPlan(Number(button.dataset.ntWird));

                        renderWird(host, mushafRoot);

                    });

                });

            renderWirdMushafPicker(host, mushafRoot, 1);

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


        host.innerHTML = `
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
        `;


        const openButton = document.getElementById("ntWirdOpen");

        if (openButton) {

            openButton.addEventListener("click", async () => {

                if (mushafRoot) {

                    const ready = await loadWirdSurah(start.surah, mushafRoot);

                    if (ready) {
                        scrollToWirdAyah(mushafRoot, start.ayah);
                    }

                    syncWirdSurahPicker(start.surah.id);

                } else {

                    /* رجوع للسلوك القديم لو مفيش مصحف مستقل هنا */
                    openTodayWird();

                }

            });

        }


        const doneButton = document.getElementById("ntWirdDone");

        if (doneButton && !doneToday) {

            doneButton.addEventListener("click", () => {

                completeTodayWird();

                renderWird(host, mushafRoot);

            });

        }


        document
            .getElementById("ntWirdReset")
            .addEventListener("click", () => {

                store("wird", null);

                renderWird(host, mushafRoot);

            });


        renderWirdMushafPicker(
            host,
            mushafRoot,
            finished ? 1 : start.surah.id
        );

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


    /* =====================================================
       وضع الحفظ: مصحف مستقل بيه
       =====================================================
       بيجيب نص السورة من الـ API في حاوية خاصة بالصفحة دي
       بس (زي التسميع بالظبط)، وبيستخدم محرك الصوت/التوقيت
       الموجود بالفعل (audio, loadAyahTimings, ...) عشان
       يكرر كل آية بالعدد المطلوب، من غير ما يفتح مصحف باقي
       التطبيق خالص.
    ===================================================== */

    let memoLoadedSurahId = null;
    let memoRunningHost = null;
    let memoRunningMushaf = null;


    function memoSetupStatus(text) {

        const status =
            document.getElementById("ntMemoSetupStatus");

        if (status) {
            status.textContent = text || "";
        }

    }


    async function loadMemoSurah(surah, mushafRoot) {

        if (!mushafRoot || !surah) {
            return false;
        }

        if (Number(memoLoadedSurahId) === Number(surah.id)) {
            return true;
        }

        mushafRoot.innerHTML = `
            <div class="nt-tasmee-hint">جاري تحميل سورة ${escapeHtml(surah.name)}...</div>
        `;

        try {

            const response =
                await fetch(`${QURAN_API}/${surah.id}/quran-uthmani`);

            if (!response.ok) {
                throw new Error("failed");
            }

            const data = await response.json();

            const ayahs = (data && data.data && data.data.ayahs) || [];

            if (!ayahs.length) {
                throw new Error("empty");
            }

            renderMemoMushafText(surah, ayahs, mushafRoot);

            memoLoadedSurahId = surah.id;

            store("memoMushafSurah", surah.id);

            return true;

        } catch (error) {

            mushafRoot.innerHTML = `
                <div class="nt-tasmee-hint">
                    تعذر تحميل السورة، اتأكد من الاتصال وجرب تاني
                </div>
            `;

            memoLoadedSurahId = null;

            return false;

        }

    }


    function renderMemoMushafText(surah, ayahs, mushafRoot) {

        mushafRoot.innerHTML = "";
        mushafRoot.classList.remove("nt-hide-text");

        if (surah.id !== 1 && surah.id !== 9) {

            const basmala = document.createElement("div");

            basmala.className = "basmala";

            basmala.textContent = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ";

            mushafRoot.appendChild(basmala);

        }

        const container = document.createElement("div");

        container.className = "ayahs";
        container.dataset.surah = surah.id;
        container.dataset.surahName = surah.name;

        ayahs.forEach(ayah => {

            const text =
                surah.id === 1
                    ? String(ayah.text || "")
                    : stripBasmala(String(ayah.text || ""));

            const span = document.createElement("span");

            span.className = "ayah";
            span.dataset.number = ayah.numberInSurah;
            span.dataset.page = ayah.page || "";
            span.dataset.juz = ayah.juz || "";
            if (ayah.sajda) {
                span.dataset.sajda = "1";
            }

            span.innerHTML = `
                ${escapeHtml(text.trim())}
                <span class="ayah-number">${ayah.numberInSurah}</span>
            `;

            container.appendChild(span);

        });

        mushafRoot.appendChild(container);

    }


    function highlightMemoAyah(number) {

        if (!memoRunningMushaf) {
            return;
        }

        memoRunningMushaf
            .querySelectorAll(".ayah.active")
            .forEach(item => item.classList.remove("active"));

        const target =
            memoRunningMushaf.querySelector(`.ayah[data-number="${number}"]`);

        if (target) {

            target.classList.add("active");

            target.scrollIntoView({ behavior: "smooth", block: "center" });

        }

    }


    function memoHintText() {

        if (memoMode === "range") {

            return (
                `هيشغّل المقطع من "ابدأ من آية" لحد "لحد آية" ${memoTarget} ` +
                "مرات ورا بعض (مش آية آية)، وبعد آخر مرة بيقف."
            );

        }

        return (
            `هيكرر كل آية ${memoTarget} مرات لوحده، وبعدين ينتقل ` +
            "للآية اللي بعدها تلقائيًا لحد ما يوصل لآخر آية " +
            "حددتها في \"لحد آية\"."
        );

    }


    function updateMemoAyahLabel(number) {

        const label =
            document.getElementById("ntMemoAyahLabel");

        if (label) {
            label.textContent = `آية ${number}`;
        }

    }


    function finishMemorization(wholeSurah) {

        if (!memoRunningHost) {
            return;
        }

        memoRunningHost.innerHTML = `
            <div class="nt-card" style="text-align:center;">
                <div style="font-size:34px; margin-bottom:8px;">🤍</div>
                <div style="font-weight:700; margin-bottom:6px;">
                    ${wholeSurah
                        ? "اللهم تقبل منك، خلصت السورة كاملة"
                        : "اللهم تقبل منك، خلصت الآيات اللي حددتها"}
                </div>
                <div class="nt-muted">تقدر تبدأ سورة تانية أو تعيد نفس السورة</div>
                <div class="nt-row" style="justify-content:center; margin-top:14px;">
                    <button class="nt-btn nt-primary" id="ntMemoAgain">حفظ سورة تانية</button>
                </div>
            </div>
        `;

        const againBtn =
            document.getElementById("ntMemoAgain");

        if (againBtn) {

            againBtn.addEventListener("click", () => {

                renderMemorization(memoRunningHost, memoRunningMushaf);

            });

        }

    }


    function renderMemorizationRunning() {

        const host = memoRunningHost;

        if (!host) {
            return;
        }

        host.innerHTML = `
            <div class="nt-card">
                <div class="nt-row" style="justify-content:space-between;">
                    <strong>سورة ${escapeHtml(selectedSurah ? selectedSurah.name : "")}</strong>
                    <span class="nt-chip nt-active" id="ntMemoAyahLabel">
                        آية ${selectedAyah || ""}
                    </span>
                </div>
                ${memoMode === "range" ? `
                <div class="nt-muted" style="margin-top:8px;">
                    بيكرر المقطع كله من آية ${memoRangeFrom}
                    لحد آية ${memoRangeTo}، ${memoTarget} مرات ورا بعض
                </div>
                <div class="nt-row" style="margin-top:10px;">
                    <span class="nt-chip" id="ntMemoRoundLabel">
                        المرة ${Math.min(memoCount + 1, memoTarget)} من ${memoTarget}
                    </span>
                </div>
                ` : `
                <div class="nt-muted" style="margin-top:8px;">
                    بيكرر كل آية ${memoTarget} مرات، وبيروح للي بعدها لوحده
                    لحد آية ${memoEndAyah || (selectedSurah ? selectedSurah.ayahs : "")}
                </div>
                `}
            </div>

            <div class="nt-row">
                <button class="nt-btn nt-danger" id="ntMemoStop">⏹️ إيقاف وضع الحفظ</button>
            </div>
        `;

        const stopBtn =
            document.getElementById("ntMemoStop");

        if (stopBtn) {

            stopBtn.addEventListener("click", () => {

                audio.pause();

                setMemoEnabled(false);

                renderMemorization(memoRunningHost, memoRunningMushaf);

            });

        }

    }


    async function startMemorization(surah, reader, fromAyah, toAyah, host, mushafRoot) {

        memoRunningHost = host;
        memoRunningMushaf = mushafRoot;

        selectReader(reader);
        selectSurah(surah);

        setSelectedAyah(fromAyah || 1);

        memoEndAyah =
            toAyah && Number(toAyah) >= (fromAyah || 1)
                ? Number(toAyah)
                : null;

        memoRangeFrom = Number(fromAyah) || 1;
        memoRangeTo = memoEndAyah || surah.ayahs;

        setMemoEnabled(true);

        renderMemorizationRunning();

        highlightMemoAyah(fromAyah || 1);

        try {

            await playSelectedSurah(false);

        } catch (error) {

            safeToast("تعذر تشغيل الصوت");

            setMemoEnabled(false);

            renderMemorization(host, mushafRoot);

        }

    }


    /*
        host: الحاوية اللي هيترسم فيها التحكم (فوق).
        mushafRoot: الحاوية اللي هيترسم فيها المصحف المستقل (تحت).
    */
    function renderMemorization(host, mushafRoot) {

        host = host || sheetBody;

        memoRunningHost = host;
        memoRunningMushaf = mushafRoot || null;

        if (!host) {
            return;
        }

        if (memoEnabled) {

            renderMemorizationRunning();

            return;

        }

        /*
            مفيش أي ربط هنا بمصحف صفحة "المصحف" العادي ولا بأي
            مصحف تاني: أول أولوية للسورة اللي محمّلة دلوقتي في
            صفحة الحفظ، وبعدها آخر سورة اتحفظت ليها في
            localStorage تحت مفتاحها الخاص. لو مفيش أي حاجة
            من الاتنين (أول مرة يفتح فيها المستخدم الصفحة دي)،
            بنبدأ بسورة الفاتحة كقيمة افتراضية ثابتة.
        */
        const currentId =
            memoLoadedSurahId ||
            load("memoMushafSurah", null) ||
            1;

        const surah = getSurahById(currentId);

        host.innerHTML = `
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

            <div class="nt-card">
                <h4>طريقة التكرار</h4>
                <div class="nt-row">
                    <button class="nt-chip ${memoMode === "range" ? "nt-active" : ""}"
                            data-nt-memo-mode="range">
                        المقطع كله
                    </button>
                    <button class="nt-chip ${memoMode === "each" ? "nt-active" : ""}"
                            data-nt-memo-mode="each">
                        كل آية لوحدها
                    </button>
                </div>
            </div>

            <div class="nt-card">
                <h4>السورة والقارئ</h4>

                <select class="nt-select" id="ntMemoSurah" style="margin-top:8px;">
                    ${surahs.map(item => `
                        <option value="${item.id}" ${
                            Number(item.id) === Number(currentId) ? "selected" : ""
                        }>
                            ${item.id}. ${escapeHtml(item.name)}
                        </option>
                    `).join("")}
                </select>

                <select class="nt-select" id="ntMemoReader" style="margin-top:8px;">
                    <option value="">اختار القارئ</option>
                    ${readers.map(item => `
                        <option value="${item.id}" ${
                            selectedReader && String(selectedReader.id) === String(item.id)
                                ? "selected"
                                : ""
                        }>
                            ${escapeHtml(item.name)}
                        </option>
                    `).join("")}
                </select>

                <div class="nt-row" style="margin-top:10px;">
                    <span class="nt-muted">ابدأ من آية</span>
                    <input class="nt-input" style="max-width:90px;"
                           type="number" id="ntMemoStartAyah"
                           min="1" max="${surah ? surah.ayahs : 286}" value="1">
                </div>

                <div class="nt-row" style="margin-top:10px;">
                    <span class="nt-muted">لحد آية</span>
                    <input class="nt-input" style="max-width:90px;"
                           type="number" id="ntMemoEndAyah"
                           min="1" max="${surah ? surah.ayahs : 286}"
                           value="${surah ? surah.ayahs : 286}">
                </div>

                <div class="nt-muted" id="ntMemoSetupStatus" style="margin-top:10px;"></div>

                <div class="nt-row" style="margin-top:12px;">
                    <button class="nt-btn nt-primary" id="ntMemoBegin">
                        ابدأ الحفظ 🧠
                    </button>
                </div>
            </div>

            <div class="nt-card">
                <h4>مهم تعرفه</h4>
                <div class="nt-muted" id="ntMemoHint">${memoHintText()}</div>
            </div>
        `;

        const surahSelect = document.getElementById("ntMemoSurah");
        const readerSelect = document.getElementById("ntMemoReader");
        const startInput = document.getElementById("ntMemoStartAyah");
        const endInput = document.getElementById("ntMemoEndAyah");
        const beginBtn = document.getElementById("ntMemoBegin");

        const hintBox = document.getElementById("ntMemoHint");

        host
            .querySelectorAll("[data-nt-memo]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    memoTarget = Number(button.dataset.ntMemo);

                    store("memoRepeats", memoTarget);

                    host
                        .querySelectorAll("[data-nt-memo]")
                        .forEach(item => {
                            item.classList.toggle("nt-active", item === button);
                        });

                    if (hintBox) {
                        hintBox.textContent = memoHintText();
                    }

                });

            });

        host
            .querySelectorAll("[data-nt-memo-mode]")
            .forEach(button => {

                button.addEventListener("click", () => {

                    memoMode =
                        button.dataset.ntMemoMode === "each"
                            ? "each"
                            : "range";

                    store("memoMode", memoMode);

                    host
                        .querySelectorAll("[data-nt-memo-mode]")
                        .forEach(item => {
                            item.classList.toggle("nt-active", item === button);
                        });

                    if (hintBox) {
                        hintBox.textContent = memoHintText();
                    }

                });

            });

        if (surahSelect) {

            surahSelect.addEventListener("change", () => {

                const picked = getSurahById(Number(surahSelect.value));

                if (!picked || !mushafRoot) {
                    return;
                }

                if (startInput) {

                    startInput.max = picked.ayahs;
                    startInput.value = 1;

                }

                if (endInput) {

                    endInput.max = picked.ayahs;
                    endInput.value = picked.ayahs;

                }

                memoSetupStatus("");

                loadMemoSurah(picked, mushafRoot);

            });

        }

        if (beginBtn) {

            beginBtn.addEventListener("click", async () => {

                const picked = getSurahById(Number(surahSelect.value));

                if (!picked) {
                    return;
                }

                const reader =
                    readerSelect.value
                        ? getReaderById(readerSelect.value)
                        : null;

                if (!reader) {

                    memoSetupStatus("اختار القارئ الأول");

                    return;

                }

                if (!mushafRoot) {

                    memoSetupStatus("تعذر فتح المصحف هنا");

                    return;

                }

                memoSetupStatus("جاري التجهيز...");

                const ready = await loadMemoSurah(picked, mushafRoot);

                if (!ready) {

                    memoSetupStatus("تعذر تحميل السورة، اتأكد من النت وجرب تاني");

                    return;

                }

                const from = Number(startInput.value) || 1;

                let to =
                    Number(endInput.value) || picked.ayahs;

                if (to > picked.ayahs) {
                    to = picked.ayahs;
                }

                if (to < from) {
                    to = from;
                }

                /*
                    التكرار (آية آية أو مقطع) بيعتمد على توقيت كل آية
                    جوه ملف الصوت. لو الشيخ ده مالوش توقيتات، الصوت كان
                    بيشتغل عادي من غير أي تكرار وبدون أي رسالة. دلوقتي
                    بنتأكد الأول ونقول للمستخدم بوضوح.
                */

                memoSetupStatus("جاري تحميل توقيتات الآيات...");

                let timings = [];

                try {

                    timings = await loadAyahTimings(reader, picked);

                } catch (error) {

                    timings = [];

                }

                const hasTiming =
                    number => timings.some(item => item.ayah === number);

                if (
                    !timings.length ||
                    !hasTiming(from) ||
                    !hasTiming(to)
                ) {

                    memoSetupStatus(
                        `مفيش توقيتات للآيات متاحة للشيخ ${reader.name} ` +
                        "(أو حصلت مشكلة في تحميلها)، فمش هينفع التكرار معاه. " +
                        "جرّب شيخ تاني."
                    );

                    return;

                }

                memoSetupStatus("");

                startMemorization(picked, reader, from, to, host, mushafRoot);

            });

        }


        if (mushafRoot && Number(memoLoadedSurahId) !== Number(currentId)) {

            const picked = getSurahById(currentId);

            if (picked) {
                loadMemoSurah(picked, mushafRoot);
            }

        }

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
       تكبير مصحف صفحة "المصحف" على الشاشة كلها
       =====================================================
       زرار صغير فوق المصحف نفسه (مش جوه محتواه، عشان محتواه
       بيتمسح ويترسم من جديد كل ما تتغير السورة) بيحوّل مصحف
       صفحة "المصحف" لوضع بياخد طول وعرض الشاشة كاملين ويخفي
       أي حاجة تانية (النافبار، تفاصيل العنوان، أزرار السورة
       السابقة/التالية...)، ما عدا شريط التشغيل اللي تحت
       (اسم السورة، اسم الشيخ، التشغيل، التكرار) وده فاضل زي
       ما هو بالظبط لأنه عنصر منفصل مالوش دعوة بالمصحف.
    ===================================================== */

    function setupMushafFullscreen() {

        const page =
            document.getElementById("mushafPage");

        if (!page || !page.parentElement) {
            return;
        }

        /* حاوية بسيطة تلف المصحف عشان الزرار يقدر يترتب فوقه بثبات */
        const wrap = el("div", "nt-mushaf-wrap");

        page.parentElement.insertBefore(wrap, page);
        wrap.appendChild(page);

        const expandBtn =
            el("button", "nt-mushaf-expand-btn", "⛶");

        expandBtn.type = "button";

        const labelOn = "تكبير المصحف على الشاشة كلها";
        const labelOff = "رجوع لوضع المصحف العادي";

        expandBtn.title = labelOn;
        expandBtn.setAttribute("aria-label", labelOn);

        wrap.appendChild(expandBtn);

        const setState = active => {

            document.body.classList.toggle("nt-mushaf-full", active);

            expandBtn.textContent = active ? "✕" : "⛶";
            expandBtn.title = active ? labelOff : labelOn;
            expandBtn.setAttribute(
                "aria-label",
                active ? labelOff : labelOn
            );

        };

        expandBtn.addEventListener("click", () => {

            setState(!document.body.classList.contains("nt-mushaf-full"));

        });

        /* زرار Escape يقفل الوضع الموسّع برضو */
        document.addEventListener("keydown", event => {

            if (
                event.key === "Escape" &&
                document.body.classList.contains("nt-mushaf-full")
            ) {
                setState(false);
            }

        });

    }


    /* =====================================================
       الزرار العائم
    ===================================================== */

    function buildFab() {

        /*
            في وضع الصفحات الأدوات بقت في قائمة النافبار،
            فمفيش لزمة للزرار العائم.
        */
        if (window.NT_ROUTER) {
            return;
        }

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


    /* =====================================================
       واجهة مختصرة لملف الصفحات (pages.js)
       =====================================================
       مفيش حاجة من دي بتغيّر سلوك قديم؛ دي بس بتسمح لراوتر
       الصفحات إنه يفتح نفس الأدوات جوه صفحات مستقلة.
    ===================================================== */

    window.NT = {

        tools: TOOLS,

        getPlaylistItems,
        isInPlaylist,
        addToPlaylist,
        removeFromPlaylist,

        getTool(key) {

            return TOOLS.find(tool => tool.key === key) || null;

        },

        runTool(key, host) {

            const tool = this.getTool(key);

            if (!tool) {
                return false;
            }

            setPageHost(host);

            tool.run();

            return true;

        },

        setPageHost,

        leavePage() {

            stopQiblaCompass();

            if (tasmeeActive) {
                stopTasmee(true);
            }

            if (memoEnabled) {

                audio.pause();

                setMemoEnabled(false);

            }

            setPageHost(null);

        },

        /* التسميع */

        startTasmee(startNumber, surah) {

            return startTasmee(startNumber, surah);

        },

        stopTasmee(silent) {

            stopTasmee(silent);

        },

        isTasmeeActive() {

            return tasmeeActive;

        },

        onTasmeeExit(handler) {

            tasmeeExitHandler = handler;

        },

        stripBasmala,

        renderMemorization(host, mushafRoot) {

            renderMemorization(host, mushafRoot);

        },

        stopMemorization() {

            if (memoEnabled) {

                audio.pause();

                setMemoEnabled(false);

            }

        },

        isMemorizationActive() {

            return memoEnabled;

        },

        renderWird(host, mushafRoot) {

            renderWird(host, mushafRoot);

        },

        speechSupported() {

            return Boolean(
                window.SpeechRecognition || window.webkitSpeechRecognition
            );

        }

    };


    function init() {

        const steps = [
            buildFab,
            setupMediaSession,
            setupAyahInteractions,
            setupMushafFullscreen,
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