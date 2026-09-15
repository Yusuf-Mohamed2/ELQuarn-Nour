/* =========================================================
نور التلاوة
APP.JS
========================================================= */

/* =========================================================
DOM
========================================================= */

const readersGrid =
document.getElementById("readersGrid");

const allReadersGrid =
document.getElementById("allReadersGrid");

const surahsGrid =
document.getElementById("surahsGrid");

const searchInput =
document.getElementById("searchInput");

const searchBtn =
document.getElementById("searchBtn");

const showAllReaders =
document.getElementById("showAllReaders");

const showAllSurahs =
document.getElementById("showAllSurahs");

const voiceBtn =
document.getElementById("voiceBtn");

const voiceStatus =
document.getElementById("voiceStatus");

const voiceIcon =
document.getElementById("voiceIcon");

const currentReader =
document.getElementById("currentReader");

const miniCover =
document.getElementById("miniCover");

const currentSurah =
document.getElementById("currentSurah");

const selectedReaderLabel =
document.getElementById("selectedReaderLabel");

const selectedSurahLabel =
document.getElementById("selectedSurahLabel");

const mainPlayBtn =
document.getElementById("mainPlayBtn");

const previousBtn =
document.getElementById("previousBtn");

const nextBtn =
document.getElementById("nextBtn");

const volume =
document.getElementById("volume");

const playerSeek =
document.getElementById("playerSeek");

const playerCurrentTime =
document.getElementById("playerCurrentTime");

const playerDuration =
document.getElementById("playerDuration");

const repeatBtn =
document.getElementById("repeatBtn");

const permissionModal =
document.getElementById("permissionModal");

const settingsBtn =
document.getElementById("settingsBtn");

const installBtn =
document.getElementById("installBtn");

const allowMicBtn =
document.getElementById("allowMicBtn");

const closeModalBtn =
document.getElementById("closeModalBtn");

const cancelModalBtn =
document.getElementById("cancelModalBtn");

const prophetDetailsModal =
document.getElementById("prophetDetailsModal");

const prophetDetailsCloseBtn =
document.getElementById("prophetDetailsCloseBtn");

const prophetDetailsContent =
document.getElementById("prophetDetailsContent");

const listenAndReadBtn =
document.getElementById("listenAndReadBtn");

const themeToggleBtn =
document.getElementById("themeToggleBtn");

const themeToggleIcon =
document.getElementById("themeToggleIcon");

/*
    بديل نصي عن الأمر الصوتي: بيستخدم نفس محرك تحليل
    الأوامر (parseVoiceCommand / runVoiceCommand)، لكن من
    غير التعرف على الصوت، فبيشتغل حتى من غير إنترنت خالص.
*/
const commandInput =
document.getElementById("commandInput");

const commandInputBtn =
document.getElementById("commandInputBtn");

/*
    زرار تنزيل كل سور القارئ المختار حاليًا، عشان
    الاستماع بدون نت لأي سورة بصوته من غير ما يستنى
    أول تشغيل أونلاين لكل سورة على حدة.
*/
const downloadReaderBtn =
document.getElementById("downloadReaderBtn");

/* =========================================================
THEME (الوضع الليلي / الوضع الفاتح)
========================================================= */

const THEME_STORAGE_KEY = "quranVoiceTheme";

function applyTheme(theme) {

if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    themeToggleIcon.textContent = "☀️";
    themeToggleBtn.title = "التبديل إلى الوضع الليلي";
} else {
    document.documentElement.removeAttribute("data-theme");
    themeToggleIcon.textContent = "🌙";
    themeToggleBtn.title = "التبديل إلى الوضع النهاري";
}

const metaThemeColor =
document.querySelector('meta[name="theme-color"]');

if (metaThemeColor) {
    metaThemeColor.setAttribute(
        "content",
        theme === "light" ? "#f6f3ea" : "#0a100f"
    );
}

}

const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

const prefersLightScheme =
window.matchMedia &&
window.matchMedia("(prefers-color-scheme: light)").matches;

applyTheme(savedTheme || (prefersLightScheme ? "light" : "dark"));

themeToggleBtn.addEventListener("click", () => {

const isCurrentlyLight =
document.documentElement.getAttribute("data-theme") === "light";

const nextTheme = isCurrentlyLight ? "dark" : "light";

applyTheme(nextTheme);

localStorage.setItem(THEME_STORAGE_KEY, nextTheme);

});

/* =========================================================
MOBILE NAV
========================================================= */

const mobileMenuBtn =
document.getElementById("mobileMenuBtn");

const mobileNav =
document.getElementById("mobileNav");

mobileMenuBtn.addEventListener("click", () => {

mobileNav.classList.toggle("open");

});

document.querySelectorAll(".mobile-nav a").forEach(link => {

link.addEventListener("click", () => {

    mobileNav.classList.remove("open");

});

});

/* =========================================================
AUDIO
========================================================= */

const audio = new Audio();

audio.preload = "metadata";

audio.volume = 1;

/* =========================================================
   تخزين صوت التلاوة للاستخدام بدون نت
   بعد ما التشغيل يبدأ (أونلاين)، بنحمّل نسخة كاملة من
   نفس الملف في الخلفية ونخزنها في كاش مخصص. المرة الجاية
   لو المستخدم طلب نفس السورة بنفس الشيخ (حتى من غير نت)،
   الـ Service Worker (sw.js) هيرد من الكاش ده مباشرة.
   ده منفصل تمامًا عن بث الراديو المباشر، اللي بيتشغل من
   عنصر <audio> تاني خالص (radioAudio) ومينفعش أصلاً يتخزن
   لأنه بث حي بلا نهاية.
========================================================= */

const AUDIO_CACHE_NAME = "quran-audio-v1";

/*
    بنبلّغ الـ Service Worker إن ملف صوت معين بقى مخزّن كامل.
    من غير الرسالة دي الـ SW مش هيعرف إن الملف موجود إلا بعد
    ما يعيد تشغيل نفسه، فالاستماع أوفلاين كان ممكن يتأخر.
*/
function notifyServiceWorkerAudioCached(url) {

    try {

        const absoluteUrl =
            new URL(url, location.href).href;

        if (
            navigator.serviceWorker &&
            navigator.serviceWorker.controller
        ) {

            navigator.serviceWorker.controller.postMessage({
                type: "AUDIO_CACHED",
                url: absoluteUrl
            });

        }

    } catch (error) {
        /* مش مشكلة، الملف متخزن على أي حال */
    }

}

function cacheAudioForOffline(url) {

    if (
        !url ||
        !("caches" in window)
    ) {
        return;
    }

    caches.open(AUDIO_CACHE_NAME).then(cache => {

        cache.match(url).then(existing => {

            if (existing) {
                return;
            }

            fetch(url)
                .then(response => {

                    if (response && response.ok) {

                        cache.put(url, response).then(() => {

                            /*
                                مهم: sw.js بقى بيعترض طلبات الصوت بس
                                لما يكون عنده نسخة كاملة مخزنة فعلاً
                                (عشان شريط التقديم يفضل شغال مع كل
                                الشيوخ). فلازم نبلّغه دلوقتي إن الملف
                                ده بقى متاح أوفلاين.
                            */
                            notifyServiceWorkerAudioCached(url);

                        });

                    }

                })
                .catch(() => {
                    /*
                        من غير نت، أو فشل التحميل في الخلفية.
                        مش مشكلة، هيحاول تاني في مرة التشغيل
                        الجاية لما يبقى فيه نت.
                    */
                });

        });

    });

}

/*
    =========================================================
    تنزيل كل سور قارئ معين مقدمًا للاستماع بدون نت
    =========================================================
    ده زرار يدوي (المستخدم بيختاره بنفسه) بدل ما نحمّل كل
    الشيوخ تلقائيًا عند التثبيت، عشان ده هيبقى عشرات
    الجيجابايت من غير إذن المستخدم. بيدور على كل الـ 114
    سورة المتاحة لنفس القارئ (وبنفس أسلوب/رواية التلاوة
    المختارة حاليًا لو فيه) ويخزنها في AUDIO_CACHE_NAME،
    نفس الكاش اللي بيقرا منه sw.js لما نبقى أوفلاين.
*/

let readerDownloadInProgress = false;

async function downloadReaderFully() {

    if (!selectedReader) {

        showToast(
            "اختر القارئ أولاً"
        );

        return;

    }

    if (readerDownloadInProgress) {

        showToast(
            "جاري التحميل بالفعل..."
        );

        return;

    }

    if (!("caches" in window)) {

        showToast(
            "متصفحك لا يدعم التخزين المؤقت للاستخدام بدون نت"
        );

        return;

    }

    const readerName =
        selectedReader.name;

    const confirmed =
        confirm(
            `هيتم تنزيل نسخة كاملة من كل سور القرآن (114 سورة) بصوت ${readerName} على جهازك عشان تسمعها بدون نت. ده ممكن ياخد وقت ومساحة كبيرة (مئات الميجابايت). متأكد؟`
        );

    if (!confirmed) {
        return;
    }

    readerDownloadInProgress = true;

    const originalLabel =
        downloadReaderBtn.textContent;

    downloadReaderBtn.disabled = true;

    showToast(
        `بدأ تنزيل كل سور ${readerName} للاستماع بدون نت...`
    );

    let downloaded = 0;
    let alreadyCached = 0;
    let unavailable = 0;

    try {

        const cache =
            await caches.open(
                AUDIO_CACHE_NAME
            );

        for (const surah of surahs) {

            const url =
                await getAudioUrl(
                    selectedReader,
                    surah,
                    selectedRecitationStyle,
                    selectedRiwaya
                );

            if (!url) {

                unavailable++;

            } else {

                const existing =
                    await cache.match(url);

                if (existing) {

                    alreadyCached++;

                } else {

                    try {

                        const response =
                            await fetch(url);

                        if (response && response.ok) {

                            await cache.put(
                                url,
                                response
                            );

                            downloaded++;

                        } else {

                            unavailable++;

                        }

                    } catch (error) {

                        /*
                            على الأغلب فصل النت في نص
                            التنزيل. بنوقف هنا بدل ما
                            نكمل نحاول على الفاضي.
                        */

                        showToast(
                            "انقطع الاتصال بالنت أثناء التنزيل، حاول تاني لما يرجع"
                        );

                        break;

                    }

                }

            }

            const done =
                downloaded +
                alreadyCached +
                unavailable;

            downloadReaderBtn.textContent =
                `⬇️ ${Math.round(
                    (done / surahs.length) * 100
                )}%`;

        }

        showToast(
            `تم تجهيز ${downloaded + alreadyCached} سورة بصوت ${readerName} للاستماع بدون نت` +
            (unavailable
                ? ` (${unavailable} سورة غير متاحة لهذا القارئ)`
                : "")
        );

    } finally {

        readerDownloadInProgress = false;

        downloadReaderBtn.disabled = false;

        downloadReaderBtn.textContent =
            originalLabel;

    }

}

/* =========================================================
STATE
========================================================= */

let selectedReader = null;

let selectedSurah = null;

let currentSurahIndex = -1;

let isPlaying = false;

/*
    مفتاح بسيط بيوصف "مين اللي متحمّل دلوقتي" في عنصر
    audio (قارئ + سورة + نطاق آيات لو موجود). بنستخدمه
    عشان لما المستخدم يوقف بزرار التشغيل وبعدين يشغّل
    تاني، نعرف إننا لسه على نفس المقطع فنكمل من نفس
    المكان بدل ما نعيد تحميل الصوت من الأول.
*/
let loadedPlaybackKey = null;

function buildPlaybackKey(
    reader,
    surah,
    ayah,
    ayahEnd
) {

    if (!reader || !surah) {
        return null;
    }

    return (
        `${reader.id}` +
        `|${surah.id}` +
        `|${ayah || ""}` +
        `|${ayahEnd || ""}`
    );

}

let apiReaders = null;

let deferredInstallPrompt = null;
let activeAyahIndex = -1;
let ayahTimePoints = [];
let selectedAyah = null;
let selectedAyahEnd = null;
let rangeStopHandled = false;
let repeatEnabled = false;
let repeatAutoSelectedAyah = false;
let fullSurahStartsAtAyah = false;
let pendingAyahSeek = null;
const HIGHLIGHT_LAG_SECONDS = 0.3;

/*
    تفضيلات التلاوة: بتتحدد من الأمر الصوتي (ترتيل/تجويد
    ورواية معينة زي حفص/ورش...)، وبتفضل شغالة (زي "وضع")
    لحد ما المستخدم يغيرها بأمر صوتي جديد، عشان محتاجش
    يكررها في كل مرة يطلب فيها سورة.
*/
let selectedRecitationStyle = null; // "murattal" | "mujawwad" | null
let selectedRiwaya = null;          // مفتاح من riwayaSearchTerms أو null

/* =========================================================
API
========================================================= */

const MP3QURAN_API =
"https://mp3quran.net/api/v3/reciters?language=ar";

const QURAN_API =
"https://api.alquran.cloud/v1/surah";

/* =========================================================
INSTALLABLE APP
========================================================= */

window.addEventListener("beforeinstallprompt", event => {
event.preventDefault();
deferredInstallPrompt = event;
installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
if (!deferredInstallPrompt) {
showToast("من قائمة المتصفح اختر إضافة إلى الشاشة الرئيسية");
return;
}

deferredInstallPrompt.prompt();
const { outcome } = await deferredInstallPrompt.userChoice;
if (outcome === "accepted") {
    showToast("تم تثبيت التطبيق على جهازك");
}

deferredInstallPrompt = null;
installBtn.classList.add("hidden");

});

window.addEventListener("appinstalled", () => {
installBtn.classList.add("hidden");
deferredInstallPrompt = null;
});

const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent);
if (isIosDevice && !window.navigator.standalone) {
installBtn.classList.remove("hidden");
installBtn.addEventListener("click", () => {
showToast("من Safari اضغط مشاركة ثم إضافة إلى الشاشة الرئيسية");
});
}

if ("serviceWorker" in navigator) {
window.addEventListener("load", () => {
navigator.serviceWorker.register("./sw.js").catch(error => {
console.error("Service worker registration failed:", error);
});
});
}

/* =========================================================
UTILS
========================================================= */

function showToast(message) {

const toast =
    document.getElementById("toast");

toast.textContent = message;

toast.classList.add("show");

setTimeout(() => {

    toast.classList.remove("show");

}, 2500);

}

function escapeHtml(text) {

return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

/* =========================================================
NORMALIZE TEXT
========================================================= */

function normalizeText(text) {

return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ");

}

/* =========================================================
PARSE VOICE COMMAND
========================================================= */

function parseVoiceCommand(command) {

const surah =
    findSurahFromCommand(command);

return {

    reader:
        findReaderFromCommand(command),

    surah,

    ayahRange:
        findAyahRangeFromCommand(command, surah),

    recitationStyle:
        findRecitationStyleFromCommand(command),

    riwaya:
        findRiwayaFromCommand(command)

};

}

function findAyahFromCommand(command) {
const normalizedCommand = normalizeArabic(command);
const match = normalizedCommand.match(
/(?:ايه|اية|رقم)\s*(?:رقم\s*)?(الاولى|الاول|واحد|اثنان|اثنين|ثلاثه|ثلاثة|اربعه|أربعة|خمسه|خمسة|سته|ستة|سبعه|سبعة|ثمانيه|ثمانية|تسعه|تسعة|عشره|عشرة|[0-9٠-٩]+)/u
);

if (!match) {
    return null;
}

const spokenNumbers = {
    الاولى: 1, الاول: 1, واحد: 1,
    اثنان: 2, اثنين: 2,
    ثلاثه: 3, ثلاثة: 3,
    اربعه: 4, أربعة: 4,
    خمسه: 5, خمسة: 5,
    سته: 6, ستة: 6,
    سبعه: 7, سبعة: 7,
    ثمانيه: 8, ثمانية: 8,
    تسعه: 9, تسعة: 9,
    عشره: 10, عشرة: 10
};
const ayahNumber = spokenNumbers[match[1]] || Number(
    match[1].replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
);

return Number.isInteger(ayahNumber) && ayahNumber > 0
    ? ayahNumber
    : null;

}

/* =========================================================
   AYAH NUMBER TOKEN (مشترك بين الآية المفردة والنطاق)
========================================================= */

const AYAH_NUMBER_WORDS = {
    الاولى: 1, الاول: 1, واحد: 1,
    اثنان: 2, اثنين: 2,
    ثلاثه: 3, ثلاثة: 3,
    اربعه: 4, أربعة: 4,
    خمسه: 5, خمسة: 5,
    سته: 6, ستة: 6,
    سبعه: 7, سبعة: 7,
    ثمانيه: 8, ثمانية: 8,
    تسعه: 9, تسعة: 9,
    عشره: 10, عشرة: 10
};

const AYAH_NUMBER_TOKEN =
    "(?:" +
    Object.keys(AYAH_NUMBER_WORDS).join("|") +
    "|[0-9٠-٩]+)";

function wordOrDigitToAyahNumber(token) {

    if (!token) {
        return null;
    }

    if (
        Object.prototype.hasOwnProperty.call(
            AYAH_NUMBER_WORDS,
            token
        )
    ) {
        return AYAH_NUMBER_WORDS[token];
    }

    const converted = Number(
        token.replace(
            /[٠-٩]/g,
            digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
        )
    );

    return (
        Number.isInteger(converted) &&
        converted > 0
    )
        ? converted
        : null;

}

/* =========================================================
   FIND AYAH RANGE FROM COMMAND
   بيدعم:
   - نطاق صريح: "من الآية 5 إلى/لحد/ل الآية 12"
   - "أول 10 آيات" من السورة (يبدأ من الآية 1)
   - "آخر 4 آيات" من السورة (بيحتاج يعرف عدد آيات
     السورة نفسها عشان يحسب بداية النطاق)
   - آية واحدة عادية (بيرجع نطاق بداية = نهاية)
   بيرجع { start, end } أو null.
========================================================= */

function findAyahRangeFromCommand(command, surah) {

const normalizedCommand =
    normalizeArabic(command);


/*
    =====================================================
    1) نطاق صريح: "من الآية 5 إلى/لحد/ل الآية 12"
    =====================================================
*/

/*
    =====================================================
    1) نطاق صريح: "من الآية 5 إلى/لحد/ل الآية 12"

    الفجوة (FILLER_GAP) بتسمح بكلمة حشو أو اتنين زي
    "مثلا"/"يعني" بين رقم البداية وكلمة الربط، من غير
    ما تدّي فرصة لالتقاط رقم بعيد مالوش علاقة بالنطاق.

    كمان "لل" مضافة قبل "ل" في كلمات الربط عشان تغطي
    صيغة "للآية" (لـ + الآية بتتكتب بلامين)، ومضاف
    "(?:و\\s*)?" قبل الربط عشان يغطي "وحتى"/"ولحد".
    =====================================================
*/

const FILLER_GAP =
    "(?:\\s+[^0-9٠-٩\\s]{1,12}){0,2}\\s*";

const rangeRegex = new RegExp(
    "من\\s*(?:سوره\\s*\\S+\\s*)?(?:الايه|ايه)?\\s*(?:رقم\\s*)?(" +
    AYAH_NUMBER_TOKEN +
    ")" +
    FILLER_GAP +
    "(?:و\\s*)?(?:الي|لحد|حتي|لل|ل)\\s*(?:الايه|ايه)?\\s*(?:رقم\\s*)?(" +
    AYAH_NUMBER_TOKEN +
    ")",
    "u"
);

const rangeMatch =
    normalizedCommand.match(rangeRegex);

if (rangeMatch) {

    const start =
        wordOrDigitToAyahNumber(rangeMatch[1]);

    const end =
        wordOrDigitToAyahNumber(rangeMatch[2]);

    if (start && end) {

        return {
            start: Math.min(start, end),
            end: Math.max(start, end)
        };

    }

}


/*
    =====================================================
    2) "أول N آية/آيات" من السورة
    =====================================================
*/

const firstMatch =
    normalizedCommand.match(
        new RegExp(
            "اول\\s*(" +
            AYAH_NUMBER_TOKEN +
            ")\\s*(?:ايات|آيات|ايه|آية)",
            "u"
        )
    );

if (firstMatch) {

    const count =
        wordOrDigitToAyahNumber(firstMatch[1]);

    if (count) {

        return {
            start: 1,
            end: count
        };

    }

}


/*
    =====================================================
    3) "آخر N آية/آيات" من السورة
    محتاجين عدد آيات السورة نفسها عشان نحسب بداية
    النطاق (لو مش متعرفة السورة لسه منقدرش نحسبها)
    =====================================================
*/

const lastMatch =
    normalizedCommand.match(
        new RegExp(
            "اخر\\s*(" +
            AYAH_NUMBER_TOKEN +
            ")\\s*(?:ايات|آيات|ايه|آية)",
            "u"
        )
    );

if (lastMatch && surah && surah.ayahs) {

    const count =
        wordOrDigitToAyahNumber(lastMatch[1]);

    if (count) {

        const totalAyahs =
            surah.ayahs;

        const start =
            Math.max(
                1,
                totalAyahs - count + 1
            );

        return {
            start,
            end: totalAyahs
        };

    }

}


/*
    =====================================================
    4) آية واحدة عادية (السلوك القديم)
    =====================================================
*/

const singleAyah =
    findAyahFromCommand(command);

if (singleAyah) {

    return {
        start: singleAyah,
        end: singleAyah
    };

}

return null;

}

/* =========================================================
FIND RECITATION STYLE (ترتيل / تجويد)
========================================================= */

function findRecitationStyleFromCommand(command) {

const normalizedCommand =
    normalizeArabic(command);


const aliases =
    Object.entries(recitationStyleAliases)

        .map(([alias, style]) => ({

            alias:
                normalizeArabic(alias),

            style

        }))

        .sort(
            (a, b) =>
                b.alias.length -
                a.alias.length
        );


for (const item of aliases) {

    if (!item.alias) {
        continue;
    }


    const regex =
        new RegExp(
            `(?:^|\\s)${escapeRegExp(item.alias)}(?:$|\\s)`,
            "u"
        );


    if (regex.test(normalizedCommand)) {

        return item.style;

    }

}


return null;

}

/* =========================================================
FIND RIWAYA (القراءة/الرواية)
========================================================= */

function findRiwayaFromCommand(command) {

const normalizedCommand =
    normalizeArabic(command);


const aliases =
    Object.entries(riwayaAliases)

        .map(([alias, riwaya]) => ({

            alias:
                normalizeArabic(alias),

            riwaya

        }))

        .sort(
            (a, b) =>
                b.alias.length -
                a.alias.length
        );


for (const item of aliases) {

    if (!item.alias) {
        continue;
    }


    const regex =
        new RegExp(
            `(?:^|\\s)${escapeRegExp(item.alias)}(?:$|\\s)`,
            "u"
        );


    if (regex.test(normalizedCommand)) {

        return item.riwaya;

    }

}


return null;

}

/* =========================================================
FIND READER
========================================================= */

function findReaderFromCommand(command) {

const normalizedCommand =
    normalizeArabic(command);


const aliases =
    Object.entries(readerAliases)

        .map(([alias, id]) => ({

            alias:
                normalizeArabic(alias),

            id

        }))

        .sort(
            (a, b) =>
                b.alias.length -
                a.alias.length
        );

/* -----------------------------------------
   Exact phrase
----------------------------------------- */

for (const item of aliases) {

    if (!item.alias) {
        continue;
    }


    const regex =
        new RegExp(
            `(?:^|\\s)${escapeRegExp(item.alias)}(?:$|\\s)`,
            "u"
        );


    if (regex.test(normalizedCommand)) {

        return getReaderById(item.id);

    }

}


/* -----------------------------------------
   Fallback
----------------------------------------- */

for (const item of aliases) {

    if (
        !item.alias ||
        item.alias.length <= 1
    ) {
        continue;
    }


    if (
        normalizedCommand.includes(
            item.alias
        )
    ) {

        return getReaderById(item.id);

    }

}


return null;

}

/* =========================================================
FIND SURAH
========================================================= */

function findSurahFromCommand(command) {

const normalizedCommand =
    normalizeArabic(command);


const aliases =
    Object.entries(surahAliases)

        .map(([alias, id]) => ({

            alias:
                normalizeArabic(alias),

            id

        }))

        .sort(
            (a, b) =>
                b.alias.length -
                a.alias.length
        );


/* -----------------------------------------
   Exact phrase
----------------------------------------- */

for (const item of aliases) {

    const alias =
        item.alias;


    if (!alias) {
        continue;
    }


    /* ق / ص */

    if (
        alias === "ق" ||
        alias === "ص"
    ) {

        const regex =
            new RegExp(
                `(?:^|\\s)${alias}(?:$|\\s)`,
                "u"
            );


        if (
            regex.test(
                normalizedCommand
            )
        ) {

            return getSurahById(
                item.id
            );

        }


        continue;

    }


    const regex =
        new RegExp(
            `(?:^|\\s)${escapeRegExp(alias)}(?:$|\\s)`,
            "u"
        );


    if (
        regex.test(
            normalizedCommand
        )
    ) {

        return getSurahById(
            item.id
        );

    }

}


/* -----------------------------------------
   Fallback
----------------------------------------- */

for (const item of aliases) {

    if (
        !item.alias ||
        item.alias.length <= 1
    ) {
        continue;
    }


    if (
        normalizedCommand.includes(
            item.alias
        )
    ) {

        return getSurahById(
            item.id
        );

    }

}


return null;

}

/* =========================================================
ESCAPE REGEX
========================================================= */

function escapeRegExp(text) {

return text.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
);

}

/* =========================================================
DATA HELPERS
========================================================= */

function getReaderById(id) {

return readers.find(
    reader =>
        reader.id === id
);

}

function getSurahById(id) {

return surahs.find(
    surah =>
        surah.id === Number(id)
);

}

/* =========================================================
SEARCH READERS
========================================================= */

function searchReaders(query) {

const text =
    normalizeText(query);


if (!text) {

    return readers;

}


return readers.filter(reader =>

    normalizeText(
        reader.name
    ).includes(text) ||

    normalizeText(
        reader.englishName
    ).includes(text) ||

    normalizeText(
        reader.country
    ).includes(text)

);

}

/* =========================================================
SEARCH SURAHS
========================================================= */

function searchSurahs(query) {

const text =
    normalizeText(query);


if (!text) {

    return surahs;

}


return surahs.filter(surah =>

    normalizeText(
        surah.name
    ).includes(text) ||

    normalizeText(
        surah.englishName
    ).includes(text)

);

}

/* =========================================================
API READERS
========================================================= */

async function loadApiReaders() {

if (apiReaders) {

    return apiReaders;

}


try {

    const response =
        await fetch(
            MP3QURAN_API
        );


    if (!response.ok) {

        throw new Error(
            "Failed to load reciters"
        );

    }


    const data =
        await response.json();


    apiReaders =
        data.reciters || [];


    console.log(
        "MP3Quran readers:",
        apiReaders
    );


    return apiReaders;

} catch (error) {

    console.error(
        "MP3Quran API Error:",
        error
    );


    return [];

}

}

/* =========================================================
FIND API READER
========================================================= */

async function findApiReader(reader) {

const apiReciters =
    await loadApiReaders();


if (!apiReciters.length) {

    return null;

}


const targetName =
    normalizeText(
        reader.name
    );


/* -----------------------------------------
   Exact / almost exact
----------------------------------------- */

let match =
    apiReciters.find(
        apiReader => {

            const apiName =
                normalizeText(
                    apiReader.name
                );


            return (

                apiName ===
                    targetName ||

                apiName.includes(
                    targetName
                ) ||

                targetName.includes(
                    apiName
                )

            );

        }
    );


if (match) {

    return match;

}


/* -----------------------------------------
   Extra aliases
----------------------------------------- */

const aliases = {

    maher: [
        "ماهر المعيقلي",
        "ماهر المعيقلى",
        "ماهر"
    ],

    yasser: [
        "ياسر الدوسري",
        "ياسر الدوسرى",
        "ياسر"
    ],

    saad: [
        "سعد الغامدي",
        "سعد الغامدى",
        "الغامدي"
    ],

    abdurrahman: [
        "عبد الرحمن السديس",
        "عبدالرحمن السديس",
        "السديس"
    ],

    nasser: [
        "ناصر القطامي",
        "ناصر القطامى",
        "القطامي"
    ],

    hani: [
        "هاني الرفاعي",
        "هاني الرفاعى",
        "الرفاعي"
    ],

    khalil: [
        "خالد الجليل",
        "خالد"
    ],

    abdulbasit: [
        "عبد الباسط عبد الصمد",
        "عبدالباسط عبدالصمد",
        "عبد الباسط"
    ],

    minshawi: [
        "محمد صديق المنشاوي",
        "محمد صديق المنشاوى",
        "المنشاوي"
    ],

    mishary: [
        "مشاري راشد العفاسي",
        "مشاري العفاسي",
        "العفاسي"
    ],

    waleed: [
        "وليد الشمسان",
        "الشمسان",
        "وليد"
    ],

    badr: [
        "بدر التركي",
        "التركي",
        "بدر"
    ]

};


const readerAliasesForApi =
    aliases[reader.id] || [];


for (
    const alias of readerAliasesForApi
) {

    const normalizedAlias =
        normalizeText(alias);


    match =
        apiReciters.find(
            apiReader => {

                const apiName =
                    normalizeText(
                        apiReader.name
                    );


                return (

                    apiName ===
                        normalizedAlias ||

                    apiName.includes(
                        normalizedAlias
                    ) ||

                    normalizedAlias.includes(
                        apiName
                    )

                );

            }
        );


    if (match) {

        return match;

    }

}


return null;

}

/* =========================================================
   SELECT MOSHAF
   القارئ الواحد ممكن يكون مسجل عنده أكتر من "مصحف"
   (ترتيل/تجويد) وأكتر من رواية (حفص/ورش/قالون...).
   الدالة دي بتختار أنسب مصحف حسب الأسلوب والرواية
   المطلوبين، وبترجع أيضًا هل الطلب اتحقق بالظبط ولا
   اتعمله fallback، عشان نقدر نبلغ المستخدم.
========================================================= */

function selectMoshaf(
moshafList,
style,
riwaya
) {

const entries =
    moshafList.map(item => ({

        item,

        normalizedName:
            normalizeArabic(
                item.name || ""
            )

    }));


let candidates = entries;

let riwayaMatched = !riwaya;
let styleMatched = !style;


/* -----------------------------------------
   Filter by riwaya (لو متاحة عند القارئ ده)
----------------------------------------- */

if (riwaya) {

    const searchTerms =
        (riwayaSearchTerms[riwaya] || [])
            .map(term => normalizeArabic(term));


    const riwayaCandidates =
        entries.filter(entry =>
            searchTerms.some(term =>
                term &&
                entry.normalizedName.includes(term)
            )
        );


    if (riwayaCandidates.length) {

        candidates = riwayaCandidates;
        riwayaMatched = true;

    }

}


/* -----------------------------------------
   Filter by style (ترتيل/تجويد) جوه الرواية
   اللي اتفلترت فوق (أو كل المصاحف لو مفيش رواية)
----------------------------------------- */

if (style === "mujawwad") {

    const styleCandidates =
        candidates.filter(entry =>
            /مجود|تجويد/.test(
                entry.normalizedName
            )
        );


    if (styleCandidates.length) {

        candidates = styleCandidates;
        styleMatched = true;

    }

} else if (style === "murattal") {

    const explicitCandidates =
        candidates.filter(entry =>
            /مرتل|ترتيل/.test(
                entry.normalizedName
            )
        );

    const implicitCandidates =
        candidates.filter(entry =>
            !/مجود|تجويد/.test(
                entry.normalizedName
            )
        );


    if (explicitCandidates.length) {

        candidates = explicitCandidates;
        styleMatched = true;

    } else if (implicitCandidates.length) {

        candidates = implicitCandidates;
        styleMatched = true;

    }

}


/* -----------------------------------------
   لو مفيش رواية محددة، فضّل حفص (السلوك
   الافتراضي القديم) عشان يفضل ثابت لمعظم القراء
----------------------------------------- */

if (!riwaya) {

    const hafsCandidates =
        candidates.filter(entry =>
            entry.normalizedName.includes("حفص")
        );


    if (hafsCandidates.length) {

        candidates = hafsCandidates;

    }

}


const chosen =
    candidates[0] ||
    entries[0] ||
    null;


return {

    moshaf:
        chosen ? chosen.item : null,

    riwayaMatched,
    styleMatched

};

}

/* =========================================================
GET AUDIO URL
========================================================= */

let lastAudioSelectionMeta = null;

async function getAudioUrl(
reader,
surah,
style = null,
riwaya = null
) {

const apiReader =
    await findApiReader(reader);


if (!apiReader) {

    console.error(
        "Reader not found:",
        reader.name
    );

    lastAudioSelectionMeta = null;

    return null;

}


if (
    !apiReader.moshaf ||
    !apiReader.moshaf.length
) {

    lastAudioSelectionMeta = null;

    return null;

}


const selection =
    selectMoshaf(
        apiReader.moshaf,
        style,
        riwaya
    );

const moshaf =
    selection.moshaf;


lastAudioSelectionMeta = {

    style,
    riwaya,
    riwayaMatched:
        selection.riwayaMatched,
    styleMatched:
        selection.styleMatched,
    moshafName:
        moshaf ? moshaf.name : null

};


if (
    !moshaf ||
    !moshaf.server
) {

    return null;

}


/* -----------------------------------------
   Check Surah
----------------------------------------- */

const availableSurahs =
    String(
        moshaf.surah_list || ""
    )
        .split(",")
        .map(Number);


if (
    availableSurahs.length &&
    !availableSurahs.includes(
        Number(surah.id)
    )
) {

    console.warn(
        `Surah ${surah.id} unavailable`
    );

    return null;

}


const surahNumber =
    String(surah.id)
        .padStart(3, "0");


const server =
    moshaf.server.endsWith("/")
        ? moshaf.server
        : moshaf.server + "/";


return (
    server +
    surahNumber +
    ".mp3"
);

}

/* =========================================================
   RECITATION MODE SUFFIX
   نص قصير زي " (تجويد - رواية ورش)" بيتضاف لرسائل
   الحالة عشان المستخدم يتأكد إن طلبه بالأسلوب/الرواية
   اتنفذ فعلاً.
========================================================= */

function getRecitationModeSuffix() {

const parts = [];

if (selectedRecitationStyle === "mujawwad") {

    parts.push("تجويد");

} else if (selectedRecitationStyle === "murattal") {

    parts.push("ترتيل");

}

if (selectedRiwaya) {

    parts.push(
        `رواية ${riwayaDisplayNames[selectedRiwaya] || selectedRiwaya}`
    );

}

return parts.length
    ? ` (${parts.join(" - ")})`
    : "";

}

/* =========================================================
   NOTIFY IF RECITATION FALLBACK
   لو المستخدم طلب أسلوب (ترتيل/تجويد) أو رواية معينة
   ومش متاحة عند القارئ المختار، بنبلغه إننا شغّلنا
   أقرب تسجيل متاح بدل ما يفتكر إن طلبه اتنفذ بالظبط.
========================================================= */

function notifyIfRecitationFallback() {

if (!lastAudioSelectionMeta) {
    return;
}


const {
    style,
    riwaya,
    riwayaMatched,
    styleMatched
} = lastAudioSelectionMeta;


if (riwaya && !riwayaMatched) {

    const riwayaLabel =
        riwayaDisplayNames[riwaya] ||
        riwaya;

    showToast(
        `القارئ المختار مش مسجل برواية ${riwayaLabel}، تم تشغيل الرواية المتاحة له`
    );

    return;

}


if (style && !styleMatched) {

    const styleLabel =
        style === "mujawwad"
            ? "التجويد"
            : "الترتيل";

    showToast(
        `القارئ المختار مش متاح بأسلوب ${styleLabel}، تم تشغيل التسجيل المتاح له`
    );

}

}

/* =========================================================
   AYAH TIMING - MP3QURAN
   يستخدم توقيتات الآيات بدل التخمين بنسبة طول السورة
========================================================= */

const AYAH_TIMING_API =
    "https://mp3quran.net/api/v3/ayat_timing";

let currentAyahTimings = [];
let timingReaderId = null;
let timingSurahId = null;

/*
    كاش لقائمة القراءات اللي عندها توقيتات آيات (ayat_timing/reads).
    القائمة دي شبه ثابتة ومتتغيرش من تشغيلة لتانية، فمفيش داعي
    نطلبها من النت في كل مرة يتشغل فيها أي سورة. ده كان بيضيف
    طلب شبكة كامل (وقت انتظار زيادة) قبل كل تشغيل.
*/
let ayahTimingReadsCache = null;

/*
    مهم جداً: القارئ الواحد ممكن يكون عنده أكتر من
    "مصحف" مسجل عند mp3quran (مرتل عادي / مجود /
    معلم...)، وكل واحد منهم ملف صوتي مختلف تماماً
    بسرعة قراءة مختلفة.

    الـ ayat_timing API مبني على تسجيل واحد بعينه
    (غالباً "المصحف المجود")، فلو شغلنا صوت "المصحف
    المرتل العادي" (اللي بيختاره getAudioUrl) مع
    توقيتات مأخوذة من تسجيل تاني، هيبقى فيه فرق كبير
    بين مكان الصوت الفعلي ومكان الـ highlight.

    عشان كده لازم نحفظ رابط نفس التسجيل اللي جت منه
    التوقيتات (folder_url) ونشغل الصوت منه هو بالذات
    لما تكون التوقيتات متاحة.
*/

let timingFolderUrl = null;

function getTimingAudioUrl(surah) {

    if (
        !timingFolderUrl ||
        !surah
    ) {
        return null;
    }

    const server =
        timingFolderUrl.endsWith("/")
            ? timingFolderUrl
            : timingFolderUrl + "/";

    const surahNumber =
        String(surah.id)
            .padStart(3, "0");

    return (
        server +
        surahNumber +
        ".mp3"
    );

}

/*
    مطابقة أسماء القراء مع الأسماء الموجودة في
    ayat_timing API غير دقيقة أحياناً لسبب بسيط:
    الـ API بيكتب أسماء زي "عبدالرحمن" بدون مسافة
    بينما عندنا "عبد الرحمن" بمسافة. الفرق ده كان
    بيخلي المطابقة تفشل فعلياً لمعظم القراء اللي
    اسمهم يبدأ بـ "عبد ...".

    عشان كده بنستخدم نسخة إضافية من normalizeText
    بتشيل كل المسافات، خاصة بمطابقة القراء هنا فقط
    (مش هتأثر على البحث الصوتي العادي).
*/

function normalizeReaderNameForTiming(text) {

    return normalizeText(text).replace(/\s+/g, "");

}


/* =========================================================
   LOAD AYAH TIMINGS
========================================================= */

async function loadAyahTimings(reader, surah) {

    if (!reader || !surah) {
        return [];
    }

    /*
        لو البيانات موجودة بالفعل لنطلبها مرة أخرى
    */

    if (
        timingReaderId === reader.id &&
        timingSurahId === surah.id &&
        currentAyahTimings.length
    ) {
        return currentAyahTimings;
    }


    /*
        الطلب ده لقارئ/سورة مختلفين عن اللي في الذاكرة.
        بنمسح القديم فورًا (قبل أي await) عشان لو التشغيل بدأ
        قبل ما التوقيتات الجديدة توصل، محدش يستخدم توقيتات أو
        folder_url بتاع تسجيل تاني خالص بالغلط.
    */
    currentAyahTimings = [];
    timingReaderId = null;
    timingSurahId = null;
    timingFolderUrl = null;


    try {

        /*
            نحصل أولاً على قائمة القراءات التي لديها
            Ayah Timing، لكن من الكاش لو عندنا نسخة
            محملة بالفعل بدل ما نطلبها من النت تاني في
            كل مرة (كانت دي أهم سبب في بطء بدء التشغيل).
        */

        let timingReads =
            ayahTimingReadsCache;

        if (!timingReads) {

            const readsResponse =
                await fetch(
                    `${AYAH_TIMING_API}/reads`
                );


            if (!readsResponse.ok) {
                throw new Error(
                    "Failed to load timing readers"
                );
            }


            timingReads =
                await readsResponse.json();


            if (
                !Array.isArray(timingReads) ||
                !timingReads.length
            ) {

                throw new Error(
                    "No timing readers found"
                );

            }

            ayahTimingReadsCache =
                timingReads;

        }


        const targetName =
            normalizeReaderNameForTiming(
                reader.name
            );


        /*
            نحاول مطابقة الشيخ بالاسم
        */

        let timingReader =
            timingReads.find(item => {

                const name =
                    normalizeReaderNameForTiming(
                        item.name
                    );

                return (
                    name === targetName ||
                    name.includes(targetName) ||
                    targetName.includes(name)
                );

            });


        /*
            aliases إضافية
        */

        if (!timingReader) {

            const timingAliases = {

                maher: [
                    "ماهر المعيقلي",
                    "ماهر المعيقلى"
                ],

                yasser: [
                    "ياسر الدوسري",
                    "ياسر الدوسرى"
                ],

                saad: [
                    "سعد الغامدي",
                    "سعد الغامدى"
                ],

                abdurrahman: [
                    "عبد الرحمن السديس",
                    "عبدالرحمن السديس"
                ],

                abdullah: [
                    "عبد الله خياط",
                    "عبدالله خياط"
                ],

                abdulmuhsin: [
                    "عبد المحسن القاسم",
                    "عبدالمحسن القاسم"
                ],

                abdullah_awad: [
                    "عبد الله عواد الجهني",
                    "عبدالله عواد الجهني"
                ],

                abdulbasit: [
                    "عبد الباسط عبد الصمد",
                    "عبدالباسط عبدالصمد"
                ],

                minshawi: [
                    "محمد صديق المنشاوي",
                    "محمد صديق المنشاوى"
                ],

                mishary: [
                    "مشاري راشد العفاسي",
                    "مشاري العفاسي"
                ],

                nasser: [
                    "ناصر القطامي",
                    "ناصر القطامى"
                ],

                hani: [
                    "هاني الرفاعي",
                    "هاني الرفاعى"
                ],

                khalil: [
                    "خالد الجليل"
                ],

                waleed: [
                    "وليد الشمسان"
                ],

                badr: [
                    "بدر التركي"
                ],

                rifai: [
                    /*
                        اسم القارئ في قاعدة بياناتنا
                        "محمد محمود الطبلاوي"، بينما
                        الـ API مسجله باسم "محمد الطبلاوي"
                        فقط، فالمطابقة العادية بتفشل.
                    */
                    "محمد الطبلاوي",
                    "محمد الطبلاوى"
                ]

            };


            const aliases =
                timingAliases[reader.id] || [];


            for (const alias of aliases) {

                const normalizedAlias =
                    normalizeReaderNameForTiming(alias);


                timingReader =
                    timingReads.find(item => {

                        const name =
                            normalizeReaderNameForTiming(
                                item.name
                            );

                        return (
                            name === normalizedAlias ||
                            name.includes(normalizedAlias) ||
                            normalizedAlias.includes(name)
                        );

                    });


                if (timingReader) {
                    break;
                }

            }

        }


        if (!timingReader) {

            console.warn(
                "No ayah timing reader found:",
                reader.name
            );

            currentAyahTimings = [];
            timingReaderId = null;
            timingSurahId = null;
            timingFolderUrl = null;

            return [];

        }


        /*
            الآن نحصل على توقيتات السورة
        */

        const timingUrl =
            `${AYAH_TIMING_API}?surah=${surah.id}&read=${timingReader.id}`;


        const timingResponse =
            await fetch(
                timingUrl
            );


        if (!timingResponse.ok) {

            throw new Error(
                "Failed to load ayah timings"
            );

        }


        const timings =
            await timingResponse.json();


        if (
            !Array.isArray(timings) ||
            !timings.length
        ) {

            throw new Error(
                "Invalid ayah timing data"
            );

        }


        /*
            الـ API يستخدم ayah = 0 أحياناً
            كبداية السورة / البسملة.

            لذلك نحتفظ فقط بالآيات الحقيقية.
        */

        currentAyahTimings =
            timings
                .filter(item =>
                    Number(item.ayah) > 0
                )
                .map(item => ({

                    ayah:
                        Number(item.ayah),

                    start:
                        Number(item.start_time) / 1000,

                    end:
                        Number(item.end_time) / 1000

                }))
                .filter(item =>
                    Number.isFinite(item.start) &&
                    Number.isFinite(item.end)
                );


        timingReaderId =
            reader.id;

        timingSurahId =
            surah.id;

        /*
            نخزن رابط نفس التسجيل اللي جت منه
            التوقيتات، عشان نشغل الصوت منه هو
            بالذات مش من تسجيل تاني للقارئ نفسه.
        */

        timingFolderUrl =
            timingReader.folder_url ||
            null;


        console.log(
            "Ayah timings loaded:",
            reader.name,
            surah.name,
            currentAyahTimings
        );


        return currentAyahTimings;

    } catch (error) {

        console.error(
            "Ayah timing error:",
            error
        );


        currentAyahTimings = [];
        timingReaderId = null;
        timingSurahId = null;
        timingFolderUrl = null;


        return [];

    }

}

/* =========================================================
RENDER READERS
========================================================= */

function renderReaders(
list = readers
) {

readersGrid.innerHTML = "";


list.slice(0, 6)
    .forEach(reader => {

        const card =
            createReaderCard(
                reader
            );


        readersGrid.appendChild(
            card
        );

    });

}

/* =========================================================
RENDER ALL READERS
========================================================= */

function renderAllReaders(
list = readers
) {

allReadersGrid.innerHTML = "";


list.forEach(reader => {

    const card =
        createReaderCard(
            reader
        );


    allReadersGrid.appendChild(
        card
    );

});

}

/* =========================================================
CREATE READER CARD
========================================================= */

function createReaderCard(reader) {

const card =
    document.createElement("div");


card.className =
    "reader-card";


if (
    selectedReader &&
    selectedReader.id === reader.id
) {

    card.classList.add(
        "selected"
    );

}


card.innerHTML = `

    <div class="reader-avatar">
        ${
            reader.photo
                ? `<img src="${escapeHtml(reader.photo)}" alt="${escapeHtml(reader.name)}" loading="lazy" onerror="this.parentElement.textContent = '${escapeHtml(reader.initial)}';">`
                : escapeHtml(reader.initial)
        }
    </div>

    <div class="reader-info">

        <h4>
            ${escapeHtml(reader.name)}
        </h4>

        <span>
            ${escapeHtml(reader.country)}
        </span>

    </div>

`;


card.addEventListener(
    "click",
    () => {

        selectReader(reader);

        /*
            بمجرد اختيار الشيخ، نبدأ التشغيل فورًا
            من سورة الفاتحة، وبعد ما تخلص هتنتقل
            تلقائيًا للسورة اللي بعدها وهكذا (الكود
            اللي بيعمل ده موجود بالفعل في حدث "ended"
            بتاع الصوت، مش محتاجين نضيف حاجة جديدة له).
        */

        selectSurah(
            surahs[0]
        );

        playSelectedSurah(
            true
        );

        renderReaders(
            searchReaders(
                searchInput.value
            )
        );

        renderAllReaders(
            searchReaders(
                searchInput.value
            )
        );

    }
);


return card;

}

/* =========================================================
RENDER SURAHS
========================================================= */

function renderSurahs(
list = surahs
) {

surahsGrid.innerHTML = "";


list.slice(0, 8)
    .forEach(surah => {

        const card =
            createSurahCard(
                surah
            );


        surahsGrid.appendChild(
            card
        );

    });

}

/* =========================================================
CREATE SURAH CARD
========================================================= */

function createSurahCard(surah) {

const card =
    document.createElement("div");


card.className =
    "surah-card";


if (
    selectedSurah &&
    selectedSurah.id === surah.id
) {

    card.classList.add(
        "selected"
    );

}


card.innerHTML = `

    <div class="surah-number">
        ${surah.id}
    </div>

    <div class="surah-info">

        <h4>
            ${escapeHtml(surah.name)}
        </h4>

        <span>
            ${escapeHtml(surah.englishName)}
        </span>

    </div>

    <div class="ayah-count">
        ${surah.ayahs} آية
    </div>

`;


card.addEventListener(
    "click",
    () => {

        selectSurah(surah);

        renderSurahs(
            searchSurahs(
                searchInput.value
            )
        );

    }
);


return card;

}

/* =========================================================
MINI COVER (صورة القارئ الحالي بجانب أزرار التشغيل)
========================================================= */

function updateMiniCover(reader) {

if (!miniCover) {
    return;
}

if (reader && reader.photo) {

    miniCover.innerHTML =
        `<img src="${escapeHtml(reader.photo)}" alt="${escapeHtml(reader.name)}" loading="lazy" onerror="this.parentElement.textContent = '📖';">`;

} else {

    miniCover.textContent =
        "📖";

}

}

/* =========================================================
SELECT READER
========================================================= */

function selectReader(reader) {

selectedReader =
    reader;


currentReader.textContent =
    reader.name;


updateMiniCover(reader);


selectedReaderLabel.textContent =
    reader.name;


const select =
    document.getElementById(
        "mushafReaderSelect"
    );


if (select) {

    select.value =
        reader.id;

}


console.log(
    "Selected reader:",
    reader.name
);

}

/* =========================================================
SELECT SURAH
========================================================= */

function selectSurah(surah) {

selectedSurah =
    surah;


currentSurahIndex =
    surahs.findIndex(
        item =>
            item.id === surah.id
    );


currentSurah.textContent =
    surah.name;


selectedSurahLabel.textContent =
    surah.name;

// A newly selected surah starts from its beginning unless the voice
// command sets a starting ayah immediately afterward.
setSelectedAyah(null);


const select =
    document.getElementById(
        "mushafSurahSelect"
    );


if (select) {

    select.value =
        surah.id;

}


console.log(
    "Selected surah:",
    surah.name
);

}

/* =========================================================
PLAYER INFO
========================================================= */

function updatePlayerInfo() {

currentReader.textContent =
    selectedReader
        ? selectedReader.name
        : "لم يتم اختيار قارئ";


updateMiniCover(selectedReader);


currentSurah.textContent =
    selectedSurah
        ? selectedSurah.name
        : "لم يتم اختيار سورة";


selectedReaderLabel.textContent =
    selectedReader
        ? selectedReader.name
        : "لم يتم اختيار قارئ";


selectedSurahLabel.textContent =
    selectedSurah
        ? selectedSurah.name
        : "لم يتم اختيار سورة";

}

/* =========================================================
PLAY SELECTED SURAH
========================================================= */

async function playSelectedSurah(
    openMushafFirst = true
) {

    if (!selectedReader) {

        showToast(
            "اختر القارئ أولاً"
        );

        return;

    }


    if (!selectedSurah) {

        showToast(
            "اختر السورة أولاً"
        );

        return;

    }


    const requestedAyah =
        selectedAyah;

    const requestedAyahEnd =
        selectedAyahEnd;


    /*
        فتح المصحف أولاً
    */

    if (openMushafFirst) {

        /*
            مهم: هنا عمدًا من غير await. فتح المصحف بيعمل
            طلب شبكة تاني (نص السورة كامل) ومكانش له أي
            داعي إننا نستنى ننتهي منه قبل ما نبدأ الصوت -
            ده كان سبب رئيسي في تأخير التشغيل. المصحف
            هيتفتح ويترسم لوحده في الخلفية، والصوت يبدأ فورًا.
        */

        openMushaf(
            selectedSurah,
            true
        );

        /*
            الجزء المتزامن (sync) جوه openMushaf زي
            selectSurah بيتنفذ فورًا قبل ما نوصل هنا،
            فمينفعش نعيد ضبط نطاق الآية المطلوب.
        */

        setSelectedAyahRange(
            requestedAyah,
            requestedAyahEnd
        );

    }


    voiceStatus.textContent =
        "جاري تجهيز الصوت...";


    fullSurahStartsAtAyah =
        false;

    pendingAyahSeek =
        null;

    rangeStopHandled =
        false;


    /*
        بنبدأ تحميل التوقيتات ورابط الصوت مع بعض (مش واحد
        ورا التاني) عشان وقت الانتظار يقل قبل ما الصوت يبدأ.
    */

    const timingsPromise =
        loadAyahTimings(
            selectedReader,
            selectedSurah
        ).catch(() => []);

    const audioUrl =
        await getAudioUrl(
            selectedReader,
            selectedSurah,
            selectedRecitationStyle,
            selectedRiwaya
        );

    /*
        التوقيتات مهمة لتمييز الآية، بس مش مبرر إننا نخلي
        المستخدم مستني الصوت بسببها لو سيرفر التوقيتات بطيء.
        بنستناها لمدة أقصاها AYAH_TIMING_MAX_WAIT_MS وبعدين
        نبدأ الصوت على أي حال. في الحالة الطبيعية بتكون
        متحملة مسبقًا (prewarm) فبترجع فورًا.
    */
    await Promise.race([
        timingsPromise,
        new Promise(resolve =>
            setTimeout(resolve, AYAH_TIMING_MAX_WAIT_MS)
        )
    ]);


    if (!audioUrl) {

        voiceStatus.textContent =
            "لم يتم العثور على صوت هذا القارئ لهذه السورة";

        showToast(
            "الصوت غير متاح لهذه السورة"
        );

        return;

    }


    /*
        لو الرواية أو الأسلوب المطلوب مش متاح
        عند القارئ ده، نبلغ المستخدم إننا شغّلنا
        أقرب حاجة متاحة بدل ما نسيبه يفتكر إن
        طلبه اتنفذ بالظبط.
    */

    notifyIfRecitationFallback();


    /*
        لو المستخدم طلب آية محددة
        نحصل على توقيتات الآيات
    */

    if (selectedAyah) {

        /*
            التوقيتات اتحملت بالفعل فوق مع رابط الصوت
            (في نفس Promise.all)، فمفيش داعي نستناها تاني.
        */
        const timings =
            currentAyahTimings;


        const requestedTiming =
            timings.find(
                item =>
                    item.ayah ===
                    Number(selectedAyah)
            );


        if (requestedTiming) {

            try {

                /*
                    لازم نشغل نفس التسجيل اللي
                    جت منه التوقيتات، مش أي تسجيل
                    تاني لنفس القارئ (زي "المرتل"
                    العادي لو التوقيتات كانت
                    مأخوذة من "المجود" مثلاً).
                */

                const exactAudioUrl =
                    getTimingAudioUrl(
                        selectedSurah
                    ) ||
                    audioUrl;


                audio.pause();

                audio.src =
                    exactAudioUrl;

                audio.loop =
                    false;


                /*
                    ننتظر metadata
                    ثم نذهب لبداية الآية بالضبط
                */

                await new Promise(
                    (resolve, reject) => {

                        const onLoaded =
                            () => {

                                cleanup();

                                resolve();

                            };


                        const onError =
                            () => {

                                cleanup();

                                reject(
                                    new Error(
                                        "Audio metadata error"
                                    )
                                );

                            };


                        const cleanup =
                            () => {

                                audio.removeEventListener(
                                    "loadedmetadata",
                                    onLoaded
                                );

                                audio.removeEventListener(
                                    "error",
                                    onError
                                );

                            };


                        audio.addEventListener(
                            "loadedmetadata",
                            onLoaded,
                            { once: true }
                        );

                        audio.addEventListener(
                            "error",
                            onError,
                            { once: true }
                        );

                    }
                );


                /*
                    التوقيت بالثواني
                */

                audio.currentTime =
                    Math.max(
                        0,
                        requestedTiming.start
                    );


                /*
                    نحدث الـ Highlight فوراً
                */

                updateAyahHighlight();


                await audio.play();


                isPlaying =
                    true;


                loadedPlaybackKey =
                    buildPlaybackKey(
                        selectedReader,
                        selectedSurah,
                        selectedAyah,
                        selectedAyahEnd
                    );


                updatePlayButton();


                /*
                    تنزيل نسخة كاملة من نفس الملف في
                    الخلفية عشان يشتغل بدون نت المرة الجاية
                */
                cacheAudioForOffline(
                    exactAudioUrl
                );


                const ayahRangeLabel =
                    selectedAyahEnd
                        ? `من الآية ${selectedAyah} إلى الآية ${selectedAyahEnd}`
                        : `من الآية ${selectedAyah}`;


                voiceStatus.textContent =
                    `يتم الآن تشغيل ${selectedReader.name} - سورة ${selectedSurah.name} ${ayahRangeLabel}${getRecitationModeSuffix()}`;


                showToast(
                    selectedAyahEnd
                        ? `تشغيل الآيات ${selectedAyah} - ${selectedAyahEnd} بصوت ${selectedReader.name}`
                        : `تشغيل الآية ${selectedAyah} بصوت ${selectedReader.name}`
                );


                return;

            } catch (error) {

                console.error(
                    "Exact ayah playback error:",
                    error
                );

            }

        }

    }


    /*
        تشغيل السورة كاملة

        توقيتات الآيات الحقيقية (عشان الـ highlight يمشي
        بالظبط مع صوت الشيخ) اتحملت بالفعل فوق مع رابط
        الصوت في نفس Promise.all، فمفيش داعي نستناها تاني
        هنا ونأخر التشغيل.
    */


    /*
        لو التوقيتات دي جت من تسجيل معين (folder_url)
        لازم نشغل نفس التسجيل بالظبط، وإلا الـ highlight
        هيفضل مش مطابق للصوت اللي بيتشغل فعليًا.
    */

    const finalAudioUrl =
        (!selectedAyah && currentAyahTimings.length)
            ? (getTimingAudioUrl(selectedSurah) || audioUrl)
            : audioUrl;


    try {

        if (audio.src !== finalAudioUrl) {

            audio.src =
                finalAudioUrl;

        }


        audio.loop =
            false;


        /*
            لو لم يوجد timing
            نشغل السورة من البداية
            ولا ندعي أن البداية دقيقة
        */

        if (!selectedAyah) {

            audio.currentTime =
                0;

        }


        await audio.play();


        isPlaying =
            true;


        loadedPlaybackKey =
            buildPlaybackKey(
                selectedReader,
                selectedSurah,
                selectedAyah,
                selectedAyahEnd
            );


        updatePlayButton();


        /*
            تنزيل نسخة كاملة من نفس الملف في الخلفية
            عشان يشتغل بدون نت المرة الجاية
        */
        cacheAudioForOffline(
            finalAudioUrl
        );


        voiceStatus.textContent =
            `يتم الآن تشغيل ${selectedReader.name} - سورة ${selectedSurah.name}`;


        showToast(
            `تشغيل ${selectedReader.name} - سورة ${selectedSurah.name}`
        );

    } catch (error) {

        console.error(
            "Audio play error:",
            error
        );


        voiceStatus.textContent =
            "اضغط تشغيل مرة أخرى لبدء الصوت";

    }

}

async function continueAyahPlayback() {

    if (
        !selectedAyah ||
        !selectedSurah ||
        repeatEnabled
    ) {
        return false;
    }


    if (
        selectedAyah >=
        selectedSurah.ayahs
    ) {

        setSelectedAyah(null);

        if (
            currentSurahIndex <
            surahs.length - 1
        ) {

            await playNextSurah();

            return true;

        }

        return false;

    }


    const nextAyah =
        selectedAyah + 1;


    /*
        نفس صوت السورة
        لكن نستخدم timing للآية التالية
    */

    const timings =
        await loadAyahTimings(
            selectedReader,
            selectedSurah
        );


    const nextTiming =
        timings.find(
            item =>
                item.ayah ===
                Number(nextAyah)
        );


    if (!nextTiming) {

        console.warn(
            "Timing unavailable for ayah:",
            nextAyah
        );

        return false;

    }


    const audioUrl =
        getTimingAudioUrl(
            selectedSurah
        ) ||
        await getAudioUrl(
            selectedReader,
            selectedSurah,
            selectedRecitationStyle,
            selectedRiwaya
        );


    if (!audioUrl) {
        return false;
    }


    try {

        setSelectedAyah(
            nextAyah
        );


        /*
            لو نفس الملف موجود بالفعل
            لا نعيد تحميله.
        */

        if (audio.src !== audioUrl) {

            audio.src =
                audioUrl;


            await new Promise(
                (resolve, reject) => {

                    const onLoaded =
                        () => {

                            cleanup();

                            resolve();

                        };


                    const onError =
                        () => {

                            cleanup();

                            reject(
                                new Error(
                                    "Audio metadata error"
                                )
                            );

                        };


                    const cleanup =
                        () => {

                            audio.removeEventListener(
                                "loadedmetadata",
                                onLoaded
                            );

                            audio.removeEventListener(
                                "error",
                                onError
                            );

                        };


                    audio.addEventListener(
                        "loadedmetadata",
                        onLoaded,
                        { once: true }
                    );

                    audio.addEventListener(
                        "error",
                        onError,
                        { once: true }
                    );

                }
            );

        }


        /*
            الانتقال بالضبط إلى بداية الآية
        */

        audio.currentTime =
            Math.max(
                0,
                nextTiming.start
            );


        updateAyahHighlight();


        await audio.play();


        isPlaying =
            true;


        updatePlayButton();


        voiceStatus.textContent =
            `يتم الآن تشغيل سورة ${selectedSurah.name} - الآية ${nextAyah}`;


        return true;

    } catch (error) {

        console.error(
            "Next ayah error:",
            error
        );

        return false;

    }

}

/* =========================================================
PAUSE
========================================================= */

function pauseAudio() {

audio.pause();

isPlaying = false;

updatePlayButton();

}

/* =========================================================
PLAY / PAUSE
========================================================= */

async function togglePlayPause() {

if (!selectedSurah) {

    showToast(
        "اختر السورة أولاً"
    );

    return;

}


/*
    مفيش قارئ متختار لسه (زي حالة إنك بتقرا في المصحف
    مباشرة من غير ما تختار شيخ). بدل التوست، بنفتح
    قائمة نختار منها صوت القارئ، وبعدها التشغيل بيكمل
    لوحده من نفس الآية اللي كانت متحددة (لو فيه).
*/
if (!selectedReader) {

    openAyahReaderPicker();

    return;

}


if (audio.paused) {

    /*
        لو الصوت المتوقف ده هو نفسه اللي كان شغال
        (نفس القارئ/السورة/نطاق الآيات) ولسه ماخلصش،
        نكمل من نفس المكان اللي وقف عنده بدل ما نعيد
        تحميل الصوت من الأول.
    */

    const resumeKey =
        buildPlaybackKey(
            selectedReader,
            selectedSurah,
            selectedAyah,
            selectedAyahEnd
        );

    const canResume =
        resumeKey &&
        resumeKey === loadedPlaybackKey &&
        audio.src &&
        !audio.ended;

    if (canResume) {

        try {

            await audio.play();

            isPlaying =
                true;

            updatePlayButton();

        } catch (error) {

            console.error(
                "Resume play error:",
                error
            );

            await playSelectedSurah(
                false
            );

        }

    } else {

        await playSelectedSurah(
            false
        );

    }

} else {

    pauseAudio();

}

}

/* =========================================================
AYAH READER PICKER (اختيار القارئ من المصحف مباشرة)
========================================================= */

const ayahReaderPickerModal =
    document.getElementById("ayahReaderPickerModal");
const ayahReaderPickerGrid =
    document.getElementById("ayahReaderPickerGrid");
const ayahReaderPickerSearch =
    document.getElementById("ayahReaderPickerSearch");
const ayahReaderPickerSubtitle =
    document.getElementById("ayahReaderPickerSubtitle");
const ayahReaderPickerCloseBtn =
    document.getElementById("ayahReaderPickerCloseBtn");

function renderAyahReaderPickerGrid(list = readers) {

    if (!ayahReaderPickerGrid) return;

    ayahReaderPickerGrid.innerHTML = "";

    list.forEach(reader => {

        const card = document.createElement("div");
        card.className = "reader-card";

        card.innerHTML = `
            <div class="reader-avatar">
                ${
                    reader.photo
                        ? `<img src="${escapeHtml(reader.photo)}" alt="${escapeHtml(reader.name)}" loading="lazy" onerror="this.parentElement.textContent = '${escapeHtml(reader.initial)}';">`
                        : escapeHtml(reader.initial)
                }
            </div>
            <div class="reader-info">
                <h4>${escapeHtml(reader.name)}</h4>
                <span>${escapeHtml(reader.country)}</span>
            </div>
        `;

        card.addEventListener("click", () => {

            selectReader(reader);
            closeAyahReaderPicker();
            playSelectedSurah(false);

        });

        ayahReaderPickerGrid.appendChild(card);

    });

}

function openAyahReaderPicker() {

    if (!ayahReaderPickerModal) return;

    if (ayahReaderPickerSubtitle) {

        ayahReaderPickerSubtitle.textContent =
            selectedAyah
                ? `هيبدأ التشغيل من الآية ${selectedAyah} بصوت القارئ اللي هتختاره`
                : "هيتم تشغيل السورة من أولها بصوت القارئ اللي هتختاره";

    }

    if (ayahReaderPickerSearch) {
        ayahReaderPickerSearch.value = "";
    }

    renderAyahReaderPickerGrid(readers);

    ayahReaderPickerModal.classList.remove("hidden");

}

function closeAyahReaderPicker() {

    if (!ayahReaderPickerModal) return;

    ayahReaderPickerModal.classList.add("hidden");

}

if (ayahReaderPickerCloseBtn) {
    ayahReaderPickerCloseBtn.addEventListener(
        "click",
        closeAyahReaderPicker
    );
}

if (ayahReaderPickerModal) {
    ayahReaderPickerModal.addEventListener("click", event => {
        if (event.target === ayahReaderPickerModal) {
            closeAyahReaderPicker();
        }
    });
}

if (ayahReaderPickerSearch) {
    ayahReaderPickerSearch.addEventListener("input", () => {
        renderAyahReaderPickerGrid(
            searchReaders(ayahReaderPickerSearch.value)
        );
    });
}

/* =========================================================
PLAY BUTTON
========================================================= */

function updatePlayButton() {

mainPlayBtn.textContent =
    isPlaying
        ? "⏸"
        : "▶";

}

function setSelectedAyahRange(startAyah, endAyah) {

selectedAyah = startAyah;

/*
    لو النهاية مش موجودة أو زي البداية بالظبط،
    يبقى ده طلب آية واحدة عادية (مفيش نطاق).
*/
selectedAyahEnd =
    (endAyah && endAyah !== startAyah)
        ? endAyah
        : null;

repeatAutoSelectedAyah = false;
rangeStopHandled = false;

/*
    مهم: مبنعتمدش على audio.loop هنا.
    audio.loop بيكرر الملف الصوتي بالكامل (السورة
    كلها) مش الآية أو النطاق بس، فمكانه دلوقتي في
    enforceAyahRepeat() و enforceAyahRangeStop()
    اللي بتتحقق من توقيت الآية الفعلي في كل
    "timeupdate".
*/
audio.loop = false;
}

function setSelectedAyah(ayahNumber) {
setSelectedAyahRange(ayahNumber, null);
}

function toggleRepeat() {

if (!repeatEnabled) {

    /*
        لو فيه نطاق آيات محدد بالفعل (من الآية X
        إلى الآية Y)، بنكرر نفس النطاق ده زي ما هو
        وملناش داعي نستبدله بالآية المفردة اللي
        بيتقرأ فيها دلوقتي.
    */

    if (!selectedAyahEnd) {

        /*
            دايمًا نكرر الآية اللي فعليًا بيتقرأ فيها
            دلوقتي (اللي عليها الـ highlight)، مش
            بالضرورة الآية اللي المستخدم طلبها بصوته
            الأول - لأن الشيخ ممكن يكون عدّاها وراح
            لآيات تانية والسورة مستمرة عادي.
        */

        const highlightedAyah =
            (
                activeAyahIndex >= 0 &&
                currentAyahTimings.length
            )
                ? activeAyahIndex + 1
                : null;

        const targetAyah =
            highlightedAyah ||
            selectedAyah;

        if (!targetAyah) {

            showToast(
                "استنى لحد ما تبدأ آية تتقرأ الأول عشان نقدر نكررها"
            );

            return;

        }

        if (targetAyah !== selectedAyah) {

            setSelectedAyahRange(
                targetAyah,
                null
            );

            repeatAutoSelectedAyah =
                true;

        } else {

            repeatAutoSelectedAyah =
                false;

        }

    }

} else if (repeatAutoSelectedAyah) {

    /*
        بنقفل التكرار: لو الآية كانت متحددة تلقائيًا
        من الـ highlight (مش طلب صريح من المستخدم لسه
        قائم)، نمسحها تاني عشان السورة ترجع تكمل
        تشغيل عادي.
    */

    setSelectedAyahRange(null, null);
    repeatAutoSelectedAyah = false;

}

repeatEnabled = !repeatEnabled;
rangeStopHandled = false;
audio.loop = false;
repeatBtn.classList.toggle("active", repeatEnabled);
repeatBtn.setAttribute("aria-pressed", String(repeatEnabled));
const repeatLabel =
    selectedAyahEnd
        ? `الآيات ${selectedAyah} - ${selectedAyahEnd}`
        : "الآية الحالية";

repeatBtn.title = repeatEnabled
    ? `إيقاف تكرار ${repeatLabel}`
    : `تكرار ${repeatLabel}`;
showToast(
    repeatEnabled
        ? `تم تفعيل تكرار ${repeatLabel}`
        : "تم إيقاف التكرار"
);

}

/* =========================================================
   ENFORCE AYAH REPEAT
   بيرجع الصوت لبداية الآية المطلوبة أول ما يوصل
   لنهايتها الحقيقية (باستخدام توقيت mp3quran)،
   بدل الاعتماد على تكرار ملف السورة كامل.
========================================================= */

function getSelectedAyahTiming() {

    if (
        !selectedAyah ||
        !currentAyahTimings.length
    ) {
        return null;
    }

    return (
        currentAyahTimings.find(
            item =>
                item.ayah ===
                Number(selectedAyah)
        ) || null
    );

}

function getRangeEndTiming() {

    if (
        !selectedAyahEnd ||
        !currentAyahTimings.length
    ) {
        return null;
    }

    return (
        currentAyahTimings.find(
            item =>
                item.ayah ===
                Number(selectedAyahEnd)
        ) || null
    );

}

function enforceAyahRepeat() {

    if (
        !repeatEnabled ||
        !selectedAyah
    ) {
        return;
    }

    const startTiming =
        getSelectedAyahTiming();

    /*
        لو فيه نطاق (من آية X إلى آية Y) بنكرر
        النطاق كله: بنستنى لحد نهاية آخر آية فيه
        (Y) وبعدين نرجع لبداية أول آية (X)، مش
        لبداية Y بس زي ما كان بيحصل قبل كده.
    */

    const boundaryTiming =
        selectedAyahEnd
            ? (getRangeEndTiming() || startTiming)
            : startTiming;

    /*
        لو مفيش توقيت دقيق لهذا القارئ
        مينفعش نحدد نهاية الآية أو النطاق بدقة،
        فمش هنعمل حاجة هنا (المصدر الوحيد
        المتاح وقتها هو ملف السورة بالكامل).
    */

    if (!startTiming || !boundaryTiming) {
        return;
    }

    if (
        audio.currentTime >=
        boundaryTiming.end - 0.05
    ) {

        audio.currentTime =
            startTiming.start;

    }
}

/* =========================================================
   ENFORCE AYAH RANGE STOP
   لو المستخدم طلب نطاق آيات (من X إلى Y) والتكرار
   مش مفعّل، بنوقف التشغيل تلقائيًا أول ما نوصل لنهاية
   آخر آية في النطاق (Y)، بدل ما الشيخ يكمل باقي السورة
   عادي زي ما كان بيحصل مع الآية المفردة.
========================================================= */

function enforceAyahRangeStop() {

    if (
        repeatEnabled ||
        !selectedAyah ||
        !selectedAyahEnd ||
        rangeStopHandled
    ) {
        return;
    }

    const boundaryTiming =
        getRangeEndTiming();

    if (!boundaryTiming) {
        return;
    }

    if (
        audio.currentTime >=
        boundaryTiming.end - 0.05
    ) {

        rangeStopHandled = true;

        audio.pause();

        audio.currentTime =
            boundaryTiming.end;

        isPlaying = false;

        updatePlayButton();

        voiceStatus.textContent =
            `انتهى تشغيل الآيات من ${selectedAyah} إلى ${selectedAyahEnd}`;

        showToast(
            `انتهى تشغيل الآيات ${selectedAyah} - ${selectedAyahEnd}`
        );

    }

}

/* =========================================================
NEXT
========================================================= */

async function playNextSurah() {

if (!selectedSurah) {

    showToast(
        "اختر سورة أولاً"
    );

    return;

}


if (
    currentSurahIndex < 0 ||
    currentSurahIndex >=
        surahs.length - 1
) {

    return;

}


const nextIndex =
    currentSurahIndex + 1;


selectSurah(
    surahs[nextIndex]
);


await playSelectedSurah(
    true
);

}

/* =========================================================
PREVIOUS
========================================================= */

async function playPreviousSurah() {

if (!selectedSurah) {

    showToast(
        "اختر سورة أولاً"
    );

    return;

}


if (
    currentSurahIndex <= 0
) {

    return;

}


const previousIndex =
    currentSurahIndex - 1;


selectSurah(
    surahs[previousIndex]
);


await playSelectedSurah(
    true
);

}

/* =========================================================
VOLUME
========================================================= */

function updateVolume() {

audio.volume =
    Number(
        volume.value
    );

}

/* =========================================================
SEARCH
========================================================= */

function performSearch() {

const query =
    searchInput.value.trim();


if (!query) {

    renderReaders();

    renderSurahs();

    renderAllReaders();

    return;

}


const readerResults =
    searchReaders(query);


const surahResults =
    searchSurahs(query);


renderReaders(
    readerResults
);


renderSurahs(
    surahResults
);


renderAllReaders(
    readerResults
);

}

/* =========================================================
SHOW ALL READERS
========================================================= */

showAllReaders.addEventListener(
"click",
() => {

    document
        .getElementById("readers")
        .scrollIntoView({
            behavior: "smooth"
        });


    renderAllReaders();

}

);

/* =========================================================
SHOW ALL SURAHS
========================================================= */

showAllSurahs.addEventListener(
"click",
() => {

    const surahsSection =
        document.querySelector(
            "#listen"
        );


    surahsGrid.innerHTML = "";


    surahs.forEach(
        surah => {

            surahsGrid.appendChild(
                createSurahCard(
                    surah
                )
            );

        }
    );


    showAllSurahs.textContent =
        "عرض أقل";


    setTimeout(() => {

        surahsSection
            .scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

    }, 100);

}

);

/* =========================================================
SEARCH EVENTS
========================================================= */

searchBtn.addEventListener(
"click",
performSearch
);

searchInput.addEventListener(
"keydown",
event => {

    if (
        event.key === "Enter"
    ) {

        performSearch();

    }

}

);

/* =========================================================
AUDIO EVENTS
========================================================= */

audio.addEventListener(
"play",
() => {

    isPlaying = true;

    updatePlayButton();

}

);

audio.addEventListener(
"pause",
() => {

    isPlaying = false;

    updatePlayButton();

}

);

audio.addEventListener(
"ended",
async () => {

    isPlaying = false;

    updatePlayButton();

    /*
        لو تكرار الآية مفعّل ووصلنا لنهاية
        ملف السورة (حالة الآية الأخيرة في
        السورة)، نرجع لبداية نفس الآية
        بدل ما نعتبر السورة خلصت.
    */

    if (
        selectedAyah &&
        repeatEnabled
    ) {

        const timing =
            getSelectedAyahTiming();

        if (timing) {

            try {

                audio.currentTime =
                    timing.start;

                await audio.play();

                isPlaying =
                    true;

                updatePlayButton();

            } catch (error) {

                console.error(
                    "Ayah repeat restart error:",
                    error
                );

            }

            return;

        }

    }

    /*
        لو فيه نطاق آيات محدد (من X إلى Y)، معدّيش
        لآية تالية تلقائيًا بعد النطاق - enforceAyahRangeStop
        هي المسؤولة عن إيقاف التشغيل عند حدود النطاق،
        فوصولنا هنا لـ "ended" الحقيقي معناه غالبًا إننا
        قريبين جدًا من نهاية ملف السورة أصلاً.
    */
    if (selectedAyah && !selectedAyahEnd) {

    try {

        if (
            await continueAyahPlayback()
        ) {
            return;
        }

    } catch (error) {

        console.error(
            "Ayah continuation error:",
            error
        );

        voiceStatus.textContent =
            "تعذر الانتقال إلى الآية التالية";

    }

}


    if (
        selectedSurah &&
        !selectedAyah &&
        currentSurahIndex <
            surahs.length - 1
    ) {

        await playNextSurah();

    }

}

);

/* =========================================================
PROPHET DETAILS
========================================================= */

const prophetDetails = {
آدم: ["أبو البشر وأول الأنبياء، خلقه الله بيده وأسكنه الجنة.", "تاب الله عليه بعد نزوله إلى الأرض، وعلّمه أسماء كل شيء.", "التوبة والرجوع إلى الله، والحذر من اتباع وساوس الشيطان."],
إدريس: ["نبي صديق من أوائل الأنبياء، وصفه القرآن بالصدق ورفعة المكانة.", "كان مثالاً في العبادة والصبر والثبات على الحق.", "الصدق والعمل الصالح وعلو الهمة."],
نوح: ["أول رسول إلى أهل الأرض بعد وقوع الشرك، دعا قومه إلى التوحيد زمناً طويلاً.", "صنع السفينة بأمر الله ونجاه الله ومن آمن معه من الطوفان.", "الصبر في الدعوة، والثبات مهما طال الطريق."],
إبراهيم: ["خليل الله وإمام الموحدين، نشأ في قوم يعبدون الأصنام فأنكر عليهم شركهم.", "نجاه الله من النار، ورفع قواعد الكعبة مع إسماعيل، وابتُلي فوفّى.", "التوحيد واليقين والتسليم لأمر الله."],
يوسف: ["نبي كريم جمع الله له بين الجمال والعلم والحكمة، وابتُلي بفراق أبيه والرق والظلم.", "خرج من السجن مكرماً وتولى خزائن مصر، ثم عفا عن إخوته.", "العفة والصبر والعفو وحسن الظن بالله."],
موسى: ["كليم الله ورسوله إلى فرعون وبني إسرائيل، أيده الله بالآيات البينات.", "شق الله له البحر وأنجاه وقومه، وأنزل عليه التوراة.", "مواجهة الظلم، والشجاعة، والاعتماد على الله."],
يونس: ["نبي الله إلى قومه، خرج مغاضباً فابتلاه الله بالحوت ثم نجاه.", "دعا في الظلمات: لا إله إلا أنت سبحانك إني كنت من الظالمين، فاستجاب الله له.", "التوبة والدعاء وعدم اليأس من رحمة الله."],
عيسى: ["رسول الله إلى بني إسرائيل، ولد من غير أب بمعجزة، وأيده الله بالمعجزات بإذنه.", "دعا إلى عبادة الله وحده وبشر برسول يأتي من بعده.", "الرحمة والإخلاص واتباع الوحي."],
محمد: ["خاتم الأنبياء والمرسلين، أرسله الله رحمة للعالمين بالقرآن الكريم.", "دعا إلى التوحيد وصبر على أذى قومه، وبنى مجتمعاً قائماً على العدل والرحمة.", "الرحمة وحسن الخلق والتمسك بالقرآن والسنة."]
};

function openProphetDetails(card) {
const name = card.querySelector(".prophet-icon")?.textContent.trim() || "";
const title = card.querySelector("h3")?.textContent.trim() || name;
const summary = card.querySelector("p")?.textContent.trim() || "";
const details = prophetDetails[name] || [
summary,
"كان نبياً من أنبياء الله، دعا قومه إلى التوحيد والاستقامة.",
"الثبات على الحق، والصبر، وحسن التوكل على الله."
];

prophetDetailsContent.innerHTML = `
    <div class="modal-icon">📚</div>
    <h2>${escapeHtml(title)}</h2>
    <p class="prophet-summary">${escapeHtml(details[0])}</p>
    <div class="prophet-detail-block">
        <h3>أبرز أحداث سيرته</h3>
        <p>${escapeHtml(details[1])}</p>
    </div>
    <div class="prophet-detail-block">
        <h3>الدروس المستفادة</h3>
        <p>${escapeHtml(details[2])}</p>
    </div>
    <div class="prophet-detail-block">
        <h3>نبذة من البطاقة</h3>
        <p>${escapeHtml(summary)}</p>
    </div>
`;
prophetDetailsModal.classList.remove("hidden");

}

document.querySelectorAll(".prophet-card").forEach(card => {
card.setAttribute("tabindex", "0");
card.addEventListener("click", () => openProphetDetails(card));
card.addEventListener("keydown", event => {
if (event.key === "Enter" || event.key === " ") {
event.preventDefault();
openProphetDetails(card);
}
});
});

function closeProphetDetails() {
prophetDetailsModal.classList.add("hidden");
}

prophetDetailsCloseBtn.addEventListener("click", closeProphetDetails);
prophetDetailsModal.addEventListener("click", event => {
if (event.target === prophetDetailsModal) {
closeProphetDetails();
}
});

audio.addEventListener(
"error",
() => {

    console.error(
        "Audio error:",
        audio.error
    );


    voiceStatus.textContent =
        "حدث خطأ أثناء تحميل الصوت";

}

);

audio.addEventListener(
"timeupdate",
() => {

    enforceAyahRepeat();

    enforceAyahRangeStop();

    updateAyahHighlight();

    updatePlayerProgress();

}
);


audio.addEventListener(
    "loadedmetadata",
    () => {
        updateAyahHighlight();
        updatePlayerProgress();
    }
);

audio.addEventListener(
    "durationchange",
    updatePlayerProgress
);

audio.addEventListener(
    "emptied",
    updatePlayerProgress
);

/* =========================================================
   PLAYER PROGRESS BAR (زي شريط الإذاعة: وقت حالي / شريط
   تقدم / المدة الكاملة، تحت أزرار التشغيل والتكرار مباشرة)
========================================================= */

function formatPlayerTime(totalSeconds) {

    if (
        !Number.isFinite(totalSeconds) ||
        totalSeconds < 0
    ) {

        return "00:00";

    }

    const minutes =
        Math.floor(totalSeconds / 60);

    const seconds =
        Math.floor(totalSeconds % 60);

    return (
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`
    );

}

/*
    بنسيب متغير بسيط بيتفعل وإحنا بنسحب شريط التقدم بالإيد،
    عشان الشريط ميترجعش يتحدث من audio.currentTime في نفس
    اللحظة اللي المستخدم بيسحبه فيها.
*/
let isSeekingPlayer = false;

function updatePlayerProgress() {

    if (
        !playerSeek ||
        !playerCurrentTime ||
        !playerDuration
    ) {
        return;
    }

    const hasDuration =
        Number.isFinite(audio.duration) &&
        audio.duration > 0;


    playerDuration.textContent =
        formatPlayerTime(
            hasDuration
                ? audio.duration
                : 0
        );


    playerCurrentTime.textContent =
        formatPlayerTime(
            audio.currentTime
        );


    if (isSeekingPlayer) {
        return;
    }

    playerSeek.max =
        hasDuration
            ? audio.duration
            : 0;

    playerSeek.value =
        hasDuration
            ? audio.currentTime
            : 0;

}

if (playerSeek) {

    playerSeek.addEventListener(
        "input",
        () => {

            isSeekingPlayer = true;

            playerCurrentTime.textContent =
                formatPlayerTime(
                    Number(playerSeek.value)
                );

        }
    );


    playerSeek.addEventListener(
        "change",
        () => {

            if (
                Number.isFinite(audio.duration) &&
                audio.duration > 0
            ) {

                audio.currentTime =
                    Number(playerSeek.value);

            }

            isSeekingPlayer = false;

        }
    );

}

/* =========================================================
RADIO
========================================================= */

const radioAudio = document.getElementById("radioAudio");
const radioStationName = document.getElementById("radioStationName");
const radioStationStatus = document.getElementById("radioStationStatus");

/* رابط مباشر لخادم البث (بدون إعادة توجيه) لتقليل زمن الاتصال الأول */
const EGYPT_QURAN_RADIO =
"https://n0d.radiojar.com/8s5u5tpdtwzuv";

/* =========================================================
INITIAL RADIO
========================================================= */

if (radioAudio) {
radioAudio.preload = "none";
radioAudio.autoplay = false;
}

let radioPrimed = false;

/* -----------------------------------------------------------
تجهيز الاتصال بالإذاعة مسبقًا (Warm-up):
نفتح الاتصال ونبدأ التخزين المؤقت قبل أن يضغط المستخدم
زر التشغيل، فيصبح التشغيل شبه فوري بدلاً من الانتظار
لحظة الضغط على الزر.
----------------------------------------------------------- */
function primeRadioStream(streamUrl) {

if (!radioAudio || radioPrimed || !streamUrl) {
    return;
}

radioAudio.preload = "auto";
radioAudio.src = streamUrl;
radioAudio.load();
radioPrimed = true;

}

const firstRadioStationButton =
document.querySelector(".radio-station");

if (firstRadioStationButton) {

const earlyStreamUrl =
    firstRadioStationButton.dataset.stream ||
    EGYPT_QURAN_RADIO;

if ("requestIdleCallback" in window) {
    requestIdleCallback(
        () => primeRadioStream(earlyStreamUrl),
        { timeout: 3000 }
    );
} else {
    setTimeout(() => primeRadioStream(earlyStreamUrl), 1200);
}

}

/* =========================================================
RADIO BUTTON
========================================================= */

document.querySelectorAll(".radio-station").forEach(button => {

const streamUrl =
    button.dataset.stream || EGYPT_QURAN_RADIO;

/* تجهيز مبكر إضافي بمجرد ملامسة/الضغط المبدئي على الزر،
   قبل أن يكتمل حدث click بجزء من الثانية */
button.addEventListener("pointerdown", () => {
    primeRadioStream(streamUrl);
});

button.addEventListener("click", () => {

    if (!radioAudio) {
        return;
    }

    /*
        الإذاعة بث مباشر (Live Stream) من سيرفر خارجي،
        مش ملف مخزن عندنا، فمينفعش تشتغل بدون نت أصلاً
        مهما عملنا كاش - مفيش "بث" أونلاين نلحقه لو مفيش
        اتصال. بنوضح ده للمستخدم بدل ما يفضل مستني تشغيل
        مش هيحصل، ونرشح له تحميل قارئ للاستماع بدون نت.
    */

    if (navigator.onLine === false) {

        radioStationStatus.textContent =
            "الإذاعة بث مباشر ومحتاجة إنترنت دايمًا، مينفعش تتخزن بدون نت";

        showToast(
            "بث الإذاعة المباشر محتاج إنترنت. للاستماع بدون نت جرّب تنزيل قارئ من قسم الاستماع"
        );

        return;

    }

    if (radioAudio.src !== streamUrl) {
        radioAudio.preload = "auto";
        radioAudio.src = streamUrl;
    }

    radioPrimed = true;

    radioStationName.textContent =
        button.dataset.name ||
        "إذاعة القرآن الكريم من القاهرة";

    radioStationStatus.textContent =
        "جاري تشغيل الإذاعة...";

    document
        .querySelectorAll(".radio-station")
        .forEach(station => {
            station.classList.toggle(
                "active",
                station === button
            );
        });

    radioAudio.play()
        .then(() => {

            radioStationStatus.textContent =
                "البث المباشر يعمل الآن";

        })
        .catch(error => {

            console.error(
                "Radio Error:",
                error
            );

            radioStationStatus.textContent =
                "اضغط تشغيل لبدء الإذاعة";

        });

});

});

/* =========================================================
RADIO ERROR
========================================================= */

if (radioAudio) {

radioAudio.addEventListener("error", () => {

    radioStationStatus.textContent =
        navigator.onLine === false
            ? "الإذاعة بث مباشر ومحتاجة إنترنت، تأكد من الاتصال"
            : "تعذر تشغيل إذاعة القرآن الكريم";

});

}
/* =========================================================
PRAYER TIMES
========================================================= */

/* =========================================================
   PRAYER TIMES
========================================================= */

const prayerLocation =
    document.getElementById("prayerLocation");

const prayerDate =
    document.getElementById("prayerDate");

const prayerTimesGrid =
    document.getElementById("prayerTimesGrid");

const nextPrayerName =
    document.getElementById("nextPrayerName");

const nextPrayerCountdown =
    document.getElementById("nextPrayerCountdown");

const refreshPrayerBtn =
    document.getElementById("getPrayerTimesBtn");

const enablePrayerNotificationsBtn =
    document.getElementById("enablePrayerNotificationsBtn");


const prayerNames = {
    Fajr: "الفجر",
    Sunrise: "الشروق",
    Dhuhr: "الظهر",
    Asr: "العصر",
    Sunset: "الغروب",
    Maghrib: "المغرب",
    Isha: "العشاء"
};


let currentPrayerTimings = null;
let prayerCountdownInterval = null;


/* =========================================================
   FORMAT TIME
========================================================= */

function formatPrayerTime(time) {

    if (!time) {
        return "--:--";
    }

    const cleanTime = String(time)
        .replace(/\s*\(.*/, "")
        .trim();

    const parts = cleanTime.split(":");

    if (parts.length < 2) {
        return cleanTime;
    }

    let hour = Number(parts[0]);
    const minute = parts[1];

    if (Number.isNaN(hour)) {
        return cleanTime;
    }

    const period = hour >= 12 ? "م" : "ص";

    hour = hour % 12;

    if (hour === 0) {
        hour = 12;
    }

    return `${hour}:${minute} ${period}`;
}


/* =========================================================
   RENDER PRAYER TIMES
========================================================= */

function renderPrayerTimes(timings) {

    if (!prayerTimesGrid) {
        return;
    }

    prayerTimesGrid.innerHTML =
        Object.entries(prayerNames)
            .map(([key, label]) => {

                const rawTime =
                    timings?.[key] || "--:--";

                return `
                    <div class="prayer-time">
                        <span>${label}</span>
                        <strong>
                            ${formatPrayerTime(rawTime)}
                        </strong>
                    </div>
                `;

            })
            .join("");
}


/* =========================================================
   GET USER LOCATION
========================================================= */

function getPrayerLocation() {

    return new Promise((resolve, reject) => {

        if (!navigator.geolocation) {
            reject(
                new Error("المتصفح لا يدعم تحديد الموقع")
            );
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {

                resolve({
                    latitude:
                        position.coords.latitude,

                    longitude:
                        position.coords.longitude
                });

            },

            error => {
                reject(error);
            },

            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000
            }
        );

    });

}


/* =========================================================
   LOAD PRAYER TIMES
========================================================= */

async function loadPrayerTimes() {

    try {

        if (prayerLocation) {
            prayerLocation.textContent =
                "جاري تحديد موقعك...";
        }

        if (prayerDate) {
            prayerDate.textContent =
                "جاري تحميل مواقيت الصلاة...";
        }

        const {
            latitude,
            longitude
        } = await getPrayerLocation();


        const now = new Date();

        const year =
            now.getFullYear();

        const month =
            String(now.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(now.getDate())
                .padStart(2, "0");

        const formattedDate =
            `${day}-${month}-${year}`;


        const url =
            `https://api.aladhan.com/v1/timings/${formattedDate}` +
            `?latitude=${encodeURIComponent(latitude)}` +
            `&longitude=${encodeURIComponent(longitude)}` +
            `&method=5`;


        const response =
            await fetch(url);


        if (!response.ok) {
            throw new Error(
                "فشل تحميل مواقيت الصلاة"
            );
        }


        const result =
            await response.json();


        if (
            !result ||
            !result.data ||
            !result.data.timings
        ) {
            throw new Error(
                "بيانات مواقيت الصلاة غير صحيحة"
            );
        }


        currentPrayerTimings =
            result.data.timings;


        renderPrayerTimes(
            currentPrayerTimings
        );


        if (prayerLocation) {

            prayerLocation.textContent =
                `موقعك الحالي (${Number(latitude).toFixed(2)}, ${Number(longitude).toFixed(2)})`;

        }


        if (prayerDate) {

            prayerDate.textContent =
                `${result.data.date?.readable || "اليوم"} • حسب طريقة الحساب المصرية`;

        }


        updateNextPrayer();

        startPrayerCountdown();

        if (
            isPrayerNotificationsEnabled() &&
            "Notification" in window &&
            Notification.permission === "granted"
        ) {
            startPrayerNotificationChecker();
        }


    } catch (error) {

        console.error(
            "Prayer Times Error:",
            error
        );


        if (prayerLocation) {

            prayerLocation.textContent =
                "تعذر تحديد الموقع";

        }


        if (prayerDate) {

            prayerDate.textContent =
                "تعذر تحميل مواقيت الصلاة";

        }


        if (prayerTimesGrid) {

            prayerTimesGrid.innerHTML = `
                <div class="prayer-error">
                    <i class="fas fa-location-crosshairs"></i>
                    <span>
                        اسمح للموقع بالوصول إلى موقعك لعرض مواقيت الصلاة
                    </span>
                </div>
            `;

        }

    }

}


/* =========================================================
   GET NEXT PRAYER
========================================================= */

function getNextPrayer() {

    if (!currentPrayerTimings) {
        return null;
    }


    const prayerOrder = [
        "Fajr",
        "Dhuhr",
        "Asr",
        "Maghrib",
        "Isha"
    ];


    const now = new Date();


    for (const prayerKey of prayerOrder) {

        const time =
            currentPrayerTimings[prayerKey];

        if (!time) {
            continue;
        }


        const cleanTime =
            String(time)
                .replace(/\s*\(.*/, "")
                .trim();


        const [hours, minutes] =
            cleanTime
                .split(":")
                .map(Number);


        const prayerDate =
            new Date(now);

        prayerDate.setHours(
            hours,
            minutes,
            0,
            0
        );


        if (prayerDate > now) {

            return {
                key: prayerKey,
                name: prayerNames[prayerKey],
                time: prayerDate
            };

        }

    }


    // لو كل الصلوات خلصت، يبقى الفجر القادم غدًا

    const fajr =
        currentPrayerTimings.Fajr;

    if (!fajr) {
        return null;
    }


    const [hours, minutes] =
        String(fajr)
            .replace(/\s*\(.*/, "")
            .trim()
            .split(":")
            .map(Number);


    const tomorrowFajr =
        new Date(now);

    tomorrowFajr.setDate(
        tomorrowFajr.getDate() + 1
    );

    tomorrowFajr.setHours(
        hours,
        minutes,
        0,
        0
    );


    return {
        key: "Fajr",
        name: "الفجر",
        time: tomorrowFajr
    };

}


/* =========================================================
   UPDATE NEXT PRAYER
========================================================= */

function updateNextPrayer() {

    const nextPrayer =
        getNextPrayer();


    if (!nextPrayer) {

        if (nextPrayerName) {
            nextPrayerName.textContent =
                "--";
        }

        if (nextPrayerCountdown) {
            nextPrayerCountdown.textContent =
                "--:--:--";
        }

        return;
    }


    if (nextPrayerName) {

        nextPrayerName.textContent =
            `الصلاة القادمة: ${nextPrayer.name}`;

    }


    updatePrayerCountdown(
        nextPrayer
    );

}


/* =========================================================
   COUNTDOWN
========================================================= */

function updatePrayerCountdown(nextPrayer) {

    if (!nextPrayer) {
        return;
    }


    const now =
        new Date();

    const difference =
        nextPrayer.time.getTime() -
        now.getTime();


    if (difference <= 0) {

        updateNextPrayer();

        return;

    }


    const totalSeconds =
        Math.floor(
            difference / 1000
        );


    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );


    const seconds =
        totalSeconds % 60;


    const formatted =
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;


    if (nextPrayerCountdown) {

        nextPrayerCountdown.textContent =
            formatted;

    }

}


/* =========================================================
   START COUNTDOWN
========================================================= */

function startPrayerCountdown() {

    if (prayerCountdownInterval) {

        clearInterval(
            prayerCountdownInterval
        );

    }


    updateNextPrayer();


    prayerCountdownInterval =
        setInterval(() => {

            const nextPrayer =
                getNextPrayer();


            if (!nextPrayer) {
                return;
            }


            updatePrayerCountdown(
                nextPrayer
            );

        }, 1000);

}


/* =========================================================
   ARABIC MINUTES LABEL
========================================================= */

function arabicMinutesLabel(minutes) {

    minutes =
        Number(minutes);


    if (minutes === 1) {
        return "دقيقة واحدة";
    }


    if (minutes === 2) {
        return "دقيقتين";
    }


    if (
        minutes >= 3 &&
        minutes <= 10
    ) {

        return `${minutes} دقائق`;

    }


    return `${minutes} دقيقة`;

}


/* =========================================================
   PRAYER NOTIFICATIONS - الإعدادات والتخزين
========================================================= */

const PRAYER_NOTIF_ENABLED_KEY = "prayerNotificationsEnabled";
const PRAYER_NOTIF_FIRED_KEY = "prayerNotificationsFiredLog";

/* التنبيه قبل الصلاة بـ 30 و10 و5 دقايق، وتنبيه إضافي وقت الأذان نفسه */
const PRAYER_REMINDER_OFFSETS_MIN = [30, 10, 5];

/* شيل الشروق والغروب، دول مش أوقات أذان */
const PRAYER_AZAN_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

/*
   ضع ملف صوت الأذان باسم adhan.mp3 في نفس مجلد التطبيق
   (مثلاً أذان الحرم المكي بصوت الشيخ علي أحمد ملا) وهيشتغل تلقائيًا.
   لو الملف مش موجود، هيتجاهله بهدوء ويكتفي بالإشعار والاهتزاز.
*/
const prayerAzanAudio = new Audio("./adhan.mp3");
prayerAzanAudio.preload = "none";

let prayerNotificationTimerId = null;
let firedPrayerNotifications = loadFiredPrayerNotifications();

function loadFiredPrayerNotifications() {

    const todayKey = new Date().toDateString();

    try {

        const raw = localStorage.getItem(PRAYER_NOTIF_FIRED_KEY);
        const parsed = raw ? JSON.parse(raw) : null;

        if (parsed && parsed.day === todayKey && Array.isArray(parsed.keys)) {
            return parsed;
        }

    } catch (error) {
        /* تجاهل أي خطأ في قراءة التخزين */
    }

    return { day: todayKey, keys: [] };

}

function saveFiredPrayerNotifications() {

    try {

        localStorage.setItem(
            PRAYER_NOTIF_FIRED_KEY,
            JSON.stringify(firedPrayerNotifications)
        );

    } catch (error) {
        /* تجاهل أي خطأ في التخزين */
    }

}

function isPrayerNotificationsEnabled() {

    return localStorage.getItem(PRAYER_NOTIF_ENABLED_KEY) === "true";

}

function setPrayerNotificationsEnabled(enabled) {

    localStorage.setItem(
        PRAYER_NOTIF_ENABLED_KEY,
        enabled ? "true" : "false"
    );

}

function updatePrayerNotificationsButton() {

    if (!enablePrayerNotificationsBtn) {
        return;
    }

    const isOn =
        isPrayerNotificationsEnabled() &&
        "Notification" in window &&
        Notification.permission === "granted";

    if (isOn) {

        enablePrayerNotificationsBtn.textContent =
            "🔔 تنبيهات الصلاة مفعّلة ✓";

        enablePrayerNotificationsBtn.classList.add("active");

    } else {

        enablePrayerNotificationsBtn.textContent =
            "🔔 تفعيل تنبيهات الصلاة";

        enablePrayerNotificationsBtn.classList.remove("active");

    }

}


/* =========================================================
   PRAYER NOTIFICATIONS - بناء جدول التنبيهات
========================================================= */

function parsePrayerClockTime(rawTime) {

    const cleanTime =
        String(rawTime || "")
            .replace(/\s*\(.*/, "")
            .trim();

    const [hours, minutes] =
        cleanTime.split(":").map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return null;
    }

    return { hours, minutes };

}

function buildPrayerNotificationSchedule() {

    if (!currentPrayerTimings) {
        return [];
    }

    const now = new Date();
    const schedule = [];

    PRAYER_AZAN_ORDER.forEach(prayerKey => {

        const parsed =
            parsePrayerClockTime(
                currentPrayerTimings[prayerKey]
            );

        if (!parsed) {
            return;
        }

        /*
            بنجهز اليوم وبكرة معًا، عشان لو المستخدم فاتح
            التطبيق قرب نص الليل يفضل عنده تنبيه الفجر جاهز.
            (مواقيت بكرة تتحدث لدقتها أعلى بعد التحديث اليومي)
        */
        [0, 1].forEach(dayOffset => {

            const prayerMoment = new Date(now);

            prayerMoment.setDate(
                prayerMoment.getDate() + dayOffset
            );

            prayerMoment.setHours(
                parsed.hours,
                parsed.minutes,
                0,
                0
            );

            PRAYER_REMINDER_OFFSETS_MIN.forEach(offsetMinutes => {

                const alertTime =
                    new Date(
                        prayerMoment.getTime() -
                        offsetMinutes * 60 * 1000
                    );

                schedule.push({
                    key: `${prayerKey}-${dayOffset}-before${offsetMinutes}`,
                    time: alertTime,
                    title: "اقترب موعد الصلاة",
                    body: `صلاة ${prayerNames[prayerKey]} بعد ${arabicMinutesLabel(offsetMinutes)}`,
                    playAzan: false
                });

            });

            schedule.push({
                key: `${prayerKey}-${dayOffset}-azan`,
                time: prayerMoment,
                title: "حان الآن وقت الصلاة",
                body: `حان الآن وقت صلاة ${prayerNames[prayerKey]} 🕌`,
                playAzan: true
            });

        });

    });

    return schedule;

}


/* =========================================================
   PRAYER NOTIFICATIONS - العرض والتشغيل
========================================================= */

function playAzanSound() {

    try {

        prayerAzanAudio.currentTime = 0;

        const playPromise =
            prayerAzanAudio.play();

        if (playPromise && typeof playPromise.catch === "function") {

            playPromise.catch(error => {
                console.warn(
                    "تعذر تشغيل صوت الأذان تلقائيًا (يحتاج تفاعل من المستخدم أو ملف adhan.mp3):",
                    error
                );
            });

        }

    } catch (error) {

        console.warn(
            "تعذر تشغيل صوت الأذان:",
            error
        );

    }

}

function showPrayerNotification(entry) {

    const options = {
        body: entry.body,
        icon: "./icon-192.png",
        badge: "./icon-192.png",
        tag: entry.key,
        dir: "rtl",
        lang: "ar",
        vibrate: [200, 100, 200]
    };

    if (navigator.serviceWorker && navigator.serviceWorker.ready) {

        navigator.serviceWorker.ready
            .then(registration =>
                registration.showNotification(entry.title, options)
            )
            .catch(() => {

                try {
                    new Notification(entry.title, options);
                } catch (error) {
                    console.error("Notification display error:", error);
                }

            });

    } else if ("Notification" in window && Notification.permission === "granted") {

        try {
            new Notification(entry.title, options);
        } catch (error) {
            console.error("Notification display error:", error);
        }

    }

    if (entry.playAzan) {
        playAzanSound();
    }

}

function checkPrayerNotificationSchedule() {

    if (!isPrayerNotificationsEnabled()) {
        return;
    }

    if (!("Notification" in window) || Notification.permission !== "granted") {
        return;
    }

    if (!currentPrayerTimings) {
        return;
    }

    const todayKey = new Date().toDateString();

    if (firedPrayerNotifications.day !== todayKey) {
        firedPrayerNotifications = { day: todayKey, keys: [] };
    }

    const schedule = buildPrayerNotificationSchedule();
    const now = Date.now();

    /*
        نافذة تنفيذ 90 ثانية للخلف: لو المتصفح بطّأ المؤقت
        لكون التطبيق في الخلفية، برضو التنبيه هيوصل ومش هيتفوت.
    */
    schedule.forEach(entry => {

        const diff = entry.time.getTime() - now;

        if (
            diff <= 0 &&
            diff > -90000 &&
            !firedPrayerNotifications.keys.includes(entry.key)
        ) {

            showPrayerNotification(entry);

            firedPrayerNotifications.keys.push(entry.key);

            saveFiredPrayerNotifications();

        }

    });

}

function startPrayerNotificationChecker() {

    if (prayerNotificationTimerId) {
        clearInterval(prayerNotificationTimerId);
    }

    checkPrayerNotificationSchedule();

    prayerNotificationTimerId =
        setInterval(checkPrayerNotificationSchedule, 15000);

}


/* =========================================================
   PRAYER NOTIFICATIONS - التفعيل
========================================================= */

async function enablePrayerNotifications() {

    if (!("Notification" in window)) {

        alert(
            "المتصفح لا يدعم الإشعارات"
        );

        return;

    }

    /* لو مفعّلة بالفعل، الزرار يبقى وضع "إيقاف" */
    if (isPrayerNotificationsEnabled() && Notification.permission === "granted") {

        setPrayerNotificationsEnabled(false);

        if (prayerNotificationTimerId) {
            clearInterval(prayerNotificationTimerId);
            prayerNotificationTimerId = null;
        }

        updatePrayerNotificationsButton();

        showToast("تم إيقاف تنبيهات الصلاة");

        return;

    }


    try {

        const permission =
            await Notification.requestPermission();


        if (permission === "granted") {

            setPrayerNotificationsEnabled(true);

            updatePrayerNotificationsButton();

            if (currentPrayerTimings) {
                startPrayerNotificationChecker();
            }

            const successBody =
                "هيوصلك تنبيه قبل كل صلاة بـ 30 و10 و5 دقايق، وتنبيه ثاني وقت الأذان نفسه.";

            if (navigator.serviceWorker && navigator.serviceWorker.ready) {

                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification("القرآن الكريم", {
                        body: successBody,
                        icon: "./icon-192.png"
                    });
                });

            } else {

                new Notification("القرآن الكريم", {
                    body: successBody
                });

            }

        } else if (permission === "denied") {

            showToast(
                "الإشعارات مرفوضة من إعدادات المتصفح، فعّلها من هناك الأول"
            );

        }

    } catch (error) {

        console.error(
            "Notification Error:",
            error
        );

        showToast("حصل خطأ أثناء تفعيل الإشعارات");

    }

}


/* =========================================================
   PRAYER NOTIFICATIONS - تحديث يومي تلقائي
========================================================= */

function scheduleNextPrayerTimesRefresh() {

    const now = new Date();

    const nextMidnight = new Date(now);

    nextMidnight.setDate(now.getDate() + 1);

    nextMidnight.setHours(0, 1, 0, 0);

    const msUntilMidnight =
        nextMidnight.getTime() - now.getTime();

    setTimeout(() => {

        loadPrayerTimes();

        scheduleNextPrayerTimesRefresh();

    }, msUntilMidnight);

}


/* =========================================================
   PRAYER BUTTONS
========================================================= */

if (refreshPrayerBtn) {

    refreshPrayerBtn.addEventListener(
        "click",
        loadPrayerTimes
    );

}


if (enablePrayerNotificationsBtn) {

    enablePrayerNotificationsBtn.addEventListener(
        "click",
        enablePrayerNotifications
    );

}


updatePrayerNotificationsButton();


/* =========================================================
   INITIAL LOAD
========================================================= */

loadPrayerTimes();

scheduleNextPrayerTimesRefresh();


/* =========================================================
VOICE RECOGNITION
========================================================= */

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

let recognition = null;

/* =========================================================
   RUN VOICE COMMAND
   ده الجزء اللي بيحلل النص (بعد ما يتحول من صوت لنص، أو
   لو اتكتب مباشرة في مربع الأمر الكتابي) وبينفذ المطلوب:
   اختيار قارئ/سورة، تحديد نطاق آيات، أسلوب/رواية، وتشغيل.

   مستقل تمامًا عن التعرف على الصوت (خارج شرط
   "if (SpeechRecognition)" عمدًا)، عشان مربع الأمر الكتابي
   يفضل شغال حتى في متصفح مش داعم للتعرف على الصوت أصلاً،
   ويشتغل من غير نت خالص.
========================================================= */

async function runVoiceCommand(transcript) {

        console.log(
            "Voice command:",
            transcript
        );


        const result =
            parseVoiceCommand(
                transcript
            );


        console.log(
            "Voice result:",
            result
        );


        if (result.reader) {

            selectReader(
                result.reader
            );

        }


        if (result.surah) {

            selectSurah(
                result.surah
            );

        }

        if (result.ayahRange && result.surah) {

    const totalAyahs =
        result.surah.ayahs;

    const rangeStart =
        Math.max(1, result.ayahRange.start);

    const rangeEnd =
        Math.min(result.ayahRange.end, totalAyahs);

    if (rangeStart > totalAyahs) {

        setSelectedAyahRange(null, null);

        showToast(`سورة ${result.surah.name} تحتوي على ${totalAyahs} آية فقط`);

    } else {

        setSelectedAyahRange(
            rangeStart,
            rangeEnd > rangeStart ? rangeEnd : null
        );

    }

} else if (result.surah) {
    setSelectedAyahRange(null, null);
}


        /*
            أسلوب التلاوة (ترتيل/تجويد) والرواية بيفضلوا
            كـ "وضع" شغال لحد ما يتغيروا بأمر صوتي تاني،
            عشان المستخدم مضطرش يكررهم في كل طلب.
        */

        const styleOrRiwayaChanged =
            Boolean(result.recitationStyle) ||
            Boolean(result.riwaya);

        if (result.recitationStyle) {

            selectedRecitationStyle =
                result.recitationStyle;

        }

        if (result.riwaya) {

            selectedRiwaya =
                result.riwaya;

        }


        /*
            If both found:
            Open Mushaf + Play
        */

        if (
            result.reader &&
            result.surah
        ) {

            await playSelectedSurah(
                true
            );

        } else if (
            result.surah &&
            !result.reader
        ) {

            await openMushaf(
                result.surah,
                true
            );


            voiceStatus.textContent =
                `تم فتح سورة ${result.surah.name}. اختر الشيخ إذا أردت الاستماع.`;

        } else if (
            result.reader &&
            !result.surah
        ) {

            voiceStatus.textContent =
                `تم اختيار ${result.reader.name}. اختر السورة.`;

        } else if (
            styleOrRiwayaChanged &&
            selectedReader &&
            selectedSurah
        ) {

            /*
                المستخدم غيّر الأسلوب/الرواية بس من غير
                ما يقول شيخ أو سورة جديدة، فبنعيد تشغيل
                نفس السورة والقارئ الحاليين بالوضع الجديد.
            */

            await playSelectedSurah(
                false
            );

        } else if (styleOrRiwayaChanged) {

            const modeLabel =
                [
                    selectedRecitationStyle ===
                        "mujawwad"
                        ? "التجويد"
                        : selectedRecitationStyle ===
                            "murattal"
                            ? "الترتيل"
                            : null,

                    selectedRiwaya
                        ? `رواية ${riwayaDisplayNames[selectedRiwaya] || selectedRiwaya}`
                        : null
                ]
                    .filter(Boolean)
                    .join(" - ");

            voiceStatus.textContent =
                `تم ضبط ${modeLabel}. اختر الشيخ والسورة.`;

        } else {

            voiceStatus.textContent =
                "لم أفهم القارئ أو السورة. حاول مرة أخرى.";

        }

}

if (SpeechRecognition) {

recognition =
    new SpeechRecognition();


recognition.lang =
    "ar-EG";


recognition.continuous =
    false;


/*
    بنشغّل النتائج المبدئية عشان نقدر نبدأ نجهّز رابط الصوت
    والتوقيتات والمستخدم لسه بيتكلم، بدل ما نستنى لحد ما
    المتصفح يقرر إن الكلام خلص. ده أهم سبب في تقليل الثواني
    اللي كانت بتعدي قبل ما صوت الشيخ يبدأ.
*/
recognition.interimResults =
    true;


recognition.maxAlternatives =
    1;


recognition.onstart =
    () => {

        voiceBtn.classList.add(
            "listening"
        );


        voiceIcon.classList.add(
            "listening"
        );


        voiceIcon.textContent =
            "🔴";

    };


recognition.onspeechstart =
    () => {

        voiceStatus.classList.remove(
            "voice-status-prompt"
        );


        voiceStatus.textContent =
            "أستمع إليك... تحدث الآن";

    };


/*
    الآن recognition.onresult بقى مجرد "غلاف" رفيع:
    بياخد النص اللي اتعرف عليه ويمرره لـ runVoiceCommand،
    نفس الدالة اللي بيستخدمها مربع الأمر الكتابي بالظبط.
*/
recognition.onresult =
    async event => {

        let interimText = "";
        let finalText = "";

        for (
            let index = 0;
            index < event.results.length;
            index++
        ) {

            const result =
                event.results[index];

            if (result.isFinal) {
                finalText += result[0].transcript;
            } else {
                interimText += result[0].transcript;
            }

        }


        /*
            النتيجة النهائية: ننفذ الأمر على طول.
        */
        if (finalText.trim()) {

            clearVoiceSettleTimer();

            /*
                علّمنا إن الأمر اتنفذ فعلاً، عشان شبكة الأمان
                اللي في onend ما تنفذوش تاني.
            */
            voiceCommandExecuted = true;
            pendingInterimCommand = null;

            voiceStatus.textContent =
                `سمعت: "${finalText.trim()}"`;

            await runVoiceCommand(
                finalText.trim()
            );

            return;

        }


        /*
            نتيجة مبدئية (المستخدم لسه بيتكلم):

            1) بنعرض اللي اتسمع لحد دلوقتي.
            2) بنبدأ نجهّز رابط الصوت والتوقيتات في الخلفية
               لو عرفنا الشيخ والسورة بالفعل.
            3) لو الجملة باينة إنها كملت، بنوقف الاستماع بنفسنا
               بدل ما نستنى المتصفح يكتشف السكوت (وده كان
               بياخد ثواني).
        */
        const trimmedInterim =
            interimText.trim();

        if (!trimmedInterim) {
            return;
        }

        voiceStatus.textContent =
            `سمعت: "${trimmedInterim}"`;

        handleInterimTranscript(
            trimmedInterim
        );

    };


recognition.onend =
    async () => {

        clearVoiceSettleTimer();

        /*
            شبكة أمان: إحنا بنوقف الاستماع بنفسنا بدري عشان
            نسرّع بدء التلاوة. معظم المتصفحات بترجع نتيجة
            نهائية بعد stop()، لكن بعض أجهزة أندرويد بتقفل
            من غير أي نتيجة. في الحالة دي بننفذ آخر نص
            اتسمع بدل ما الأمر يضيع من المستخدم.
        */
        if (
            pendingInterimCommand &&
            !voiceCommandExecuted
        ) {

            const rescueText =
                pendingInterimCommand;

            pendingInterimCommand = null;
            voiceCommandExecuted = true;

            await runVoiceCommand(rescueText);

        }

        voiceBtn.classList.remove(
            "listening"
        );


        voiceIcon.classList.remove(
            "listening"
        );


        voiceIcon.textContent =
            "🎙️";


        voiceStatus.classList.remove(
            "voice-status-prompt"
        );

    };


recognition.onerror =
    event => {

        clearVoiceSettleTimer();

        console.error(
            "Speech recognition error:",
            event.error
        );


        voiceBtn.classList.remove(
            "listening"
        );


        voiceIcon.classList.remove(
            "listening"
        );


        voiceIcon.textContent =
            "🎙️";


        voiceStatus.classList.remove(
            "voice-status-prompt"
        );


        if (
            event.error ===
            "not-allowed"
        ) {

            voiceStatus.textContent =
                "اسمح باستخدام الميكروفون أولاً";

        } else if (
            event.error ===
            "network"
        ) {

            voiceStatus.textContent =
                "التعرف على الصوت يحتاج إنترنت ومتصفح Chrome أو Edge";

            showToast(
                "تأكد من الإنترنت وافتح الموقع من Chrome أو Edge"
            );

        } else if (
            event.error ===
            "audio-capture"
        ) {

            voiceStatus.textContent =
                "لم يتم العثور على ميكروفون. افحص إذن الميكروفون";

        } else {

            voiceStatus.textContent =
                "حدث خطأ. حاول مرة أخرى.";

        }

    };

}

/* =========================================================
   TYPED COMMAND (بديل نصي عن الأمر الصوتي)
   بيستخدم نفس runVoiceCommand بالظبط، من غير أي تعرف على
   صوت، فبيشتغل من غير نت خالص وفي أي متصفح.
========================================================= */

if (commandInputBtn && commandInput) {

commandInputBtn.addEventListener(
"click",
async () => {

    const text =
        commandInput.value.trim();

    if (!text) {
        return;
    }

    voiceStatus.textContent =
        `تنفيذ: "${text}"`;

    await runVoiceCommand(text);

}

);

commandInput.addEventListener(
"keydown",
event => {

    if (event.key === "Enter") {

        event.preventDefault();

        commandInputBtn.click();

    }

}

);

}

/* =========================================================
START VOICE
========================================================= */

function startVoiceRecognition() {

if (!recognition) {

    voiceStatus.textContent =
        "المتصفح لا يدعم التعرف على الصوت";

    return;

}

if (
    !window.isSecureContext &&
    location.hostname !==
        "localhost" &&
    location.hostname !==
        "127.0.0.1"
) {

    voiceStatus.textContent =
        "افتح الموقع عبر HTTPS حتى يعمل الميكروفون";

    showToast(
        "الميكروفون يعمل على HTTPS أو localhost فقط"
    );

    return;

}


/*
    بنبدأ نسمع من الميكروفون على طول، ونعرض رسالة
    "أستمع إليك... تحدث الآن" بدل أي رسالة ترحيب.
*/

voiceStatus.textContent =
    "أستمع إليك... تحدث الآن";

resetVoicePrewarmState();

try {

    recognition.start();

} catch (error) {

    console.error(
        error
    );

}

}

/* =========================================================
MICROPHONE PERMISSION
========================================================= */

async function requestMicrophonePermission() {

try {

    const stream =
        await navigator.mediaDevices
            .getUserMedia({
                audio: true
            });


    stream
        .getTracks()
        .forEach(
            track =>
                track.stop()
        );


    permissionModal
        .classList
        .add("hidden");


    voiceStatus.textContent =
        "الميكروفون جاهز";


    showToast(
        "تم السماح بالميكروفون"
    );

} catch (error) {

    console.error(
        "Microphone error:",
        error
    );


    voiceStatus.textContent =
        "لم يتم السماح بالميكروفون";

}

}

/* =========================================================
MODAL
========================================================= */

settingsBtn.addEventListener(
"click",
() => {

    permissionModal
        .classList
        .remove("hidden");

}

);

allowMicBtn.addEventListener(
"click",
requestMicrophonePermission
);

closeModalBtn.addEventListener(
"click",
() => {

    permissionModal
        .classList
        .add("hidden");

}

);

cancelModalBtn.addEventListener(
"click",
() => {

    permissionModal
        .classList
        .add("hidden");

}

);

/* =========================================================
VOICE BUTTON
========================================================= */

voiceBtn.addEventListener(
"click",
startVoiceRecognition
);

/* =========================================================
PLAYER BUTTONS
========================================================= */

mainPlayBtn.addEventListener(
"click",
togglePlayPause
);

nextBtn.addEventListener(
"click",
playNextSurah
);

previousBtn.addEventListener(
"click",
playPreviousSurah
);

volume.addEventListener(
"input",
updateVolume
);

repeatBtn.addEventListener("click", toggleRepeat);

if (downloadReaderBtn) {

    downloadReaderBtn.addEventListener(
        "click",
        downloadReaderFully
    );

}

/* =========================================================
MUSHAF
========================================================= */

const mushafSurahSelect =
document.getElementById(
"mushafSurahSelect"
);

const mushafReaderSelect =
document.getElementById(
"mushafReaderSelect"
);

const readOnlyBtn =
document.getElementById(
"readOnlyBtn"
);

const listenWithReaderBtn =
document.getElementById(
"listenWithReaderBtn"
);

const mushafTitle =
document.getElementById(
"mushafTitle"
);

const mushafSubtitle =
document.getElementById(
"mushafSubtitle"
);

const mushafPage =
document.getElementById(
"mushafPage"
);

const mushafLoading =
document.getElementById(
"mushafLoading"
);

const mushafCounter =
document.getElementById(
"mushafCounter"
);

const mushafPreviousBtn =
document.getElementById(
"mushafPreviousBtn"
);

const mushafNextBtn =
document.getElementById(
"mushafNextBtn"
);

/* =========================================================
POPULATE MUSHAF SELECTS
========================================================= */

function populateMushafSelects() {

/*
    Surahs
*/

mushafSurahSelect.innerHTML = `
    <option value="">
        اختر السورة
    </option>
`;


surahs.forEach(surah => {

    const option =
        document.createElement(
            "option"
        );


    option.value =
        surah.id;


    option.textContent =
        `${surah.id} - ${surah.name}`;


    mushafSurahSelect.appendChild(
        option
    );

});


/*
    Readers
*/

mushafReaderSelect.innerHTML = `
    <option value="">
        بدون قارئ
    </option>
`;


readers.forEach(reader => {

    const option =
        document.createElement(
            "option"
        );


    option.value =
        reader.id;


    option.textContent =
        reader.name;


    mushafReaderSelect.appendChild(
        option
    );

});

}

/* =========================================================
OPEN MUSHAF
========================================================= */

async function openMushaf(
surah,
scrollToMushaf = true
) {

if (!surah) {

    return;

}


selectSurah(
    surah
);


mushafSurahSelect.value =
    surah.id;


mushafTitle.textContent =
    surah.name;


mushafSubtitle.textContent =
    `${surah.englishName} • ${surah.ayahs} آية`;


mushafPage.innerHTML =
    "";


mushafLoading.classList.remove(
    "hidden"
);


if (scrollToMushaf) {

    document
        .getElementById("mushaf")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

}


try {

    const response =
        await fetch(
            `${QURAN_API}/${surah.id}/quran-uthmani`
        );


    if (!response.ok) {

        throw new Error(
            "Failed to load Quran"
        );

    }


    const data =
        await response.json();


    const ayahs =
        data?.data?.ayahs || [];


    if (!ayahs.length) {

        throw new Error(
            "No ayahs found"
        );

    }


    renderMushaf(
        surah,
        ayahs
    );


    mushafCounter.textContent =
        `${surah.id} / 114`;


} catch (error) {

    console.error(
        "Quran API error:",
        error
    );


    mushafPage.innerHTML = `

        <div class="empty-mushaf">

            <div>
                ⚠️
            </div>

            <h3>
                تعذر تحميل السورة
            </h3>

            <p>
                تأكد من اتصال الإنترنت وحاول مرة أخرى.
            </p>

        </div>

    `;

} finally {

    mushafLoading.classList.add(
        "hidden"
    );

}

}

/* =========================================================
RENDER MUSHAF
========================================================= */

function renderMushaf(
surah,
ayahs
) {
mushafPage.innerHTML = "";
activeAyahIndex = -1;
ayahTimePoints = [];
document.getElementById("highlightStatus").textContent =
"سيظهر تمييز الآية أثناء تشغيل التلاوة";

const basmala =
    document.createElement(
        "div"
    );


basmala.className =
    "basmala";


/*
    Do not display Basmala automatically
    for At-Tawbah.
*/

if (surah.id !== 9) {

    basmala.textContent =
        "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ";

    mushafPage.appendChild(
        basmala
    );

}


const ayahsContainer =
    document.createElement(
        "div"
    );


ayahsContainer.className =
    "ayahs";


const totalTextLength = ayahs.reduce(
    (total, ayah) => total + Math.max(String(ayah.text || "").length, 1),
    0
);
let elapsedShare = 0;

ayahs.forEach((ayah, index) => {
    const ayahElement =
        document.createElement(
            "span"
        );


    ayahElement.className =
        "ayah";
    ayahElement.dataset.index = index;
    ayahElement.dataset.number = ayah.numberInSurah;
    elapsedShare += Math.max(String(ayah.text || "").length, 1) / totalTextLength;
    ayahTimePoints.push(elapsedShare);


    ayahElement.innerHTML = `

        ${escapeHtml(
            ayah.text
        )}

        <span class="ayah-number">
            ${ayah.numberInSurah}
        </span>

    `;

    /*
        الدوس على أي آية بيحددها كنقطة بداية للتشغيل،
        حتى لو لسه مفيش قارئ متختار. الدوس تاني على
        نفس الآية بيلغي التحديد ويرجعها تشغيل عادي
        من أول السورة.
    */
    ayahElement.addEventListener("click", () => {

        const number = ayah.numberInSurah;
        const isSameSelected =
            Number(selectedAyah) === Number(number) &&
            !selectedAyahEnd;

        mushafPage
            .querySelectorAll(".ayah.tap-selected")
            .forEach(el => el.classList.remove("tap-selected"));

        const statusEl = document.getElementById("highlightStatus");

        if (isSameSelected) {

            selectedAyah = null;
            selectedAyahEnd = null;

            if (statusEl) {
                statusEl.textContent =
                    "سيظهر تمييز الآية أثناء تشغيل التلاوة";
            }

        } else {

            setSelectedAyah(number);
            ayahElement.classList.add("tap-selected");

            if (statusEl) {
                statusEl.textContent =
                    `هيبدأ التشغيل من الآية ${number} - دوس زر ▶ تحت`;
            }

        }

    });


    ayahsContainer.appendChild(
        ayahElement
    );

});


mushafPage.appendChild(
    ayahsContainer
);

}

function updateAyahHighlight() {

    const ayahElements =
        mushafPage.querySelectorAll(".ayah");


    if (
        !ayahElements.length ||
        !selectedSurah
    ) {
        return;
    }


    let nextIndex = -1;


    /*
        =====================================================
        لو فيه آية محددة
        نستخدم توقيت الآيات الحقيقي
        =====================================================
    */

    if (
        currentAyahTimings.length
    ) {

        const currentTime =
            Math.max(
                0,
                Number(audio.currentTime) - HIGHLIGHT_LAG_SECONDS
            );


        const timing =
            currentAyahTimings.find(
                item =>
                    currentTime >= item.start &&
                    currentTime < item.end
            );


        if (timing) {

            nextIndex =
                timing.ayah - 1;

        } else {

            /*
                أثناء الانتقال بين الآيات
                نحافظ على الآية الأقرب
            */

            const previous =
                [...currentAyahTimings]
                    .reverse()
                    .find(
                        item =>
                            currentTime >= item.start
                    );


            if (previous) {

                nextIndex =
                    previous.ayah - 1;

            }

        }

    }


    /*
        =====================================================
        تشغيل عادي بدون آية محددة
        نستخدم الطريقة التقريبية القديمة
        =====================================================
    */

    if (
        nextIndex < 0 &&
        !selectedAyah &&
        Number.isFinite(audio.duration) &&
        audio.duration > 0 &&
        ayahTimePoints.length
    ) {

        const progress =
            audio.currentTime /
            audio.duration;


        const detectedIndex =
            ayahTimePoints.findIndex(
                point =>
                    progress < point
            );


        nextIndex =
            detectedIndex === -1
                ? ayahElements.length - 1
                : detectedIndex;

    }


    /*
        لو فيه آية محددة لكن timing غير متاح
        نخلي الـ highlight على الآية المطلوبة
    */

    if (
        nextIndex < 0 &&
        selectedAyah
    ) {

        nextIndex =
            Math.min(
                selectedAyah - 1,
                ayahElements.length - 1
            );

    }


    if (
        nextIndex < 0 ||
        nextIndex >= ayahElements.length
    ) {
        return;
    }


    if (
        nextIndex ===
        activeAyahIndex
    ) {
        return;
    }


    ayahElements.forEach(
        ayah =>
            ayah.classList.remove(
                "active"
            )
    );


    const activeAyah =
        ayahElements[nextIndex];


    if (!activeAyah) {
        return;
    }


    activeAyah.classList.add(
        "active"
    );


    activeAyahIndex =
        nextIndex;


    const highlightStatus =
        document.getElementById(
            "highlightStatus"
        );


    if (highlightStatus) {

        highlightStatus.textContent =
            `يتم الآن تشغيل الآية ${nextIndex + 1}`;

    }


    /*
        لا نحرك المصحف إلا أثناء التشغيل
    */

    if (
        !audio.paused &&
        document.visibilityState !== "hidden"
    ) {

        activeAyah.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }

}

/* =========================================================
MUSHAF SURAH CHANGE
========================================================= */

mushafSurahSelect.addEventListener(
"change",
async () => {

    const id =
        Number(
            mushafSurahSelect.value
        );


    if (!id) {

        return;

    }


    const surah =
        getSurahById(id);


    if (!surah) {

        return;

    }


    selectSurah(
        surah
    );


    await openMushaf(
        surah,
        false
    );

}

);

/* =========================================================
MUSHAF READER CHANGE
========================================================= */

mushafReaderSelect.addEventListener(
"change",
() => {

    const id =
        mushafReaderSelect.value;


    if (!id) {

        selectedReader =
            null;


        updatePlayerInfo();


        return;

    }


    const reader =
        getReaderById(id);


    if (reader) {

        selectReader(
            reader
        );

    }

}

);

/* =========================================================
READ ONLY
========================================================= */

readOnlyBtn.addEventListener(
"click",
async () => {

    if (!selectedSurah) {

        showToast(
            "اختر السورة أولاً"
        );

        return;

    }


    await openMushaf(
        selectedSurah,
        true
    );

}

);

/* =========================================================
LISTEN WITH READER
========================================================= */

listenWithReaderBtn.addEventListener(
"click",
async () => {

    if (!selectedSurah) {

        showToast(
            "اختر السورة أولاً"
        );

        return;

    }


    if (!selectedReader) {

        showToast(
            "اختر الشيخ أولاً"
        );

        return;

    }


    await playSelectedSurah(
        true
    );

}

);

/* =========================================================
HOME LISTEN + READ
========================================================= */

listenAndReadBtn.addEventListener(
"click",
async () => {

    if (!selectedReader) {

        showToast(
            "اختر القارئ أولاً"
        );

        return;

    }


    if (!selectedSurah) {

        showToast(
            "اختر السورة أولاً"
        );

        return;

    }


    await playSelectedSurah(
        true
    );

}

);

/* =========================================================
MUSHAF PREVIOUS
========================================================= */

mushafPreviousBtn.addEventListener(
"click",
async () => {

    if (
        currentSurahIndex <= 0
    ) {

        return;

    }


    const surah =
        surahs[
            currentSurahIndex - 1
        ];


    await openMushaf(
        surah,
        true
    );

}

);

/* =========================================================
MUSHAF NEXT
========================================================= */

mushafNextBtn.addEventListener(
"click",
async () => {

    if (
        currentSurahIndex <
        0
    ) {

        return;

    }


    if (
        currentSurahIndex >=
        surahs.length - 1
    ) {

        return;

    }


    const surah =
        surahs[
            currentSurahIndex + 1
        ];


    await openMushaf(
        surah,
        true
    );

}

);

/* ================================
SALAWAT REMINDER
================================= */

const salawatReminder =
document.getElementById("salawatReminder");

function showSalawatReminder() {

if (!salawatReminder) return;

salawatReminder.classList.add("show");

setTimeout(() => {
    salawatReminder.classList.remove("show");
}, 6000);

}

/* أول ظهور بعد فتح الموقع */
setTimeout(showSalawatReminder, 1000);

/* تكرار كل 10 دقائق */
setInterval(showSalawatReminder, 1 * 60 * 1000);

/* =========================================================
CAROUSEL (سنن النبي / قصص الأنبياء)
========================================================= */

function initCarousel(rootId, dotsId) {

    const root = document.getElementById(rootId);
    if (!root) return;

    const track = root.querySelector(".carousel-track");
    const slides = Array.from(root.querySelectorAll(".carousel-slide"));
    const prevBtn = root.querySelector(".carousel-arrow.prev");
    const nextBtn = root.querySelector(".carousel-arrow.next");
    const dotsContainer = document.getElementById(dotsId);

    if (!track || slides.length === 0) return;

    let currentIndex = 0;
    let startX = 0;
    let isDragging = false;

    /*
        منشئين نقاط (dots) بعددها زي عدد الشرائح، بس لو
        العدد كبير جدًا (زي الأنبياء) بنكتفي بعداد رقمي
        نصي بدل ما نعمل عشرات النقاط اللي هتكون مزدحمة.
    */
    const useDots = slides.length <= 12;

    if (dotsContainer) {

        if (useDots) {

            slides.forEach((_, i) => {
                const dot = document.createElement("button");
                dot.className = "carousel-dot";
                dot.type = "button";
                dot.setAttribute("aria-label", `اذهب إلى ${i + 1}`);
                dot.addEventListener("click", () => goTo(i));
                dotsContainer.appendChild(dot);
            });

        } else {

            dotsContainer.classList.add("carousel-counter");

        }

    }

    function updateUI() {

        track.style.transform = `translateX(${currentIndex * 100}%)`;

        if (dotsContainer) {

            if (useDots) {

                dotsContainer
                    .querySelectorAll(".carousel-dot")
                    .forEach((dot, i) => {
                        dot.classList.toggle("active", i === currentIndex);
                    });

            } else {

                dotsContainer.textContent =
                    `${currentIndex + 1} / ${slides.length}`;

            }

        }

    }

    function goTo(index) {
        currentIndex = Math.max(0, Math.min(slides.length - 1, index));
        updateUI();
    }

    /* سحب يمين = اللي بعدها، سحب شمال = اللي قبلها */
    function goNext() {
        currentIndex = (currentIndex + 1) % slides.length;
        updateUI();
    }

    function goPrev() {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateUI();
    }

    if (nextBtn) nextBtn.addEventListener("click", goNext);
    if (prevBtn) prevBtn.addEventListener("click", goPrev);

    /* السحب باللمس (موبايل) */
    track.addEventListener("touchstart", event => {
        startX = event.touches[0].clientX;
        isDragging = true;
        track.classList.add("dragging");
    }, { passive: true });

    track.addEventListener("touchmove", event => {
        if (!isDragging) return;
        const deltaX = event.touches[0].clientX - startX;
        track.style.transform =
            `translateX(calc(${currentIndex * 100}% + ${deltaX}px))`;
    }, { passive: true });

    track.addEventListener("touchend", event => {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove("dragging");

        const deltaX = event.changedTouches[0].clientX - startX;
        const threshold = 50;

        if (deltaX > threshold) {
            goNext();
        } else if (deltaX < -threshold) {
            goPrev();
        } else {
            updateUI();
        }
    });

    /* السحب بالماوس (ديسكتوب) */
    track.addEventListener("mousedown", event => {
        startX = event.clientX;
        isDragging = true;
        track.classList.add("dragging");
        event.preventDefault();
    });

    window.addEventListener("mousemove", event => {
        if (!isDragging) return;
        const deltaX = event.clientX - startX;
        track.style.transform =
            `translateX(calc(${currentIndex * 100}% + ${deltaX}px))`;
    });

    window.addEventListener("mouseup", event => {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove("dragging");

        const deltaX = event.clientX - startX;
        const threshold = 50;

        if (deltaX > threshold) {
            goNext();
        } else if (deltaX < -threshold) {
            goPrev();
        } else {
            updateUI();
        }
    });

    updateUI();

}

initCarousel("prophetsCarousel", "prophetsDots");
initCarousel("sunnahCarousel", "sunnahDots");

/* =========================================================
ADHKAR TABS
========================================================= */

const adhkarTabs =
document.getElementById("adhkarTabs");

if (adhkarTabs) {

    adhkarTabs.addEventListener("click", event => {

        const btn = event.target.closest(".adhkar-tab-btn");
        if (!btn) return;

        adhkarTabs
            .querySelectorAll(".adhkar-tab-btn")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        const targetId = btn.getAttribute("data-target");

        document
            .querySelectorAll(".adhkar-panel")
            .forEach(panel => {
                panel.classList.toggle(
                    "active",
                    panel.id === targetId
                );
            });

    });

}

/* =========================================================
NAV ACTIVE LINK
========================================================= */

const navLinks =
document.querySelectorAll(
".nav-link"
);

const sections =
document.querySelectorAll(
"main section[id]"
);

window.addEventListener(
"scroll",
() => {

    let current =
        "home";


    sections.forEach(
        section => {

            const top =
                section.offsetTop -
                130;


            if (
                window.scrollY >=
                top
            ) {

                current =
                    section.id;

            }

        }
    );


    navLinks.forEach(link => {

        link.classList.remove(
            "active"
        );


        if (
            link.getAttribute(
                "href"
            ) === `#${current}`
        ) {

            link.classList.add(
                "active"
            );

        }

    });

}

);

/* =========================================================
INITIALIZE
========================================================= */

/* =========================================================
   تجهيز مسبق لبيانات الـ API + تسريع بدء التلاوة
   =========================================================
   قبل كده، أول أمر صوتي في الجلسة كان لازم يستنى:
     1) قائمة القراء من mp3quran
     2) قائمة القراءات اللي عندها توقيتات آيات
     3) توقيتات السورة نفسها
   وكل دي طلبات شبكة بتتعمل *بعد* ما المستخدم يخلص كلام،
   فكان بيقعد ثواني قدام شاشة "جاري تجهيز الصوت...".

   دلوقتي:
     - بنحمّل (1) و (2) في الخلفية أول ما التطبيق يفتح،
       وبنخزنهم كمان في localStorage فيوم كامل.
     - وبنبدأ نجهّز رابط الصوت والتوقيتات والمستخدم *لسه*
       بيتكلم (من النتائج المبدئية للتعرف على الصوت).
========================================================= */

/*
    أقصى وقت استنى للتوقيتات قبل ما نبدأ الصوت على أي حال.
    في الحالة الطبيعية التوقيتات بتكون متحملة مسبقًا فبترجع
    فورًا ومش بنستنى ولا جزء من الثانية.
*/
const AYAH_TIMING_MAX_WAIT_MS = 1200;

const API_DATA_CACHE_KEY = "noorTelawaApiCache_v1";
const API_DATA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;


function readApiDataCache() {

    try {

        const raw =
            localStorage.getItem(API_DATA_CACHE_KEY);

        if (!raw) {
            return null;
        }

        const parsed =
            JSON.parse(raw);

        if (
            !parsed ||
            !parsed.savedAt ||
            (Date.now() - parsed.savedAt) > API_DATA_CACHE_TTL_MS
        ) {
            return null;
        }

        return parsed;

    } catch (error) {
        return null;
    }

}


function writeApiDataCache(patch) {

    try {

        const current =
            readApiDataCache() || {};

        localStorage.setItem(
            API_DATA_CACHE_KEY,
            JSON.stringify(
                Object.assign(
                    {},
                    current,
                    patch,
                    { savedAt: Date.now() }
                )
            )
        );

    } catch (error) {
        /* التخزين ممتلئ أو مقفول - مش مشكلة */
    }

}


async function prewarmApiData() {

    /*
        الأول: أي حاجة متخزنة من تشغيلة سابقة تتحط في
        الذاكرة فورًا، فأول أمر صوتي يشتغل من غير أي انتظار.
    */
    const cached =
        readApiDataCache();

    if (cached) {

        if (
            !apiReaders &&
            Array.isArray(cached.reciters) &&
            cached.reciters.length
        ) {
            apiReaders = cached.reciters;
        }

        if (
            !ayahTimingReadsCache &&
            Array.isArray(cached.timingReads) &&
            cached.timingReads.length
        ) {
            ayahTimingReadsCache = cached.timingReads;
        }

    }


    /*
        وبعدين بنحدّث من النت في الخلفية (من غير ما نعطل
        أي حاجة في الواجهة).
    */
    try {

        const reciters =
            await loadApiReaders();

        if (
            Array.isArray(reciters) &&
            reciters.length
        ) {
            writeApiDataCache({ reciters: reciters });
        }

    } catch (error) {
        /* من غير نت - هنستخدم المخزن */
    }


    try {

        if (!ayahTimingReadsCache) {

            const response =
                await fetch(`${AYAH_TIMING_API}/reads`);

            if (response.ok) {

                const reads =
                    await response.json();

                if (
                    Array.isArray(reads) &&
                    reads.length
                ) {

                    ayahTimingReadsCache = reads;

                    writeApiDataCache({ timingReads: reads });

                }

            }

        } else {

            writeApiDataCache({
                timingReads: ayahTimingReadsCache
            });

        }

    } catch (error) {
        /* من غير نت - مش مشكلة */
    }

}


/* =========================================================
   تجهيز التلاوة والمستخدم لسه بيتكلم
========================================================= */

let voiceSettleTimer = null;
let lastPrewarmKey = null;
let lastInterimTranscript = "";

/*
    آخر نص اتسمع بشكل مبدئي، وهل الأمر اتنفذ ولا لأ.
    بنستخدمهم كشبكة أمان في recognition.onend.
*/
let pendingInterimCommand = null;
let voiceCommandExecuted = false;


function clearVoiceSettleTimer() {

    if (voiceSettleTimer) {

        clearTimeout(voiceSettleTimer);

        voiceSettleTimer = null;

    }

}


function resetVoicePrewarmState() {

    clearVoiceSettleTimer();

    lastPrewarmKey = null;

    lastInterimTranscript = "";

    pendingInterimCommand = null;

    voiceCommandExecuted = false;

}


/*
    كلمات لو الجملة وقفت عندها يبقى المستخدم أكيد لسه
    هيكمل (مثلاً: "الفاتحة بصوت ماهر من"). في الحالة دي
    مبنوقفش الاستماع بدري.
*/
const VOICE_TRAILING_WORDS = [
    "من",
    "الى",
    "إلى",
    "و",
    "ب",
    "بصوت",
    "الشيخ",
    "للشيخ",
    "سورة",
    "اية",
    "آية",
    "الاية",
    "الآية",
    "رواية",
    "برواية",
    "حتى",
    "لحد",
    "لغاية"
];


function transcriptLooksComplete(text) {

    const words =
        normalizeText(text)
            .trim()
            .split(/\s+/);

    const lastWord =
        words[words.length - 1] || "";

    if (!lastWord) {
        return false;
    }

    return !VOICE_TRAILING_WORDS.includes(lastWord);

}


/*
    بنبدأ نجيب رابط الصوت وتوقيتات الآيات دلوقتي حالاً،
    عشان لما المستخدم يخلص كلام يبقى كل حاجة جاهزة والصوت
    يبدأ على طول.
*/
function prewarmPlayback(reader, surah) {

    if (!reader || !surah) {
        return;
    }

    const key =
        `${reader.id}|${surah.id}` +
        `|${selectedRecitationStyle || ""}` +
        `|${selectedRiwaya || ""}`;

    if (key === lastPrewarmKey) {
        return;
    }

    lastPrewarmKey = key;

    getAudioUrl(
        reader,
        surah,
        selectedRecitationStyle,
        selectedRiwaya
    ).catch(() => {});

    loadAyahTimings(
        reader,
        surah
    ).catch(() => {});

}


function handleInterimTranscript(text) {

    if (text === lastInterimTranscript) {
        return;
    }

    lastInterimTranscript = text;

    clearVoiceSettleTimer();


    let parsed = null;

    try {

        parsed =
            parseVoiceCommand(text);

    } catch (error) {
        return;
    }


    if (
        !parsed ||
        !parsed.reader ||
        !parsed.surah
    ) {
        return;
    }


    /* جهّز الصوت والتوقيتات دلوقتي */
    prewarmPlayback(
        parsed.reader,
        parsed.surah
    );


    if (!transcriptLooksComplete(text)) {
        return;
    }


    /*
        الجملة باينة إنها كملت ومعانا شيخ وسورة. بنستنى
        نص ثانية بس (لو المستخدم هيكمل كلام هتتلغي) وبعدين
        نوقف الاستماع بنفسنا بدل ما نستنى المتصفح يكتشف
        السكوت - وده كان بياخد ثواني.
    */
    pendingInterimCommand = text;

    voiceSettleTimer = setTimeout(() => {

        voiceSettleTimer = null;

        try {

            if (recognition) {
                recognition.stop();
            }

        } catch (error) {
            /* كان واقف بالفعل */
        }

    }, 550);

}


/* =========================================================
   ضبط مدة الملف الصوتي (عشان شريط التقديم يشتغل مع كل الشيوخ)
   =========================================================
   بعض سيرفرات التلاوة بتبعت ملفات mp3 من غير Content-Length
   أو من غير هيدر مدة سليم، فالمتصفح بيقول إن المدة = Infinity
   ووقتها شريط التقديم بيبقى ميت تمامًا.

   الحيلة المعروفة: نطلب موضع كبير جدًا في الملف، فالمتصفح
   يضطر يحسب المدة الحقيقية ويرجّعها، وبعدين نرجّع المؤشر
   لمكانه الأصلي.
========================================================= */

let durationFixInProgress = false;


function resolveInfiniteAudioDuration() {

    if (durationFixInProgress) {
        return;
    }

    if (audio.duration !== Infinity) {
        return;
    }

    durationFixInProgress = true;

    const wantedTime =
        Number.isFinite(audio.currentTime)
            ? audio.currentTime
            : 0;


    const onDurationKnown =
        () => {

            if (audio.duration === Infinity) {
                return;
            }

            audio.removeEventListener(
                "durationchange",
                onDurationKnown
            );

            try {

                audio.currentTime = wantedTime;

            } catch (error) {
                /* مش مشكلة */
            }

            durationFixInProgress = false;

            updatePlayerProgress();

        };


    audio.addEventListener(
        "durationchange",
        onDurationKnown
    );


    try {

        audio.currentTime = 1e101;

    } catch (error) {

        audio.removeEventListener(
            "durationchange",
            onDurationKnown
        );

        durationFixInProgress = false;

    }

}


audio.addEventListener(
    "loadedmetadata",
    resolveInfiniteAudioDuration
);

audio.addEventListener(
    "durationchange",
    updatePlayerProgress
);

audio.addEventListener(
    "progress",
    updatePlayerProgress
);


/*
    الشريط بيتقفل لوحده لو الملف ده فعلاً مش بيدعم التقديم،
    بدل ما المستخدم يفضل يسحبه ومفيش حاجة بتحصل.
*/
function updateSeekAvailability() {

    if (!playerSeek) {
        return;
    }

    const canSeek =
        Number.isFinite(audio.duration) &&
        audio.duration > 0;

    playerSeek.disabled =
        !canSeek;

    playerSeek.title =
        canSeek
            ? "اسحب للتقديم أو التأخير"
            : "جاري تحميل مدة التلاوة...";

}


audio.addEventListener("loadedmetadata", updateSeekAvailability);
audio.addEventListener("durationchange", updateSeekAvailability);
audio.addEventListener("emptied", updateSeekAvailability);


/* =========================================================
   استكمال آخر جلسة (المصحف + السورة + الآية + الشيخ)
   =========================================================
   الهدف: لما المستخدم يقفل التطبيق وهو بيقرا سورة في المصحف
   ويرجع يفتحه تاني، يلاقي كل حاجة زي ما سابها بالظبط:
   المصحف مفتوح على نفس السورة، الشاشة عند نفس الآية، ونفس
   الشيخ متختار وجاهز يكمل من نفس اللحظة بضغطة ▶ واحدة.

   ملحوظة: المتصفحات مش بتسمح بتشغيل صوت تلقائي من غير ما
   المستخدم يدوس، فبنجهّز كل حاجة ونسيبه هو اللي يدوس تشغيل.
========================================================= */

const LAST_SESSION_KEY = "noorTelawaLastSession_v1";

let restoringLastSession = false;
let lastSessionSaveTimer = null;


function getTopVisibleAyahNumber() {

    if (!mushafPage) {
        return null;
    }

    const ayahElements =
        mushafPage.querySelectorAll(".ayah");

    if (!ayahElements.length) {
        return null;
    }

    let bestNumber = null;
    let bestDistance = Infinity;

    ayahElements.forEach(element => {

        const rect =
            element.getBoundingClientRect();

        /*
            بندور على أقرب آية لأعلى الشاشة (مع هامش بسيط
            تحت شريط التنقل العلوي).
        */
        const distance =
            Math.abs(rect.top - 140);

        if (distance < bestDistance) {

            bestDistance = distance;

            bestNumber =
                Number(element.dataset.number) || null;

        }

    });

    return bestNumber;

}


function saveLastSession() {

    if (restoringLastSession) {
        return;
    }

    try {

        if (!selectedSurah) {
            return;
        }

        const mushafIsOpen =
            Boolean(
                mushafPage &&
                mushafPage.querySelector(".ayah")
            );

        const state = {

            readerId:
                selectedReader
                    ? selectedReader.id
                    : null,

            surahId:
                selectedSurah.id,

            ayah:
                selectedAyah || null,

            ayahEnd:
                selectedAyahEnd || null,

            style:
                selectedRecitationStyle || null,

            riwaya:
                selectedRiwaya || null,

            time:
                Number.isFinite(audio.currentTime)
                    ? Math.max(0, audio.currentTime)
                    : 0,

            mushafOpen:
                mushafIsOpen,

            /*
                رقم الآية اللي كانت في أعلى الشاشة، عشان
                نرجّع المستخدم لنفس المكان في السورة حتى لو
                مكانش محدد آية معينة للتشغيل.
            */
            scrollAyah:
                mushafIsOpen
                    ? getTopVisibleAyahNumber()
                    : null,

            savedAt:
                Date.now()

        };

        localStorage.setItem(
            LAST_SESSION_KEY,
            JSON.stringify(state)
        );

    } catch (error) {
        /* التخزين مقفول - مش مشكلة */
    }

}


function scheduleLastSessionSave() {

    if (lastSessionSaveTimer) {
        clearTimeout(lastSessionSaveTimer);
    }

    lastSessionSaveTimer =
        setTimeout(() => {

            lastSessionSaveTimer = null;

            saveLastSession();

        }, 700);

}


/*
    بنربط الحفظ بكل حاجة ممكن تغيّر "مكان المستخدم":
    التمرير في المصحف، الدوس على آية، تغيير السورة أو الشيخ،
    تقدم التلاوة، وقفل التطبيق أو تصغيره.
*/
function startLastSessionTracking() {

    let lastTimeSaveAt = 0;

    audio.addEventListener("timeupdate", () => {

        const now = Date.now();

        if (now - lastTimeSaveAt < 3000) {
            return;
        }

        lastTimeSaveAt = now;

        saveLastSession();

    });

    audio.addEventListener("pause", saveLastSession);
    audio.addEventListener("ended", saveLastSession);


    if (mushafPage) {

        mushafPage.addEventListener(
            "click",
            scheduleLastSessionSave
        );

        /*
            أي مرة المصحف يترسم فيها من جديد (فتح سورة من
            أي مكان في التطبيق: قايمة، بحث، أمر صوتي...)
            بنحفظ الحالة الجديدة.
        */
        if (typeof MutationObserver !== "undefined") {

            const observer =
                new MutationObserver(
                    scheduleLastSessionSave
                );

            observer.observe(
                mushafPage,
                { childList: true }
            );

        }

    }


    if (mushafSurahSelect) {

        mushafSurahSelect.addEventListener(
            "change",
            scheduleLastSessionSave
        );

    }

    if (mushafReaderSelect) {

        mushafReaderSelect.addEventListener(
            "change",
            scheduleLastSessionSave
        );

    }


    window.addEventListener(
        "scroll",
        scheduleLastSessionSave,
        { passive: true }
    );


    document.addEventListener(
        "visibilitychange",
        () => {

            if (document.visibilityState === "hidden") {
                saveLastSession();
            }

        }
    );


    window.addEventListener("pagehide", saveLastSession);

}


/*
    بنجهّز الصوت في الخلفية على نفس اللحظة اللي المستخدم
    وقف عندها، من غير ما نشغّله. بكده أول دوسة على ▶ بتكمل
    فورًا بدل ما تبدأ السورة من أولها.
*/
async function prepareRestoredAudio(reader, surah, startTime) {

    try {

        const timingsPromise =
            loadAyahTimings(reader, surah).catch(() => []);

        const audioUrl =
            await getAudioUrl(
                reader,
                surah,
                selectedRecitationStyle,
                selectedRiwaya
            );

        await Promise.race([
            timingsPromise,
            new Promise(resolve =>
                setTimeout(resolve, AYAH_TIMING_MAX_WAIT_MS)
            )
        ]);

        if (!audioUrl) {
            return;
        }

        const finalUrl =
            (currentAyahTimings.length
                ? getTimingAudioUrl(surah)
                : null) ||
            audioUrl;


        /*
            لو المستخدم بدأ يشغّل حاجة تانية بنفسه وإحنا
            لسه بنجهّز، منلمسش الصوت خالص.
        */
        if (audio.src && !audio.paused) {
            return;
        }

        audio.src = finalUrl;
        audio.loop = false;

        await new Promise(resolve => {

            const done = () => {

                audio.removeEventListener("loadedmetadata", done);
                audio.removeEventListener("error", done);

                resolve();

            };

            audio.addEventListener("loadedmetadata", done, { once: true });
            audio.addEventListener("error", done, { once: true });

            /* أمان: ما نستناش للأبد */
            setTimeout(done, 6000);

        });


        if (
            Number.isFinite(audio.duration) &&
            startTime > 0 &&
            startTime < audio.duration - 1
        ) {

            try {

                audio.currentTime = startTime;

            } catch (error) {
                /* مش مشكلة */
            }

        }


        /*
            مهم: بنسجّل إن ده هو المقطع "المحمّل حاليًا"،
            عشان togglePlayPause يكمل من نفس المكان بدل ما
            يعيد تحميل السورة من الأول.
        */
        loadedPlaybackKey =
            buildPlaybackKey(
                reader,
                surah,
                selectedAyah,
                selectedAyahEnd
            );


        updatePlayerProgress();

        updateSeekAvailability();

    } catch (error) {

        console.warn(
            "Restore audio error:",
            error
        );

    }

}


async function restoreLastSession() {

    let state = null;

    try {

        state =
            JSON.parse(
                localStorage.getItem(LAST_SESSION_KEY) || "null"
            );

    } catch (error) {
        state = null;
    }


    if (!state || !state.surahId) {
        return;
    }


    const surah =
        getSurahById(state.surahId);

    if (!surah) {
        return;
    }


    const reader =
        state.readerId
            ? getReaderById(state.readerId)
            : null;


    restoringLastSession = true;


    try {

        if (state.style) {
            selectedRecitationStyle = state.style;
        }

        if (state.riwaya) {
            selectedRiwaya = state.riwaya;
        }


        if (reader) {
            selectReader(reader);
        }


        if (state.mushafOpen) {

            /*
                false عشان منجرّش الصفحة لوحدنا دلوقتي -
                هنعمل التمرير بنفسنا تحت على الآية بالظبط.
            */
            await openMushaf(surah, false);

        } else {

            selectSurah(surah);

        }


        /*
            لازم بعد openMushaf/selectSurah، لأن اختيار سورة
            بيصفّر الآية المحددة.
        */
        setSelectedAyahRange(
            state.ayah || null,
            state.ayahEnd || null
        );


        updatePlayerInfo();

        updatePlayButton();


        if (state.mushafOpen) {

            restoreMushafPosition(
                state.ayah || state.scrollAyah || null
            );

        }

    } finally {

        restoringLastSession = false;

    }


    if (reader) {

        voiceStatus.textContent =
            `آخر مرة كنت في سورة ${surah.name} بصوت ${reader.name} - دوس ▶ للمتابعة`;

        prepareRestoredAudio(
            reader,
            surah,
            Number(state.time) || 0
        );

    }

}


function restoreMushafPosition(ayahNumber) {

    /*
        بنستنى الرسم يخلص فعلاً قبل ما نجرّ الصفحة.
    */
    requestAnimationFrame(() => {

        const mushafSection =
            document.getElementById("mushaf");

        if (!mushafSection) {
            return;
        }


        let target = null;

        if (ayahNumber && mushafPage) {

            target =
                mushafPage.querySelector(
                    `.ayah[data-number="${ayahNumber}"]`
                );

        }


        if (target) {

            target.scrollIntoView({
                behavior: "auto",
                block: "center"
            });


            /*
                لو كانت في آية محددة للتشغيل، نوريها للمستخدم
                بنفس التمييز اللي بيظهر لما يدوس عليها.
            */
            if (
                ayahNumber &&
                Number(selectedAyah) === Number(ayahNumber)
            ) {

                target.classList.add("tap-selected");

                const statusEl =
                    document.getElementById("highlightStatus");

                if (statusEl) {

                    statusEl.textContent =
                        `هيبدأ التشغيل من الآية ${ayahNumber} - دوس زر ▶ تحت`;

                }

            }

            return;

        }


        mushafSection.scrollIntoView({
            behavior: "auto",
            block: "start"
        });

    });

}


function initializeApp() {

renderReaders();

renderSurahs();

renderAllReaders();

populateMushafSelects();

updatePlayerInfo();

updatePlayButton();


/*
    تجهيز بيانات الـ API في الخلفية من أول ثانية، عشان أول
    أمر صوتي ميستناش طلبات شبكة كانت ممكن تتعمل من بدري.
*/
prewarmApiData();


/*
    رجّع المستخدم لآخر حاجة كان واقف عندها (المصحف + السورة
    + الآية + الشيخ + مكان التلاوة).
*/
restoreLastSession();


startLastSessionTracking();


console.log(
    "نور التلاوة initialized"
);

}

initializeApp();