const CACHE_NAME = "quran-voice-v42";

/*
    كاش تلاوة الشيخ (منفصل عن كاش الواجهة). لازم يفضل نفس
    الاسم اللي بيستخدمه app.js في cacheAudioForOffline، عشان
    اللي بيتخزن من الاتنين يقع في نفس المكان.
*/
const AUDIO_CACHE_NAME = "quran-audio-v1";

/*
    كاش خطوط الواجهة والمصحف (Cairo / Amiri / Amiri Quran).
    منفصل عشان ميتمسحش مع تحديثات الواجهة، ولأن نفس ملفات
    الخط بتتكرر بنفس الرابط دايمًا فمفيش داعي نحمّلها إلا مرة
    واحدة في حياة التطبيق.
*/
const FONT_CACHE_NAME = "quran-fonts-v1";

const FONT_HOSTS = [
    "fonts.googleapis.com",
    "fonts.gstatic.com"
];

/*
    مصادر بث الراديو المباشر: دي المفروض تفضل أونلاين بس
    دايمًا ومتتخزنش خالص، لأنها بث حي بلا نهاية.
*/
const RADIO_HOSTS = [
    "radiojar.com"
];

const APP_SHELL = [
    "./",
    "./index.html",
    /*
        صفحة جولة التعريف: بتتعرض مرة واحدة بس لأول مستخدم،
        بس لازم تكون مخزنة عشان لو أول فتحة للتطبيق كانت من
        غير نت برضه تشتغل.
    */
    "./tour.html",
    "./style.css",
    "./features.css",
    "./data.js",
    "./app.js",
    "./features.js",
    "./manifest.json",
    "./icon.svg",
    "./icon-180.png",
    "./icon-192.png",
    "./icon-512.png"
];

/*
    ملفات اختيارية: لو مش موجودة (مثلاً لسه ما ضفتش adhan.mp3)
    ما تمنعش تثبيت الـ Service Worker. بتتخزن في الكاش أول ما
    تتشغل لأول مرة عن طريق معالج "fetch" في الأسفل على أي حال.
*/
const OPTIONAL_APP_SHELL = [
    "./adhan.mp3"
];


/*
    =========================================================
    فهرس ملفات الصوت المخزنة (مهم جدًا لمشكلة شريط التقديم)
    =========================================================
    المشكلة اللي كانت موجودة:

    الـ Service Worker كان بيعترض (respondWith) *كل* طلب .mp3
    حتى لو مفيش نسخة مخزنة منه. وطلب الصوت اللي بيطلع من عنصر
    <audio> لسيرفر خارجي بيبقى نوعه "no-cors"، فالرد اللي
    بيرجع للـ SW بيبقى رد "مُعتِم" (opaque): مالهوش status ولا
    هيدرز نقدر نقراها، ومن ضمنها Accept-Ranges و Content-Length.

    ولما المتصفح يستلم رد معتم من SW لملف صوت، بيتعامل معاه
    كأن السيرفر مش داعم الطلبات الجزئية (Range)، ونتيجة كده
    شريط التقديم/التأخير بيقف عن الشغل.

    وده بالظبط سبب إن التقديم كان شغال مع شيوخ معينين بس:
    السيرفرات اللي بتبعت هيدرز CORS كان بينفع نخزّن منها نسخة
    كاملة (وبالتالي الـ SW بيرد من الكاش بـ 206 سليم)، أما باقي
    السيرفرات فكانت بترجع رد معتم والتقديم بيتعطل معاها.

    الحل:
    منعترضش أي طلب صوت إلا لو عندنا بالفعل نسخة كاملة مخزنة
    منه. غير كده بنسيب المتصفح يتعامل مع السيرفر مباشرة زي ما
    التطبيق كان شغال من غير SW أصلاً، فالتقديم بيشتغل مع كل
    الشيوخ.

    عشان قرار "نعترض ولا لأ" لازم يتاخد فورًا (بشكل متزامن)
    جوه معالج fetch، بنجهز فهرس بروابط الصوت المخزنة في الذاكرة
    ونحدّثه أول ما التطبيق يخزّن ملف جديد.
*/
let cachedAudioUrls = new Set();
let audioIndexReady = false;

async function refreshCachedAudioIndex() {
    try {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        const requests = await cache.keys();

        cachedAudioUrls = new Set(
            requests.map(request => request.url)
        );

        audioIndexReady = true;
    } catch (error) {
        /*
            لو فشل تحميل الفهرس لأي سبب، بنفضل من غير اعتراض
            للصوت. التطبيق هيشتغل أونلاين عادي.
        */
        audioIndexReady = false;
    }
}

/* بنبدأ تحميل الفهرس فورًا مع بداية تشغيل الـ Service Worker */
refreshCachedAudioIndex();


self.addEventListener("message", event => {
    const data = event.data;

    if (!data || !data.type) {
        return;
    }

    /*
        app.js بيبعت الرسالة دي بعد ما يخلص تخزين ملف صوت
        كامل، عشان نضيفه للفهرس على طول من غير ما نستنى
        إعادة تشغيل الـ Service Worker.
    */
    if (data.type === "AUDIO_CACHED" && data.url) {
        cachedAudioUrls.add(data.url);
        audioIndexReady = true;
        return;
    }

    if (data.type === "REFRESH_AUDIO_INDEX") {
        event.waitUntil(refreshCachedAudioIndex());
        return;
    }

    /*
        رسالة من features.js: فيه نسخة جديدة من التطبيق واقفة
        ومستنية (بعد آخر تحديث). بننفذ skipWaiting دلوقتي عشان
        النسخة الجديدة تاخد الأمر فورًا من غير ما نستنى كل
        تابات/نوافذ التطبيق المفتوحة تتقفل لوحدها.
    */
    if (data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});


self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(APP_SHELL).then(() => {
                return Promise.all(
                    OPTIONAL_APP_SHELL.map(url =>
                        cache.add(url).catch(() => {
                            /* الملف مش موجود لسه، مش مشكلة */
                        })
                    )
                );
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    /*
                        مهم: منمسحش كاش صوت التلاوة (AUDIO_CACHE_NAME)
                        هنا. كان في السابق أي كاش اسمه مش CACHE_NAME
                        بيتمسح، وده كان بيمسح كل التلاوات المخزنة
                        للاستماع أوفلاين في كل مرة يتحدث فيها التطبيق.
                    */
                    .filter(key =>
                        key !== CACHE_NAME &&
                        key !== AUDIO_CACHE_NAME &&
                        key !== FONT_CACHE_NAME
                    )
                    .map(key => caches.delete(key))
            )
        ).then(refreshCachedAudioIndex)
    );
    self.clients.claim();
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientsArr => {
            const existing = clientsArr.find(c => "focus" in c);
            if (existing) {
                return existing.focus();
            }
            if (clients.openWindow) {
                return clients.openWindow("./index.html#prayer-times");
            }
        })
    );
});

/*
    هل الطلب ده لبث الراديو المباشر؟ ده الوحيد اللي المفروض
    يفضل يروح للنت مباشرة زي ما هو، من غير أي تدخل من الكاش
    (لا قراءة ولا تخزين)، لأنه بث حي بلا نهاية.
*/
function isRadioRequest(url) {
    return RADIO_HOSTS.some(host => url.hostname.endsWith(host));
}

/*
    هل الطلب ده لملف خط (Google Fonts)؟ دي بنخزنها كاش أولاً
    ثم الشبكة زي ملفات الواجهة بالظبط، عشان الخط يفضل ثابت
    وشغال حتى أوفلاين بعد أول مرة يتحمّل فيها.
*/
function isFontRequest(url) {
    return FONT_HOSTS.some(host => url.hostname.endsWith(host));
}

async function handleFontRequest(request) {
    const cache = await caches.open(FONT_CACHE_NAME);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);
        if (response && response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return cached || new Response("", { status: 504, statusText: "Offline and font not cached yet" });
    }
}

/*
    هل الطلب ده لملف صوت تلاوة (سواء من نفس الأصل أو من
    سيرفر mp3quran الخارجي)؟
*/
function isReciterAudioRequest(url) {
    return (
        !isRadioRequest(url) &&
        /\.mp3$/i.test(url.pathname)
    );
}

/*
    هل عندنا نسخة كاملة مخزنة من ملف الصوت ده؟
    الإجابة لازم تبقى فورية (من غير await) عشان نقرر نعترض
    الطلب ولا نسيبه للمتصفح.
*/
function hasCachedAudio(url) {
    return audioIndexReady && cachedAudioUrls.has(url.href);
}

/*
    =========================================================
    التعامل مع طلبات صوت التلاوة المخزنة (مع دعم Range)
    =========================================================
    الدالة دي بتشتغل بس لما يكون عندنا نسخة كاملة مخزنة من
    الملف، يعني الحالة اللي فيها الاستماع أوفلاين مطلوب.

    المتصفح بيطلب ملفات الصوت الكبيرة بـ Range header، فبنقطع
    (slice) الجزء المطلوب من النسخة الكاملة المخزنة ونرجعه
    كـ "206 Partial Content" بالظبط زي ما سيرفر حقيقي كان
    هيرد، وده اللي بيخلي شريط التقديم شغال أوفلاين كمان.
*/
async function handleCachedAudioRequest(request, url) {

    const cache = await caches.open(AUDIO_CACHE_NAME);
    const cachedFull = await cache.match(url.href);

    if (!cachedFull) {
        /*
            الفهرس كان قديم والملف اتمسح: نرجع للسلوك الطبيعي
            ونسيب الطلب يروح للنت.
        */
        cachedAudioUrls.delete(url.href);

        try {
            return await fetch(request);
        } catch (error) {
            return new Response("", {
                status: 504,
                statusText: "Offline and not cached"
            });
        }
    }

    if (!request.headers.has("range")) {
        return cachedFull.clone();
    }

    const buffer = await cachedFull.clone().arrayBuffer();
    const totalLength = buffer.byteLength;

    const rangeMatch = /bytes=(\d*)-(\d*)/.exec(
        request.headers.get("range") || ""
    );

    let start = (rangeMatch && rangeMatch[1]) ? parseInt(rangeMatch[1], 10) : 0;
    let end = (rangeMatch && rangeMatch[2]) ? parseInt(rangeMatch[2], 10) : totalLength - 1;

    if (isNaN(start) || start < 0) {
        start = 0;
    }

    if (isNaN(end) || end >= totalLength) {
        end = totalLength - 1;
    }

    if (start > end) {
        start = 0;
        end = totalLength - 1;
    }

    const slice = buffer.slice(start, end + 1);

    return new Response(slice, {
        status: 206,
        statusText: "Partial Content",
        headers: {
            "Content-Type": cachedFull.headers.get("Content-Type") || "audio/mpeg",
            "Content-Range": `bytes ${start}-${end}/${totalLength}`,
            "Content-Length": String(slice.byteLength),
            "Accept-Ranges": "bytes"
        }
    });

}

self.addEventListener("fetch", event => {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(request.url);

    /* -----------------------------------------------------------
       بث الراديو المباشر: منتدخلش خالص، لا قراءة ولا تخزين.
       نسيب المتصفح يتعامل معه مباشرة زي ما هو بث حي.
    ----------------------------------------------------------- */
    if (isRadioRequest(requestUrl)) {
        return;
    }

    /* -----------------------------------------------------------
       صوت التلاوة:

       - لو عندنا نسخة كاملة مخزنة: بنرد من الكاش (وبندعم Range
         بنفسنا) عشان الاستماع أوفلاين يشتغل والتقديم يشتغل معاه.

       - لو مفيش نسخة مخزنة: منعترضش الطلب خالص. المتصفح بيتكلم
         مع السيرفر مباشرة فبيستلم هيدرز حقيقية (Accept-Ranges /
         Content-Length)، وده اللي بيخلي شريط التقديم والتأخير
         شغال مع كل الشيوخ مش بعضهم بس.

       التخزين للاستماع أوفلاين بيحصل من app.js
       (cacheAudioForOffline) مش من هنا.
    ----------------------------------------------------------- */
    if (isReciterAudioRequest(requestUrl)) {

        if (hasCachedAudio(requestUrl)) {
            event.respondWith(
                handleCachedAudioRequest(request, requestUrl)
            );
        }

        return;
    }

    /* -----------------------------------------------------------
       خطوط الواجهة (Google Fonts): كاش أولاً ثم الشبكة، عشان
       يفضل شكل الخط ثابت في كل الأجهزة وحتى أوفلاين.
    ----------------------------------------------------------- */
    if (isFontRequest(requestUrl)) {
        event.respondWith(handleFontRequest(request));
        return;
    }

    /* -----------------------------------------------------------
       أي حاجة تانية من مصدر خارجي (APIs زي mp3quran/alquran) أو
       فيها Range header: نسيبها تعدي عادي زي ما كانت، من غير
       تدخل من الكاش.
    ----------------------------------------------------------- */
    if (
        requestUrl.origin !== self.location.origin ||
        request.headers.has("range")
    ) {
        return;
    }

    /* -----------------------------------------------------------
       طلب فتح الصفحة نفسها (navigation) — أهم حالة عشان أي
       تحديث في index.html (زي إضافة سكريبت أو ستايل جديد)
       يوصل للمستخدم على طول.

       المشكلة اللي كانت موجودة: كل ملفات الواجهة، وعلى رأسها
       index.html نفسها، كانت بترد "كاش أولاً" زي أي ملف تاني.
       يعني حتى لو رفعنا index.html جديدة فيها سكريبت أو زرار
       جديد، والمستخدم كان مثبّت التطبيق على الموبايل من قبل،
       الصفحة كانت بترجع من النسخة القديمة المخزنة، والتحديث
       ميظهرش إلا بعد إغلاق التطبيق وإعادة فتحه أكتر من مرة
       (وأحيانًا مش كفاية حتى كده).

       الحل: لطلبات فتح الصفحة تحديدًا (navigation) بنحاول
       الشبكة الأول (عشان نجيب أحدث نسخة)، ولو فشلت (من غير
       نت) نرجع للنسخة المخزنة كـ fallback بس. باقي الملفات
       (CSS/JS/صور) فضلت "كاش أولاً" زي ما كانت، لأنها بتتغير
       بس لما رقم نسخة الكاش (CACHE_NAME) يتغيّر، وده مضمون
       يمسح النسخة القديمة أصلاً.
    ----------------------------------------------------------- */
    if (request.mode === "navigate") {

        event.respondWith(

            fetch(request)
                .then(response => {

                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then(cache =>
                        cache.put(request, responseToCache)
                    );

                    return response;

                })
                .catch(() =>
                    caches.match(request).then(cachedResponse =>
                        cachedResponse ||
                        caches.match("./index.html")
                    )
                )

        );

        return;

    }

    /* -----------------------------------------------------------
       باقي ملفات واجهة التطبيق (نفس الأصل): كاش أولاً ثم الشبكة.
    ----------------------------------------------------------- */
    event.respondWith(
        caches.match(request).then(cachedResponse =>
            cachedResponse ||
            fetch(request).then(response => {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache =>
                    cache.put(request, responseToCache)
                );
                return response;
            })
        )
    );
});