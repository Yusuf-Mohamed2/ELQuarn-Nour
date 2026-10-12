/* =========================================================
   TAJWEED-COURSE.JS  —  نور التلاوة
   =========================================================
   قسم "كورس التجويد":
   1) المستخدم يختار المعلّم (شيخ بفيديوهات، أو المعلّم الذكي).
   2) يفتح دروس المعلّم ده، وعليها شريط تقدّمه.
   3) كل درس: شرح (فيديو أو شرائح بالصوت) + ملخص + امتحان.

   إضافي بالكامل (زي profile.js): بيعمل <section> جديد جوه
   <main> والراوتر بتاع pages.js بيظهره لما الرابط يبقى
   #tajweed-course. لازم يتحمّل بعد pages.js
   و tajweed-course-data.js.
========================================================= */

(function () {

    "use strict";

    var ROUTE = "tajweed-course";
    var STORE_KEY = "noorTelawa_tajweedCourse_v1";

    var course = window.NT_TAJWEED_COURSE;
    var main = document.querySelector("main");

    if (!course || !course.lessons || !course.teachers || !main) {
        return;
    }

    var section = null;
    var state = loadState();

    /* العرض الحالي: teachers / list / lesson / quiz / result */
    var view = { name: "teachers", teacherId: null, lessonId: null };
    var quizRun = null;

    var ai = null;


    /* =====================================================
       تخزين (التقدّم لكل معلّم لوحده: "teacher:lesson")
    ===================================================== */

    function loadState() {

        var out = { watched: {}, best: {}, recited: {} };

        try {

            var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");

            if (raw && typeof raw === "object") {

                ["watched", "best", "recited"].forEach(function (group) {

                    var source = raw[group] || {};

                    Object.keys(source).forEach(function (key) {

                        /* نسخة قديمة كانت من غير معلّم: نعتبرها للشيخ الأول */
                        var fixed = key.indexOf(":") === -1
                            ? course.teachers[0].id + ":" + key
                            : key;

                        out[group][fixed] = source[key];

                    });

                });

            }

        } catch (error) { /* */ }

        return out;

    }

    function saveState() {

        try {

            localStorage.setItem(STORE_KEY, JSON.stringify(state));

        } catch (error) { /* */ }

    }

    function keyOf(teacherId, lessonId) {

        return teacherId + ":" + lessonId;

    }


    /* =====================================================
       مساعدات
    ===================================================== */

    function esc(text) {

        return String(text == null ? "" : text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");

    }

    function toast(message) {

        try {

            if (typeof showToast === "function") {
                showToast(message);
            }

        } catch (error) { /* */ }

    }

    function toArabicDigits(value) {

        return String(value).replace(/\d/g, function (d) {
            return "٠١٢٣٤٥٦٧٨٩"[d];
        });

    }

    function teacherById(id) {

        for (var i = 0; i < course.teachers.length; i++) {

            if (course.teachers[i].id === id) {
                return course.teachers[i];
            }

        }

        return null;

    }

    function lessonById(id) {

        for (var i = 0; i < course.lessons.length; i++) {

            if (course.lessons[i].id === id) {
                return course.lessons[i];
            }

        }

        return null;

    }

    function lessonIndex(id) {

        for (var i = 0; i < course.lessons.length; i++) {

            if (course.lessons[i].id === id) {
                return i;
            }

        }

        return -1;

    }

    function isPassed(teacherId, lesson) {

        var best = state.best[keyOf(teacherId, lesson.id)];

        return !!best && best.percent >= course.passPercent;

    }

    function passedCount(teacherId) {

        return course.lessons.filter(function (lesson) {
            return isPassed(teacherId, lesson);
        }).length;

    }

    function overallPercent(teacherId) {

        return Math.round(passedCount(teacherId) / course.lessons.length * 100);

    }

    function currentTeacher() {

        return teacherById(view.teacherId);

    }


    /* =====================================================
       فيديو الشيخ
    ===================================================== */

    function videoRef(teacher, lesson) {

        if (teacher.ids && teacher.ids[lesson.id]) {
            return { id: teacher.ids[lesson.id] };
        }

        if (teacher.list && teacher.indexes && teacher.indexes[lesson.id]) {
            return { list: teacher.list, index: teacher.indexes[lesson.id] };
        }

        return null;

    }

    function videoEmbedUrl(ref) {

        if (!ref) {
            return "";
        }

        if (ref.id) {

            return "https://www.youtube-nocookie.com/embed/" +
                encodeURIComponent(ref.id) + "?rel=0&modestbranding=1";

        }

        return "https://www.youtube-nocookie.com/embed/videoseries?list=" +
            encodeURIComponent(ref.list) +
            "&index=" + Math.max(0, (Number(ref.index) || 1) - 1) +
            "&rel=0&modestbranding=1";

    }

    function videoWatchUrl(teacher, lesson, ref) {

        if (ref && ref.id) {
            return "https://www.youtube.com/watch?v=" + encodeURIComponent(ref.id);
        }

        if (ref && ref.list) {
            return "https://www.youtube.com/playlist?list=" + encodeURIComponent(ref.list);
        }

        return "https://www.youtube.com/results?search_query=" +
            encodeURIComponent("شرح " + lesson.title + " تجويد " + teacher.name);

    }

    function videoHtml(teacher, lesson) {

        var ref = videoRef(teacher, lesson);
        var url = videoEmbedUrl(ref);

        var frame = url
            ? '<div class="nt-tj-video">' +
                '<iframe src="' + esc(url) + '" title="' + esc(lesson.title) + '" ' +
                'loading="lazy" allowfullscreen ' +
                'allow="accelerometer; encrypted-media; picture-in-picture"></iframe>' +
              "</div>"
            : '<div class="nt-tj-novideo">لسه مفيش فيديو لهذا الدرس عند ' + esc(teacher.name) + ".</div>";

        return frame +
            '<a class="nt-tj-ytlink" target="_blank" rel="noopener" href="' +
            esc(videoWatchUrl(teacher, lesson, ref)) +
            '">الفيديو مش بيشتغل؟ افتحه على يوتيوب ↗</a>';

    }


    /* =====================================================
       المعلّم الذكي: شرائح بصوت
    ===================================================== */

    function speechOk() {

        return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

    }

    function arabicVoice() {

        try {

            var voices = window.speechSynthesis.getVoices() || [];

            var arabic = voices.filter(function (v) {
                return /^ar/i.test(v.lang);
            });

            if (!arabic.length) {
                return null;
            }

            var pref = arabic.filter(function (v) {
                return /ar[-_](EG|SA)/i.test(v.lang);
            });

            return (pref[0] || arabic[0]);

        } catch (error) {

            return null;

        }

    }

    function aiStop() {

        if (!ai) {
            return;
        }

        ai.playing = false;
        ai.token++;

        clearTimeout(ai.timer);

        reciteStop();

        try {

            if (speechOk()) {
                window.speechSynthesis.cancel();
            }

        } catch (error) { /* */ }

    }

    function aiPaint() {

        if (!ai) {
            return;
        }

        var stage = section.querySelector("#ntTjStage");
        var controls = section.querySelector("#ntTjAiControls");

        if (!stage || !controls) {
            return;
        }

        var scene = ai.scenes[ai.index];
        var last = ai.index === ai.scenes.length - 1;

        var lines = String(scene.show || "").split("\n").map(function (line) {
            return "<div>" + esc(line) + "</div>";
        }).join("");

        var dots = ai.scenes.map(function (item, i) {
            return '<i class="' + (i === ai.index ? "is-now" : (i < ai.index ? "is-past" : "")) + '"></i>';
        }).join("");

        stage.className = "nt-tj-stage" + (ai.playing ? " is-speaking" : "") +
            ((ai.cc || ai.noVoice) ? " is-cc" : "");

        stage.innerHTML =
            '<div class="nt-tj-ai-head">' +
                '<span class="nt-tj-ai-avatar">🤖</span>' +
                '<span class="nt-tj-ai-name">المعلّم الذكي</span>' +
                '<span class="nt-tj-ai-count">' + toArabicDigits(ai.index + 1) + " / " +
                    toArabicDigits(ai.scenes.length) + "</span>" +
            "</div>" +
            '<div class="nt-tj-ai-scene" key="' + ai.index + '">' +
                "<h3>" + esc(scene.title) + "</h3>" +
                '<div class="nt-tj-ai-show">' + lines + "</div>" +
                '<p class="nt-tj-ai-say">' + esc(scene.say) + "</p>" +
            "</div>" +
            '<div class="nt-tj-dots">' + dots + "</div>" +
            (!ai.playing && !ai.finished && ai.index === 0 && !ai.started
                ? '<button type="button" class="nt-tj-bigplay" data-tj="aiPlay" aria-label="شغّل الشرح">▶</button>'
                : "") +
            (ai.finished
                ? '<div class="nt-tj-ai-done">خلّصنا شرح الدرس 🎉</div>'
                : "") +
            (ai.noVoice
                ? '<div class="nt-tj-ai-note">جهازك مفيهوش صوت عربي للقراءة، فالشرائح هتتحرك لوحدها وتقدر تقرأ الشرح مكتوب.</div>'
                : "");

        controls.innerHTML =
            '<button type="button" class="nt-tj-ctl" data-tj="aiPrev" aria-label="السابق"' +
                (ai.index === 0 ? " disabled" : "") + ">›</button>" +
            '<button type="button" class="nt-tj-ctl nt-tj-ctl-main" data-tj="aiPlay">' +
                (ai.playing ? "⏸ إيقاف مؤقت" : (ai.finished ? "↻ إعادة الشرح" : "▶ ابدأ الشرح")) + "</button>" +
            '<button type="button" class="nt-tj-ctl" data-tj="aiNext" aria-label="التالي"' +
                (last ? " disabled" : "") + ">‹</button>" +
            '<button type="button" class="nt-tj-ctl nt-tj-cc' + (ai.cc ? " is-on" : "") +
                '" data-tj="aiCC" aria-label="الكلام مكتوب">CC</button>';

    }

    function aiSpeakScene() {

        var token = ++ai.token;
        var scene = ai.scenes[ai.index];
        var text = scene.title + ". " + scene.say;

        clearTimeout(ai.timer);

        function advance() {

            if (!ai || token !== ai.token || !ai.playing) {
                return;
            }

            clearTimeout(ai.timer);

            if (ai.index < ai.scenes.length - 1) {

                ai.timer = setTimeout(function () {

                    if (!ai || token !== ai.token || !ai.playing) {
                        return;
                    }

                    ai.index++;
                    aiPaint();
                    aiSpeakScene();

                }, 700);

            } else {

                ai.playing = false;
                ai.finished = true;

                state.watched[keyOf(ai.teacherId, ai.lessonId)] = true;
                saveState();

                aiPaint();

                /* خلّص الشرح: المعلّم يطلب من المستخدم يقول آية */
                reciteBegin();

            }

        }

        var voice = speechOk() ? arabicVoice() : null;

        /* مفيش صوت عربي: نتحرك بالتوقيت حسب طول الكلام */
        if (!voice) {

            ai.noVoice = true;
            aiPaint();

            ai.timer = setTimeout(advance, Math.max(5000, text.length * 85));

            return;

        }

        try {

            window.speechSynthesis.cancel();

            var utter = new SpeechSynthesisUtterance(text);

            utter.lang = voice.lang || "ar-SA";
            utter.voice = voice;
            utter.rate = 0.88;

            utter.onend = advance;
            utter.onerror = advance;

            window.speechSynthesis.speak(utter);

            /* احتياطي لو onend ماجاش (بيحصل في بعض المتصفحات) */
            ai.timer = setTimeout(advance, Math.max(9000, text.length * 160));

        } catch (error) {

            ai.timer = setTimeout(advance, Math.max(5000, text.length * 85));

        }

    }

    function aiPlayToggle() {

        if (!ai) {
            return;
        }

        if (ai.playing) {

            aiStop();
            aiPaint();

            return;

        }

        if (ai.finished) {

            ai.index = 0;
            ai.finished = false;

        }

        ai.playing = true;
        ai.started = true;
        reciteStop();
        reciteHide();
        aiPaint();
        aiSpeakScene();

    }

    function aiGo(delta) {

        if (!ai) {
            return;
        }

        var wasPlaying = ai.playing;

        aiStop();
        reciteHide();

        ai.index = Math.max(0, Math.min(ai.scenes.length - 1, ai.index + delta));
        ai.finished = false;

        if (wasPlaying) {

            ai.playing = true;
            aiPaint();
            aiSpeakScene();

        } else {

            aiPaint();

        }

    }

    function aiInit(teacherId, lessonId) {

        var scenes = (course.aiScenes && course.aiScenes[lessonId]) || [];

        aiStop();

        ai = {
            teacherId: teacherId,
            lessonId: lessonId,
            scenes: scenes,
            index: 0,
            playing: false,
            finished: false,
            noVoice: false,
            started: false,
            cc: false,
            token: 0,
            timer: null
        };

        /* الأصوات بتتحمّل متأخر في بعض المتصفحات */
        try {

            if (speechOk()) {
                window.speechSynthesis.getVoices();
            }

        } catch (error) { /* */ }

        aiPaint();

    }

    function aiPlayerHtml(lesson) {

        var scenes = (course.aiScenes && course.aiScenes[lesson.id]) || [];

        if (!scenes.length) {
            return '<div class="nt-tj-novideo">الشرح الذكي لهذا الدرس لسه مجهّز.</div>';
        }

        return '<div class="nt-tj-ai">' +
            '<div class="nt-tj-stage" id="ntTjStage"></div>' +
            '<div class="nt-tj-ai-controls" id="ntTjAiControls"></div>' +
            '<div class="nt-tj-recite" id="ntTjRecite" hidden></div>' +
            "</div>";

    }



    /* =====================================================
       تسميع آخر الدرس: المعلّم يطلب آية والمستخدم يقولها
    ===================================================== */

    var rec = null;

    function recSupported() {

        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);

    }

    /* تشكيل / تطويل / اختلافات الألف والياء والتاء المربوطة */
    function normAr(text) {

        return String(text || "")
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
            .replace(/[أإآٱ]/g, "ا")
            .replace(/ى/g, "ي")
            .replace(/ة/g, "ه")
            .replace(/ؤ/g, "و")
            .replace(/ئ/g, "ي")
            .replace(/[^\u0621-\u064A\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    }

    function editDistance(a, b) {

        var prev = [];
        var i;
        var j;

        for (j = 0; j <= b.length; j++) {
            prev[j] = j;
        }

        for (i = 1; i <= a.length; i++) {

            var cur = [i];

            for (j = 1; j <= b.length; j++) {

                cur[j] = Math.min(
                    prev[j] + 1,
                    cur[j - 1] + 1,
                    prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
                );

            }

            prev = cur;

        }

        return prev[b.length];

    }

    /* التعرف على الصوت بيغلط في حرف أحيانًا: نسمح بفرق بسيط في الكلمات الطويلة */
    function sameWord(a, b) {

        if (a === b) {
            return true;
        }

        var longest = Math.max(a.length, b.length);

        if (longest < 4) {
            return false;
        }

        return editDistance(a, b) <= (longest >= 7 ? 2 : 1);

    }

    /* نسبة كلمات الآية اللي اتقالت بالترتيب */
    function matchScore(targetText, spokenText) {

        var target = normAr(targetText).split(" ").filter(Boolean);
        var spoken = normAr(spokenText).split(" ").filter(Boolean);

        if (!target.length || !spoken.length) {
            return 0;
        }

        var pointer = 0;
        var matched = 0;

        target.forEach(function (word) {

            for (var i = pointer; i < spoken.length; i++) {

                if (sameWord(word, spoken[i])) {

                    matched++;
                    pointer = i + 1;

                    return;

                }

            }

        });

        return matched / target.length;

    }

    function reciteGood(answers, spokenList) {

        for (var a = 0; a < answers.length; a++) {

            for (var s = 0; s < spokenList.length; s++) {

                if (matchScore(answers[a], spokenList[s]) >= 0.75) {
                    return true;
                }

            }

        }

        return false;

    }

    function reciteBox() {

        return section ? section.querySelector("#ntTjRecite") : null;

    }

    function reciteHide() {

        var box = reciteBox();

        if (box) {

            box.hidden = true;
            box.innerHTML = "";

        }

        rec = null;

    }

    function reciteStop() {

        if (!rec) {
            return;
        }

        rec.token++;

        clearTimeout(rec.timer);

        if (rec.engine) {

            try {

                rec.engine.onresult = null;
                rec.engine.onerror = null;
                rec.engine.onend = null;
                rec.engine.abort();

            } catch (error) { /* */ }

            rec.engine = null;

        }

        rec.listening = false;

        try {

            if (speechOk()) {
                window.speechSynthesis.cancel();
            }

        } catch (error) { /* */ }

    }

    /* المعلّم بيتكلم (من غير ما يلغي أي حاجة تانية)، وبعدها بننادي done */
    function reciteSay(text, done) {

        var my = rec ? rec.token : 0;
        var finished = false;

        function end() {

            if (finished) {
                return;
            }

            finished = true;

            clearTimeout(timer);

            if (rec && rec.token === my && done) {
                done();
            }

        }

        var voice = speechOk() ? arabicVoice() : null;
        var timer = setTimeout(end, Math.max(3500, text.length * 150));

        if (!voice) {

            clearTimeout(timer);
            timer = setTimeout(end, Math.max(2500, text.length * 70));

            return;

        }

        try {

            window.speechSynthesis.cancel();

            var utter = new SpeechSynthesisUtterance(text);

            utter.lang = voice.lang || "ar-SA";
            utter.voice = voice;
            utter.rate = 0.9;

            utter.onend = end;
            utter.onerror = end;

            window.speechSynthesis.speak(utter);

        } catch (error) {

            end();

        }

    }

    function recitePaint() {

        var box = reciteBox();

        if (!box || !rec) {
            return;
        }

        var info = (course.aiRecite && course.aiRecite[rec.lessonId]) || null;

        if (!info) {
            return;
        }

        var body;

        if (rec.passed) {

            body =
                '<div class="nt-tj-rec-ok">' +
                    '<div class="nt-tj-rec-big">أحسنت 🌟</div>' +
                    "<p>بارك الله فيك، نطقت الآية صح. كمّل بامتحان الدرس تحت.</p>" +
                "</div>";

        } else {

            body =
                '<div class="nt-tj-rec-ask">' + esc(info.ask) + "</div>" +
                (rec.showHint
                    ? '<div class="nt-tj-rec-hint"><small>' + esc(info.hint) + "</small>" +
                      '<div class="nt-tj-rec-ayah">﴿' + esc(info.answers[0]) + "﴾</div></div>"
                    : "") +
                '<div class="nt-tj-rec-status' + (rec.listening ? " is-live" : "") + '">' +
                    esc(rec.status || "") + "</div>" +
                (rec.heard
                    ? '<div class="nt-tj-rec-heard">سمعتك: ' + esc(rec.heard) + "</div>"
                    : "") +
                '<div class="nt-tj-rec-btns">' +
                    (recSupported()
                        ? '<button type="button" class="nt-tj-btn nt-tj-primary" data-tj="recMic"' +
                          (rec.listening ? " disabled" : "") + ">" +
                          (rec.listening ? "🎙️ بسمعك..." : "🎙️ قول الآية") + "</button>"
                        : "") +
                    (rec.showHint
                        ? ""
                        : '<button type="button" class="nt-tj-btn nt-tj-ghost" data-tj="recHint">💡 مثال</button>') +
                    '<button type="button" class="nt-tj-btn nt-tj-ghost" data-tj="recSkip">تخطّي</button>' +
                "</div>";

        }

        box.className = "nt-tj-recite" + (rec.passed ? " is-pass" : "");
        box.innerHTML = body;
        box.hidden = false;

        try {
            box.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } catch (error) { /* */ }

    }

    function reciteBegin() {

        if (!ai || !course.aiRecite || !course.aiRecite[ai.lessonId]) {
            return;
        }

        var info = course.aiRecite[ai.lessonId];

        reciteStop();

        rec = {
            lessonId: ai.lessonId,
            teacherId: ai.teacherId,
            token: (rec ? rec.token : 0) + 1,
            tries: 0,
            showHint: false,
            passed: false,
            listening: false,
            heard: "",
            status: recSupported()
                ? "اضغط على الزرار وقول الآية بصوتك"
                : "متصفحك مش بيدعم التعرف على الصوت، جرّب كروم",
            engine: null,
            timer: null
        };

        recitePaint();

        /* المعلّم يقول الطلب بصوته وبعدها يفتح الميكروفون لوحده */
        reciteSay(info.ask, function () {

            if (rec && !rec.passed && recSupported()) {
                reciteListen();
            }

        });

    }

    function reciteShowHint() {

        if (!rec) {
            return;
        }

        rec.showHint = true;
        recitePaint();

    }

    function reciteSuccess() {

        if (!rec || rec.passed) {
            return;
        }

        var lessonId = rec.lessonId;
        var teacherId = rec.teacherId;

        reciteStop();

        rec.passed = true;
        rec.listening = false;

        state.recited[keyOf(teacherId, lessonId)] = true;
        saveState();

        recitePaint();

        reciteSay("أحسنت! بارك الله فيك.", null);

    }

    function reciteListen() {

        if (!rec || rec.passed || rec.listening) {
            return;
        }

        var Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!Ctor) {
            return;
        }

        var info = course.aiRecite && course.aiRecite[rec.lessonId];

        if (!info) {
            return;
        }

        /* نسكّت صوت المعلّم قبل ما نفتح الميكروفون عشان ميسمعش نفسه */
        try {

            if (speechOk()) {
                window.speechSynthesis.cancel();
            }

        } catch (error) { /* */ }

        var my = ++rec.token;
        var engine;

        try {

            engine = new Ctor();

            engine.lang = "ar-SA";
            engine.continuous = false;
            engine.interimResults = true;
            engine.maxAlternatives = 3;

        } catch (error) {

            rec.status = "مقدرناش نفتح الميكروفون";
            recitePaint();

            return;

        }

        rec.engine = engine;
        rec.listening = true;
        rec.heard = "";
        rec.status = "قول الآية دلوقتي...";

        engine.onresult = function (event) {

            if (!rec || rec.token !== my) {
                return;
            }

            var spoken = [];

            for (var i = 0; i < event.results.length; i++) {

                for (var j = 0; j < event.results[i].length; j++) {
                    spoken.push(event.results[i][j].transcript);
                }

            }

            /* الجملة كلها (ناتج كل النتايج ورا بعض) كمان بتتجرّب */
            var joined = "";

            for (var k = 0; k < event.results.length; k++) {
                joined += " " + event.results[k][0].transcript;
            }

            spoken.push(joined);

            rec.heard = joined.trim();

            if (reciteGood(info.answers, spoken)) {

                reciteSuccess();

            } else {

                recitePaint();

            }

        };

        engine.onerror = function (event) {

            if (!rec || rec.token !== my) {
                return;
            }

            rec.listening = false;
            rec.engine = null;

            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                rec.status = "محتاجين إذن الميكروفون عشان نسمعك ⚠️";
            } else if (event.error === "network") {
                rec.status = "النت ضعيف، جرّب تاني";
            } else if (event.error === "no-speech") {
                rec.status = "ما سمعتش صوت، اضغط وقول الآية تاني";
            } else {
                rec.status = "ما قدرناش نسمعك، جرّب تاني";
            }

            recitePaint();

        };

        engine.onend = function () {

            if (!rec || rec.token !== my || rec.passed) {
                return;
            }

            rec.listening = false;
            rec.engine = null;
            rec.tries++;

            if (rec.status === "قول الآية دلوقتي...") {
                rec.status = "لسه مش مظبوطة، جرّب تقولها تاني بهدوء";
            }

            /* بعد محاولتين من غير نجاح نظهر الآية تساعده */
            if (rec.tries >= 2) {
                rec.showHint = true;
            }

            recitePaint();

        };

        try {

            engine.start();

        } catch (error) {

            rec.listening = false;
            rec.engine = null;
            rec.status = "مقدرناش نفتح الميكروفون";

        }

        recitePaint();

    }


    /* =====================================================
       الشاشات
    ===================================================== */

    function backRow(label, action) {

        return '<div class="nt-back-row">' +
            (action
                ? '<button type="button" class="nt-back-btn" data-tj="' + action + '">‹ ' + label + "</button>"
                : '<a class="nt-back-btn" href="#home">‹ ' + label + "</a>") +
            "</div>";

    }

    function heading(icon, title, desc) {

        return '<div class="section-heading"><span>' + icon + "</span><div><h2>" +
            esc(title) + "</h2><p>" + esc(desc) + "</p></div></div>";

    }

    function renderTeachers() {

        var cards = course.teachers.map(function (teacher) {

            var percent = overallPercent(teacher.id);
            var done = passedCount(teacher.id);

            return '<button type="button" class="nt-tj-teacher" data-tj-teacher="' + teacher.id + '">' +
                '<span class="nt-tj-teacher-icon">' + teacher.icon + "</span>" +
                '<span class="nt-tj-teacher-text">' +
                    "<strong>" + esc(teacher.name) + "</strong>" +
                    "<small>" + esc(teacher.desc) + "</small>" +
                    '<span class="nt-tj-bar nt-tj-bar-thin"><i style="width:' + percent + '%"></i></span>' +
                    "<em>" + (done
                        ? "خلّصت " + toArabicDigits(done) + " من " + toArabicDigits(course.lessons.length) +
                          " (" + toArabicDigits(percent) + "%)"
                        : "لسه ما بدأتش") + "</em>" +
                "</span>" +
                "</button>";

        }).join("");

        section.innerHTML =
            '<div class="container"><div class="nt-tj-wrap">' +
            backRow("الرئيسية") +
            heading("🎓", course.title, "اختار معلّمك وابدأ من الدرس الأول") +
            '<div class="nt-tj-teachers">' + cards + "</div>" +
            "</div></div>";

    }

    function renderList() {

        var teacher = currentTeacher();

        if (!teacher) {
            view = { name: "teachers" };
            return renderTeachers();
        }

        var total = course.lessons.length;
        var done = passedCount(teacher.id);
        var percent = overallPercent(teacher.id);

        var rows = course.lessons.map(function (lesson, i) {

            var k = keyOf(teacher.id, lesson.id);
            var best = state.best[k];
            var passed = isPassed(teacher.id, lesson);

            var status = passed
                ? '<b class="nt-tj-badge nt-tj-ok">✓ ' + toArabicDigits(best.percent) + "%</b>"
                : best
                    ? '<b class="nt-tj-badge nt-tj-retry">' + toArabicDigits(best.percent) + "%</b>"
                    : state.watched[k]
                        ? '<b class="nt-tj-badge nt-tj-watched">اتشاف</b>'
                        : "";

            return '<button type="button" class="nt-tj-lesson' + (passed ? " is-done" : "") +
                '" data-tj-open="' + lesson.id + '">' +
                '<span class="nt-tj-num">' + toArabicDigits(i + 1) + "</span>" +
                '<span class="nt-tj-lesson-text"><strong>' + esc(lesson.title) +
                "</strong><small>" + esc(lesson.desc) + "</small></span>" +
                status +
                "</button>";

        }).join("");

        section.innerHTML =
            '<div class="container"><div class="nt-tj-wrap">' +
            backRow("كل المعلّمين", "teachers") +
            heading(teacher.icon, teacher.name, "دروس مرتبة، شرح وامتحان بعد كل درس") +

            '<div class="nt-tj-progress">' +
                '<div class="nt-tj-progress-top"><strong>تقدّمك مع ' + esc(teacher.name) + "</strong><span>" +
                toArabicDigits(percent) + "%</span></div>" +
                '<div class="nt-tj-bar"><i style="width:' + percent + '%"></i></div>' +
                "<small>" + (done === total
                    ? "ما شاء الله، خلّصت الكورس كله 🎉"
                    : "خلّصت " + toArabicDigits(done) + " من " + toArabicDigits(total) +
                      " دروس (بتتحسب بعد ما تعدّي امتحان الدرس)") +
                "</small>" +
            "</div>" +

            '<div class="nt-tj-lessons">' + rows + "</div>" +
            "</div></div>";

    }

    function renderLesson(id) {

        var teacher = currentTeacher();
        var lesson = lessonById(id);

        if (!teacher || !lesson) {
            view = { name: "teachers" };
            return renderTeachers();
        }

        var k = keyOf(teacher.id, id);
        var idx = lessonIndex(id);
        var best = state.best[k];
        var watched = !!state.watched[k];

        var points = lesson.points.map(function (p) {
            return "<li>" + esc(p) + "</li>";
        }).join("");

        var next = course.lessons[idx + 1];

        section.innerHTML =
            '<div class="container"><div class="nt-tj-wrap">' +
            backRow("كل الدروس", "list") +
            heading(teacher.icon, "الدرس " + toArabicDigits(idx + 1) + ": " + lesson.title,
                "مع " + teacher.name) +

            (teacher.kind === "ai" ? aiPlayerHtml(lesson) : videoHtml(teacher, lesson)) +

            '<div class="nt-tj-card"><h3>ملخص الدرس</h3><ul class="nt-tj-points">' + points + "</ul></div>" +

            '<div class="nt-tj-actions">' +
                '<button type="button" class="nt-tj-btn nt-tj-ghost' + (watched ? " is-on" : "") +
                '" data-tj="watched" data-id="' + id + '">' +
                (watched ? "✓ شفت الدرس" : "علّم إني شفت الدرس") + "</button>" +
                '<button type="button" class="nt-tj-btn nt-tj-primary" data-tj="startQuiz" data-id="' + id + '">' +
                (best ? "أعد الامتحان" : "ابدأ امتحان الدرس") + "</button>" +
            "</div>" +

            (best
                ? '<p class="nt-tj-best">أفضل نتيجة ليك: ' + toArabicDigits(best.score) + " من " +
                  toArabicDigits(best.total) + " (" + toArabicDigits(best.percent) + "%)" +
                  (best.percent >= course.passPercent ? " — اجتزت الدرس ✓" : "") + "</p>"
                : "") +

            (next && isPassed(teacher.id, lesson)
                ? '<div class="nt-tj-actions"><button type="button" class="nt-tj-btn nt-tj-link" data-tj-open="' +
                  next.id + '">الدرس التالي: ' + esc(next.title) + " ›</button></div>"
                : "") +

            "</div></div>";

        if (teacher.kind === "ai") {
            aiInit(teacher.id, id);
        }

    }

    function renderQuiz() {

        var lesson = lessonById(quizRun.lessonId);
        var q = lesson.quiz[quizRun.index];
        var total = lesson.quiz.length;
        var answered = quizRun.picked !== null;

        var options = q.options.map(function (text, i) {

            var cls = "nt-tj-opt";

            if (answered) {

                if (i === q.answer) {
                    cls += " is-right";
                } else if (i === quizRun.picked) {
                    cls += " is-wrong";
                }

            }

            return '<button type="button" class="' + cls + '" data-tj-pick="' + i + '"' +
                (answered ? " disabled" : "") + ">" + esc(text) + "</button>";

        }).join("");

        var isLast = quizRun.index === total - 1;

        section.innerHTML =
            '<div class="container"><div class="nt-tj-wrap">' +
            backRow("رجوع للدرس", "lesson") +
            heading("📝", "امتحان: " + lesson.title,
                "سؤال " + toArabicDigits(quizRun.index + 1) + " من " + toArabicDigits(total)) +

            '<div class="nt-tj-bar nt-tj-bar-thin"><i style="width:' +
                Math.round(quizRun.index / total * 100) + '%"></i></div>' +

            '<div class="nt-tj-card nt-tj-q">' +
                "<h3>" + esc(q.q) + "</h3>" +
                '<div class="nt-tj-opts">' + options + "</div>" +

                (answered
                    ? '<div class="nt-tj-why ' + (quizRun.picked === q.answer ? "is-right" : "is-wrong") + '">' +
                      "<strong>" + (quizRun.picked === q.answer ? "إجابة صحيحة ✓" : "إجابة غير صحيحة") + "</strong>" +
                      "<p>" + esc(q.why || "") + "</p></div>" +
                      '<button type="button" class="nt-tj-btn nt-tj-primary nt-tj-next" data-tj="nextQ">' +
                      (isLast ? "شوف النتيجة" : "السؤال التالي") + "</button>"
                    : "") +
            "</div>" +

            "</div></div>";

    }

    function renderResult() {

        var teacher = currentTeacher();
        var lesson = lessonById(quizRun.lessonId);
        var total = lesson.quiz.length;
        var score = quizRun.score;
        var percent = Math.round(score / total * 100);
        var passed = percent >= course.passPercent;
        var idx = lessonIndex(lesson.id);
        var next = course.lessons[idx + 1];

        section.innerHTML =
            '<div class="container"><div class="nt-tj-wrap">' +
            backRow("كل الدروس", "list") +

            '<div class="nt-tj-card nt-tj-result ' + (passed ? "is-pass" : "is-fail") + '">' +
                '<div class="nt-tj-result-icon">' + (passed ? "🌟" : "📖") + "</div>" +
                "<h2>" + (passed ? "ما شاء الله، اجتزت الدرس!" : "قرّبت، حاول تاني") + "</h2>" +
                '<div class="nt-tj-score">' + toArabicDigits(score) + " / " + toArabicDigits(total) + "</div>" +
                "<p>" + toArabicDigits(percent) + "% — " +
                (passed
                    ? "الدرس اتحسب في تقدّمك مع " + esc(teacher.name) + "."
                    : "محتاج " + toArabicDigits(course.passPercent) + "% عشان الدرس يتحسب، راجع الملخص وجرّب تاني.") +
                "</p>" +

                '<div class="nt-tj-actions nt-tj-center">' +
                    '<button type="button" class="nt-tj-btn nt-tj-ghost" data-tj="lesson" data-id="' + lesson.id + '">راجع الدرس</button>' +
                    '<button type="button" class="nt-tj-btn nt-tj-primary" data-tj="startQuiz" data-id="' + lesson.id + '">أعد الامتحان</button>' +
                "</div>" +

                (passed && next
                    ? '<div class="nt-tj-actions nt-tj-center"><button type="button" class="nt-tj-btn nt-tj-link" data-tj-open="' +
                      next.id + '">الدرس التالي: ' + esc(next.title) + " ›</button></div>"
                    : "") +
            "</div>" +

            "</div></div>";

    }

    function render() {

        aiStop();

        if (view.name === "list") {
            renderList();
        } else if (view.name === "lesson") {
            renderLesson(view.lessonId);
        } else if (view.name === "quiz") {
            renderQuiz();
        } else if (view.name === "result") {
            renderResult();
        } else {
            renderTeachers();
        }

        window.scrollTo({ top: 0, behavior: "auto" });

    }


    /* =====================================================
       أحداث
    ===================================================== */

    function startQuiz(id) {

        aiStop();

        quizRun = { lessonId: id, index: 0, score: 0, picked: null };
        view = { name: "quiz", teacherId: view.teacherId, lessonId: id };
        render();

    }

    function pick(i) {

        if (!quizRun || quizRun.picked !== null) {
            return;
        }

        var lesson = lessonById(quizRun.lessonId);
        var q = lesson.quiz[quizRun.index];

        quizRun.picked = i;

        if (i === q.answer) {
            quizRun.score++;
        }

        /* نعيد الرسم من غير سكرول لفوق عشان الشرح يظهر تحت الاختيار */
        var y = window.scrollY;
        renderQuiz();
        window.scrollTo({ top: y, behavior: "auto" });

    }

    function nextQuestion() {

        var lesson = lessonById(quizRun.lessonId);

        if (quizRun.index < lesson.quiz.length - 1) {

            quizRun.index++;
            quizRun.picked = null;
            renderQuiz();
            window.scrollTo({ top: 0, behavior: "auto" });

            return;

        }

        var total = lesson.quiz.length;
        var percent = Math.round(quizRun.score / total * 100);
        var k = keyOf(view.teacherId, lesson.id);
        var old = state.best[k];

        if (!old || percent >= old.percent) {

            state.best[k] = {
                score: quizRun.score,
                total: total,
                percent: percent,
                at: Date.now()
            };

        }

        /* مرّ بالامتحان يعني شاف الدرس */
        state.watched[k] = true;

        saveState();

        view = { name: "result", teacherId: view.teacherId, lessonId: lesson.id };
        render();

    }

    function onClick(event) {

        var teacherBtn = event.target.closest("[data-tj-teacher]");

        if (teacherBtn) {

            view = { name: "list", teacherId: teacherBtn.dataset.tjTeacher };
            render();

            return;

        }

        var open = event.target.closest("[data-tj-open]");

        if (open) {

            view = { name: "lesson", teacherId: view.teacherId, lessonId: open.dataset.tjOpen };
            render();

            return;

        }

        var pickBtn = event.target.closest("[data-tj-pick]");

        if (pickBtn) {

            pick(Number(pickBtn.dataset.tjPick));

            return;

        }

        var action = event.target.closest("[data-tj]");

        if (!action) {
            return;
        }

        var name = action.dataset.tj;
        var id = action.dataset.id || view.lessonId;

        if (name === "teachers") {

            view = { name: "teachers" };
            render();

        } else if (name === "list") {

            view = { name: "list", teacherId: view.teacherId };
            render();

        } else if (name === "lesson") {

            view = { name: "lesson", teacherId: view.teacherId, lessonId: id };
            render();

        } else if (name === "watched") {

            var k = keyOf(view.teacherId, id);

            state.watched[k] = !state.watched[k];
            saveState();

            /* نحدّث الزرار بس عشان الشرح الصوتي ميتقطعش */
            action.classList.toggle("is-on", !!state.watched[k]);
            action.textContent = state.watched[k] ? "✓ شفت الدرس" : "علّم إني شفت الدرس";

            if (state.watched[k]) {
                toast("تمام، كمّل بالامتحان لما تبقى جاهز");
            }

        } else if (name === "startQuiz") {

            startQuiz(id);

        } else if (name === "nextQ") {

            nextQuestion();

        } else if (name === "aiPlay") {

            aiPlayToggle();

        } else if (name === "aiPrev") {

            aiGo(-1);

        } else if (name === "aiNext") {

            aiGo(1);

        } else if (name === "aiCC") {

            if (ai) {
                ai.cc = !ai.cc;
                aiPaint();
            }

        } else if (name === "recMic") {

            reciteListen();

        } else if (name === "recHint") {

            reciteShowHint();

        } else if (name === "recSkip") {

            reciteStop();
            reciteHide();

        }

    }


    /* =====================================================
       ربط بالتطبيق (بدون تعديل أي ملف قديم)
    ===================================================== */

    function buildSection() {

        section = document.createElement("section");

        section.id = ROUTE;
        section.className = "section nt-tj-section";

        main.appendChild(section);

        section.addEventListener("click", onClick);

        /*
            الراوتر بيضيف nt-page-active لما الصفحة تتفتح: نرسم
            وقتها. ولما نسيبها بنوقف الصوت ونفضّي الصفحة عشان
            الفيديو يقف.
        */
        var wasActive = false;

        new MutationObserver(function () {

            var active = section.classList.contains("nt-page-active");

            if (active && !wasActive) {

                if (view.name === "quiz") {
                    renderQuiz();
                } else {
                    render();
                }

            }

            if (!active && wasActive) {

                aiStop();
                section.innerHTML = "";

            }

            wasActive = active;

        }).observe(section, { attributes: true, attributeFilter: ["class"] });

        /* لو التطبيق راح في الخلفية نوقف الصوت */
        document.addEventListener("visibilitychange", function () {

            if (document.hidden && ai && ai.playing) {

                aiStop();
                aiPaint();

            }

        });

    }

    function addHomeCard() {

        var grid = document.querySelector("#ntHomeFeatures .nt-grid");

        if (!grid) {
            return;
        }

        var card = document.createElement("a");

        card.className = "nt-feature";
        card.href = "#" + ROUTE;

        card.innerHTML =
            '<span class="nt-feature-icon">🎓</span>' +
            '<span class="nt-feature-text"><strong>كورس التجويد</strong>' +
            "<small>اختار معلّمك: شيخ بالفيديو أو المعلّم الذكي</small></span>";

        grid.appendChild(card);

    }

    function addMobileNavLink() {

        var mobileNav = document.getElementById("mobileNav");

        if (!mobileNav) {
            return;
        }

        var link = document.createElement("a");

        link.href = "#" + ROUTE;
        link.textContent = "🎓 كورس التجويد";

        var firstLabel = mobileNav.querySelector(".nt-nav-group-label");

        if (firstLabel) {
            mobileNav.insertBefore(link, firstLabel);
        } else {
            mobileNav.appendChild(link);
        }

    }

    function init() {

        buildSection();
        addHomeCard();
        addMobileNavLink();

        /* لو الصفحة اتفتحت على #tajweed-course مباشرة، الراوتر كان لسه معندوش القسم */
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