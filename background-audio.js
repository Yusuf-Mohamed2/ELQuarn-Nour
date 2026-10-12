/* =========================================================
   BACKGROUND-AUDIO.JS  —  نور التلاوة
   =========================================================
   تثبيت التشغيل لما التطبيق يروح للخلفية أو الموبايل يتقفل.

   الأسباب اللي لقيناها في الكود:

   1) sw.js كان بيحمّل ملف التلاوة كله في الذاكرة (arrayBuffer)
      مع كل طلب Range لما الملف يكون مخزّن أوفلاين. السورة
      الطويلة ممكن توصل عشرات الميجابايت، والمتصفح بيبعت طلبات
      كتير ورا بعض، فالـ Service Worker في الخلفية كان بيتقتل
      ويقف الصوت. (اتصلّح في sw.js بـ Blob.slice اللي مبيحمّلش
      الملف في الذاكرة.)

   2) cacheAudioForOffline كان بينزّل نسخة كاملة تانية من الملف
      بالتوازي مع التشغيل حتى والشاشة مقفولة وعلى بيانات الموبايل،
      وده بيزاحم البث نفسه وبيستهلك ذاكرة وبطارية. هنا بنأجّله
      لحد ما يبقى مناسب (التطبيق ظاهر، أو الواي فاي).

   3) لو الشبكة اتقطعت لحظة والشاشة مقفولة (أو السيرفر قطع
      الاتصال)، حدث "error" كان بيكتب رسالة بس والصوت بيفضل
      واقف للأبد. هنا بنكمّل تلقائيًا من نفس الثانية.

   كل ده إضافي: مفيش حاجة في app.js أو features.js اتغيّرت.
   لازم يتحمّل بعد features.js.
========================================================= */

(function () {

    "use strict";

    if (typeof audio === "undefined" || !audio) {
        return;
    }


    /* =====================================================
       تتبّع نيّة المستخدم: عايز الصوت شغّال ولا واقفه؟
       كل كود التطبيق بيوقّف الصوت بـ audio.pause()، فبنلفّها
       عشان نعرف إن الإيقاف مقصود. أي توقف تاني (شبكة، خطأ)
       مش مقصود وهنحاول نتعافى منه.
    ===================================================== */

    var wantPlaying = false;

    var originalPause = audio.pause.bind(audio);

    audio.pause = function () {

        wantPlaying = false;

        return originalPause();
    };

    audio.addEventListener("play", function () {
        wantPlaying = true;
    });

    audio.addEventListener("ended", function () {
        wantPlaying = false;
    });


    /* =====================================================
       التعافي من انقطاع البث
    ===================================================== */

    var recoverAttempts = [];
    var recovering = false;
    var stallTimer = null;

    var MAX_ATTEMPTS = 4;
    var WINDOW_MS = 90 * 1000;
    var STALL_MS = 9000;

    function canRetry() {

        var now = Date.now();

        recoverAttempts = recoverAttempts.filter(function (time) {
            return now - time < WINDOW_MS;
        });

        return recoverAttempts.length < MAX_ATTEMPTS;
    }

    function micIsListening() {

        /* أثناء الأمر الصوتي المتصفح بيوقّف الصوت عمدًا */
        return !!document.querySelector(".listening");
    }

    function recover(reason) {

        if (recovering || !wantPlaying || !audio.src || audio.ended) {
            return;
        }

        if (micIsListening() || !canRetry()) {
            return;
        }

        /* مفيش نت: نستنى لما يرجع بدل ما نستهلك المحاولات */
        if (navigator.onLine === false && !/^blob:|^data:/.test(audio.src)) {

            window.addEventListener("online", function onBack() {

                window.removeEventListener("online", onBack);
                recover(reason);

            });

            return;
        }

        recovering = true;
        recoverAttempts.push(Date.now());

        var src = audio.src;
        var resumeAt = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
        var rate = audio.playbackRate || 1;

        function restore() {

            audio.removeEventListener("loadedmetadata", restore);

            try {

                if (resumeAt > 0 && Number.isFinite(audio.duration)) {
                    audio.currentTime = Math.min(resumeAt, Math.max(0, audio.duration - 0.25));
                }

                audio.playbackRate = rate;

            } catch (error) { /* */ }

            var playing = audio.play();

            if (playing && playing.catch) {

                playing.catch(function () {
                    /* المتصفح منع التشغيل التلقائي: المستخدم يضغط تشغيل */
                });
            }

            recovering = false;
        }

        audio.addEventListener("loadedmetadata", restore);

        try {

            /* نعيد تحميل نفس الرابط من غير ما نمس منطق التطبيق (الآيات والتوقيتات) */
            audio.src = src;
            audio.load();

        } catch (error) {

            audio.removeEventListener("loadedmetadata", restore);
            recovering = false;
        }

        /* لو التحميل نفسه فشل، منفضلش معلّقين */
        setTimeout(function () {
            recovering = false;
        }, 15000);
    }

    audio.addEventListener("error", function () {

        /* 2 = شبكة، 3 = فك ترميز بسبب بيانات ناقصة، 4 = مصدر غير مدعوم (بيحصل لما رد الـ Range يتقطع) */
        var code = audio.error ? audio.error.code : 0;

        if (code === 2 || code === 3 || code === 4) {
            setTimeout(function () { recover("error"); }, 600);
        }
    });

    function clearStall() {

        if (stallTimer) {
            clearTimeout(stallTimer);
            stallTimer = null;
        }
    }

    function armStall() {

        clearStall();

        stallTimer = setTimeout(function () {

            stallTimer = null;

            /* لسه واقف مستني بيانات بعد ما عدّى وقت طويل */
            if (wantPlaying && !audio.paused && audio.readyState < 3) {
                recover("stall");
            }

        }, STALL_MS);
    }

    ["waiting", "stalled"].forEach(function (name) {
        audio.addEventListener(name, armStall);
    });

    ["playing", "canplay", "pause", "ended", "emptied"].forEach(function (name) {
        audio.addEventListener(name, clearStall);
    });


    /* =====================================================
       رجوع التطبيق للشاشة: لو المفروض شغّال ولسه معلّق، نكمّل
    ===================================================== */

    document.addEventListener("visibilitychange", function () {

        if (document.visibilityState !== "visible") {
            return;
        }

        if (wantPlaying && !audio.paused && audio.readyState < 3) {
            armStall();
        }
    });


    /* =====================================================
       Media Session: نتأكد إن أزرار الإشعار/شاشة القفل شغالة
       وإن حالة التشغيل متزامنة (ده بيخلي أندرويد يعتبر التطبيق
       مشغّل صوت فعلاً فميقتلوش في الخلفية).
    ===================================================== */

    function syncPlaybackState() {

        try {

            if ("mediaSession" in navigator) {
                navigator.mediaSession.playbackState = audio.paused ? "paused" : "playing";
            }

        } catch (error) { /* */ }
    }

    ["play", "playing", "pause", "ended"].forEach(function (name) {
        audio.addEventListener(name, syncPlaybackState);
    });


    /* =====================================================
       تخزين التلاوة أوفلاين: نأجّله لوقت مناسب
       cacheAudioForOffline دالة عامة في app.js وبتتنادى من جواه
       بالاسم، فاستبدالها هنا بيغطي كل الأماكن.
    ===================================================== */

    var originalCache = window.cacheAudioForOffline;

    if (typeof originalCache === "function") {

        var deferredUrl = null;

        var shouldCacheNow = function () {

            var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

            /* وضع توفير البيانات: المستخدم مش عايز تنزيل في الخلفية */
            if (conn && conn.saveData) {
                return false;
            }

            if (document.visibilityState === "visible") {
                return true;
            }

            /* والتطبيق في الخلفية: بس على واي فاي أو إيثرنت */
            return !!(conn && (conn.type === "wifi" || conn.type === "ethernet"));
        };

        window.cacheAudioForOffline = function (url) {

            if (!shouldCacheNow()) {

                deferredUrl = url;

                return;
            }

            /* نسيب التشغيل يثبت الأول قبل ما ننزّل نسخة كاملة بالتوازي */
            setTimeout(function () {

                if (shouldCacheNow()) {
                    originalCache(url);
                } else {
                    deferredUrl = url;
                }

            }, 6000);
        };

        document.addEventListener("visibilitychange", function () {

            if (document.visibilityState === "visible" && deferredUrl) {

                var url = deferredUrl;

                deferredUrl = null;

                if (shouldCacheNow()) {
                    setTimeout(function () { originalCache(url); }, 4000);
                }
            }
        });
    }

})();