/* =========================================================
   PAGES.JS  —  نور التلاوة
   =========================================================
   الملف ده بيحوّل التطبيق من صفحة واحدة طويلة (كل الأقسام
   تحت بعضها) لتطبيق بصفحات: أول ما تفتحه بتلاقي كل مميزات
   التطبيق قدامك، وأول ما تدوس على أي واحدة فيهم بتتفتح في
   صفحة لوحدها والنافبار فاضل فوق زي ما هو.

   مبدأ الشغل هنا زي features.js بالظبط:
   - مفيش سطر بيغيّر منطق قديم في app.js.
   - كل الكلاسات الجديدة بتبدأ بـ nt-.
   - الأقسام نفسها (الاستماع، المصحف، الإذاعة، الأذكار...)
     زي ما هي بالحرف، إحنا بس بنوري واحد منهم في المرة.
   - الأدوات (السبحة، القبلة، العلامات...) بتتفتح بنفس
     دوالها الموجودة في features.js، لكن جوه صفحة بدل
     الصندوق المنزلق.
========================================================= */

/*
    لازم يتظبط قبل ما features.js يشغّل init() (اللي بيستنى
    DOMContentLoaded)، عشان الزرار العائم مايتبنيش ونكون
    نقلنا الأدوات للنافبار.
*/
window.NT_ROUTER = true;


(function () {

    "use strict";


    /* =====================================================
       بيانات الصفحات
    ===================================================== */

    /*
        دول أقسام التطبيق الأصلية الموجودة في index.html.
        الـ id هنا لازم يطابق الـ id بتاع الـ <section>.
    */
    const MAIN_PAGES = [
        {
            id: "listen",
            icon: "🎧",
            label: "الاستماع",
            desc: "اختار القارئ والسورة أو استخدم الأمر الصوتي"
        },
        {
            id: "mushaf",
            icon: "📖",
            label: "المصحف",
            desc: "اقرأ المصحف واستمع مع تمييز الآية"
        },
        {
            id: "readers",
            icon: "🎙️",
            label: "القراء",
            desc: "كل القراء المتاحين في مكان واحد"
        },
        {
            id: "radio",
            icon: "📻",
            label: "الإذاعة",
            desc: "بث مباشر للقرآن على مدار اليوم"
        },
        {
            id: "prayer-times",
            icon: "🕌",
            label: "مواقيت الصلاة",
            desc: "مواقيت مكانك مع تنبيهات الأذان"
        },
        {
            id: "adhkar",
            icon: "📿",
            label: "الأذكار",
            desc: "أذكار الصباح والمساء والنوم والصلاة"
        },
        {
            id: "videos",
            icon: "📚",
            label: "قصص الأنبياء",
            desc: "قصص الأنبياء عليهم السلام"
        },
        {
            id: "sunnah",
            icon: "🕋",
            label: "سنن النبي",
            desc: "من هدي النبي ﷺ في يومه"
        }
    ];


    /* =====================================================
       عناصر أساسية
    ===================================================== */

    const main = document.querySelector("main");
    const navLinks = document.querySelector(".nav-links");
    const mobileNav = document.getElementById("mobileNav");

    let homeFeaturesSection = null;
    let toolsIndexSection = null;
    let toolPageSection = null;
    let toolHost = null;
    let toolHeadingIcon = null;
    let toolHeadingTitle = null;
    let toolHeadingDesc = null;

    let tasmeeSection = null;
    let tasmeeHost = null;
    let tasmeeMushaf = null;
    let tasmeeLoadedSurahId = null;

    let currentRoute = "";

    let memoSection = null;
    let memoHost = null;
    let memoMushaf = null;

    let wirdSection = null;
    let wirdHost = null;
    let wirdMushaf = null;


    function tools() {

        return (window.NT && window.NT.tools) ? window.NT.tools : [];

    }


    /*
        بعض الأدوات ليها صفحة خاصة بشكل مختلف عن باقي الأدوات
        (التسميع الذكي ووضع الحفظ، كل واحد فيهم عنده مصحفه
        الخاص)، فمساراتهم مختلفة عن "tool-<key>" العادي.
    */
    function toolRoute(key) {

        if (key === "tasmee") {
            return "tasmee";
        }

        if (key === "memorization") {
            return "memorize";
        }

        if (key === "wird") {
            return "wird";
        }

        return "tool-" + key;

    }


    function esc(text) {

        return typeof escapeHtml === "function"
            ? escapeHtml(text)
            : String(text == null ? "" : text);

    }


    function toast(message) {

        try {

            if (typeof showToast === "function") {
                showToast(message);
            }

        } catch (error) { /* */ }

    }


    /* =====================================================
       بناء صفحة "الرئيسية": كل المميزات قدامك
    ===================================================== */

    function featureCardHtml(route, icon, label, desc) {

        return `
            <a class="nt-feature" href="#${route}">
                <span class="nt-feature-icon">${icon}</span>
                <span class="nt-feature-text">
                    <strong>${esc(label)}</strong>
                    <small>${esc(desc)}</small>
                </span>
            </a>
        `;

    }


    function toolsGridHtml() {

        return tools().map(tool => featureCardHtml(
            toolRoute(tool.key),
            tool.icon,
            tool.label,
            tool.desc || ""
        )).join("");

    }


    function buildHomeFeatures() {

        const home = document.getElementById("home");

        if (!home || !main) {
            return;
        }

        homeFeaturesSection = document.createElement("section");

        homeFeaturesSection.id = "ntHomeFeatures";
        homeFeaturesSection.className = "nt-home-features";

        homeFeaturesSection.innerHTML = `
            <div class="container">

                <div class="nt-group">
                    <div class="nt-grid">
                        ${MAIN_PAGES.map(page => featureCardHtml(
                            page.id,
                            page.icon,
                            page.label,
                            page.desc
                        )).join("")}
                    </div>
                </div>

                <div class="nt-group">
                    <div class="nt-grid" id="ntHomeToolsGrid">
                        ${toolsGridHtml()}
                    </div>
                </div>

            </div>
        `;

        home.insertAdjacentElement("afterend", homeFeaturesSection);

    }


    /* =====================================================
       صفحة فهرس الأدوات (اللي بتتفتح من النافبار)
    ===================================================== */

    function buildToolsIndex() {

        toolsIndexSection = document.createElement("section");

        toolsIndexSection.id = "ntToolsIndex";
        toolsIndexSection.className = "section";

        toolsIndexSection.innerHTML = `
            <div class="container">

                <div class="nt-back-row">
                    <a class="nt-back-btn" href="#home">‹ الرئيسية</a>
                </div>

                <div class="section-heading">
                    <span>🧰</span>
                    <div>
                        <h2>الأدوات</h2>
                        <p>اختار أداة وهتتفتح لك في صفحة لوحدها</p>
                    </div>
                </div>

                <div class="nt-grid" id="ntToolsIndexGrid">
                    ${toolsGridHtml()}
                </div>

            </div>
        `;

        main.appendChild(toolsIndexSection);

    }


    /* =====================================================
       صفحة الأداة الواحدة
    ===================================================== */

    function buildToolPage() {

        toolPageSection = document.createElement("section");

        toolPageSection.id = "ntToolPage";
        toolPageSection.className = "section";

        toolPageSection.innerHTML = `
            <div class="container">

                <div class="nt-back-row">
                    <a class="nt-back-btn" href="#tools">‹ كل الأدوات</a>
                </div>

                <div class="section-heading">
                    <span id="ntToolIcon">🧰</span>
                    <div>
                        <h2 id="ntToolTitle">أداة</h2>
                        <p id="ntToolDesc"></p>
                    </div>
                </div>

                <div id="ntToolHost"></div>

            </div>
        `;

        main.appendChild(toolPageSection);

        toolHost = document.getElementById("ntToolHost");
        toolHeadingIcon = document.getElementById("ntToolIcon");
        toolHeadingTitle = document.getElementById("ntToolTitle");
        toolHeadingDesc = document.getElementById("ntToolDesc");


        /*
            نفس تفويض features.js: أي زرار جواه data-nt-open-ayah
            بيفتح الآية في المصحف.
        */
        toolHost.addEventListener("click", async event => {

            const button =
                event.target.closest("[data-nt-open-ayah]");

            if (!button) {
                return;
            }

            const parts =
                button.dataset.ntOpenAyah.split(":").map(Number);

            const surah =
                typeof getSurahById === "function"
                    ? getSurahById(parts[0])
                    : null;

            if (!surah) {
                return;
            }

            await openMushaf(surah, true);

            if (typeof setSelectedAyah === "function") {
                setSelectedAyah(parts[1]);
            }

        });

    }


    /* =====================================================
       صفحة التسميع الذكي (مصحف مستقل جواها)
    ===================================================== */

    function buildTasmeePage() {

        tasmeeSection = document.createElement("section");

        tasmeeSection.id = "ntTasmeePage";
        tasmeeSection.className = "section mushaf-section";

        tasmeeSection.innerHTML = `
            <div class="container">

                <div class="nt-back-row">
                    <a class="nt-back-btn" href="#home">‹ الرئيسية</a>
                </div>

                <div class="section-heading">
                    <span>🎙️</span>
                    <div>
                        <h2>التسميع الذكي</h2>
                        <p>سمّع من حفظك، وهنوقفك عند أي غلط لحد ما تظبطه</p>
                    </div>
                </div>

                <div class="nt-tasmee-layout">

                    <div id="ntTasmeeHost"></div>

                    <div class="mushaf-page" id="ntTasmeeMushaf">
                        <div class="nt-tasmee-hint">
                            اختار السورة من الناحية التانية وهتظهر هنا
                        </div>
                    </div>

                </div>

            </div>
        `;

        main.appendChild(tasmeeSection);

        tasmeeHost = document.getElementById("ntTasmeeHost");
        tasmeeMushaf = document.getElementById("ntTasmeeMushaf");

    }


    function tasmeeSurahOptions(selectedId) {

        return surahs.map(item => `
            <option value="${item.id}" ${
                Number(item.id) === Number(selectedId) ? "selected" : ""
            }>
                ${item.id}. ${esc(item.name)}
            </option>
        `).join("");

    }


    function renderTasmeeSetup() {

        if (!tasmeeHost) {
            return;
        }

        /* كل رسم التسميع الحي هيروح جوه الصفحة دي */
        window.NT.setPageHost(tasmeeHost);
        window.NT.onTasmeeExit(renderTasmeeSetup);

        if (!window.NT.speechSupported()) {

            tasmeeHost.innerHTML = `
                <div class="nt-card">
                    <h4>مش متاح على المتصفح ده</h4>
                    <div class="nt-muted">
                        التعرف على الصوت مش مدعوم هنا. جرّب كروم
                        على الأندرويد أو على الكمبيوتر.
                    </div>
                </div>
            `;

            return;

        }

        const current =
            tasmeeLoadedSurahId ||
            (typeof selectedSurah !== "undefined" && selectedSurah
                ? selectedSurah.id
                : 1);

        const surah = getSurahById(current);

        tasmeeHost.innerHTML = `
            <div class="nt-card">
                <h4>سمّع من أنهي سورة؟</h4>

                <div class="nt-muted" style="margin-bottom:10px;">
                    اختار السورة وهتظهر لك في المصحف جنبك، وبعدين
                    قول هتبدأ من آية كام.
                </div>

                <select class="nt-select" id="ntTasmeePickSurah">
                    ${tasmeeSurahOptions(current)}
                </select>

                <div class="nt-row" style="margin-top:12px;">
                    <span class="nt-muted">ابدأ من آية رقم</span>
                    <input class="nt-input" style="max-width:100px;"
                           type="number" id="ntTasmeePickAyah"
                           min="1" max="${surah ? surah.ayahs : 286}" value="1">
                </div>

                <div class="nt-muted" id="ntTasmeeSetupStatus"
                     style="margin-top:10px;"></div>

                <div class="nt-row" style="margin-top:12px;">
                    <button class="nt-btn nt-primary" id="ntTasmeeBegin">
                        ابدأ التسميع 🎙️
                    </button>
                </div>
            </div>

            <div class="nt-card">
                <h4>مهم تعرفه</h4>
                <div class="nt-muted">
                    البسملة مش محسوبة مع الآية الأولى هنا، فمش هتضطر
                    تقولها قبل ما تبدأ. ولو غلطت في حرف أو في مقدار
                    مد، التنبيه هيفضل قدامك لحد ما تنطق الكلمة صح.
                </div>
            </div>
        `;

        const surahSelect = document.getElementById("ntTasmeePickSurah");
        const ayahInput = document.getElementById("ntTasmeePickAyah");
        const beginBtn = document.getElementById("ntTasmeeBegin");

        surahSelect.addEventListener("change", () => {

            const picked = getSurahById(Number(surahSelect.value));

            if (picked) {

                ayahInput.max = picked.ayahs;
                ayahInput.value = 1;

                loadTasmeeSurah(picked);

            }

        });

        beginBtn.addEventListener("click", async () => {

            const picked = getSurahById(Number(surahSelect.value));

            if (!picked) {
                return;
            }

            const from = Number(ayahInput.value) || 1;

            setSetupStatus("جاري تجهيز السورة...");

            const ready = await loadTasmeeSurah(picked);

            if (!ready) {

                setSetupStatus("تعذر تحميل السورة، اتأكد من النت وجرب تاني");

                return;

            }

            window.NT.startTasmee(from, picked);

        });


        /* لو السورة لسه مفتوحتش، نفتحها على طول */
        if (Number(tasmeeLoadedSurahId) !== Number(current)) {

            const picked = getSurahById(current);

            if (picked) {
                loadTasmeeSurah(picked);
            }

        }

    }


    function setSetupStatus(text) {

        const status =
            document.getElementById("ntTasmeeSetupStatus");

        if (status) {
            status.textContent = text || "";
        }

    }


    async function loadTasmeeSurah(surah) {

        if (!tasmeeMushaf || !surah) {
            return false;
        }

        if (Number(tasmeeLoadedSurahId) === Number(surah.id)) {
            return true;
        }

        tasmeeMushaf.innerHTML = `
            <div class="nt-tasmee-hint">جاري تحميل سورة ${esc(surah.name)}...</div>
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

            renderTasmeeMushaf(surah, ayahs);

            tasmeeLoadedSurahId = surah.id;

            setSetupStatus("");

            return true;

        } catch (error) {

            tasmeeMushaf.innerHTML = `
                <div class="nt-tasmee-hint">
                    تعذر تحميل السورة، اتأكد من الاتصال وجرب تاني
                </div>
            `;

            tasmeeLoadedSurahId = null;

            return false;

        }

    }


    function renderTasmeeMushaf(surah, ayahs) {

        tasmeeMushaf.innerHTML = "";
        tasmeeMushaf.classList.remove("nt-hide-text");

        /*
            البسملة بتتعرض كسطر مستقل بره الآيات (زي المصحف
            الورقي)، ومش بتتحسب ضمن كلام الآية الأولى، عشان
            المستخدم ميبقاش مجبور يقولها وهو بيسمّع. سورة
            الفاتحة استثناء لأن البسملة فيها آية بذاتها،
            وسورة التوبة مفيهاش بسملة أصلاً.
        */
        if (surah.id !== 1 && surah.id !== 9) {

            const basmala = document.createElement("div");

            basmala.className = "basmala";

            basmala.textContent = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ";

            tasmeeMushaf.appendChild(basmala);

        }

        const container = document.createElement("div");

        container.className = "ayahs";
        container.dataset.surah = surah.id;
        container.dataset.surahName = surah.name;

        ayahs.forEach(ayah => {

            const text =
                surah.id === 1
                    ? String(ayah.text || "")
                    : window.NT.stripBasmala(String(ayah.text || ""));

            const span = document.createElement("span");

            span.className = "ayah";
            span.dataset.number = ayah.numberInSurah;
            span.dataset.page = ayah.page || "";
            span.dataset.juz = ayah.juz || "";
            if (ayah.sajda) {
                span.dataset.sajda = "1";
            }

            span.innerHTML = `
                ${esc(text.trim())}
                <span class="ayah-number">${ayah.numberInSurah}</span>
            `;

            /* الدوس على آية بيخليها نقطة البداية */
            span.addEventListener("click", () => {

                if (window.NT.isTasmeeActive()) {
                    return;
                }

                const input =
                    document.getElementById("ntTasmeePickAyah");

                if (input) {

                    input.value = ayah.numberInSurah;

                    setSetupStatus(
                        `هتبدأ من الآية ${ayah.numberInSurah}`
                    );

                }

                tasmeeMushaf
                    .querySelectorAll(".ayah.tap-selected")
                    .forEach(item => item.classList.remove("tap-selected"));

                span.classList.add("tap-selected");

            });

            container.appendChild(span);

        });

        tasmeeMushaf.appendChild(container);

    }


    /* =====================================================
       صفحة وضع الحفظ (مصحف مستقل جواها هي كمان)
       =====================================================
       عكس التسميع (شمال/يمين)، هنا لوحة التحكم فوق والمصحف
       تحت، ومفيش أي علاقة بمصحف باقي التطبيق: اختيار السورة
       هنا بيجيب نصها لوحده في حاوية خاصة بالصفحة دي بس.
    ===================================================== */

    function buildMemoPage() {

        memoSection = document.createElement("section");

        memoSection.id = "ntMemoPage";
        memoSection.className = "section mushaf-section";

        memoSection.innerHTML = `
            <div class="container">

                <div class="nt-back-row">
                    <a class="nt-back-btn" href="#home">‹ الرئيسية</a>
                </div>

                <div class="section-heading">
                    <span>🧠</span>
                    <div>
                        <h2>وضع الحفظ</h2>
                        <p>يكرر كل آية بالعدد اللي تختاره، وبعدين ينتقل للي بعدها لوحده</p>
                    </div>
                </div>

                <div id="ntMemoHost"></div>

                <div class="mushaf-page" id="ntMemoMushaf" style="margin-top:18px;">
                    <div class="nt-tasmee-hint">
                        اختار السورة فوق وهتظهر لك هنا
                    </div>
                </div>

            </div>
        `;

        main.appendChild(memoSection);

        memoHost = document.getElementById("ntMemoHost");
        memoMushaf = document.getElementById("ntMemoMushaf");

    }


    /* =====================================================
       صفحة الورد اليومي (مصحف مستقل جواها هي كمان)
       =====================================================
       نفس فكرة صفحة الحفظ بالظبط: لوحة التحكم فوق، والمصحف
       تحت في حاوية خاصة بالصفحة دي بس، فمفيش أي علاقة بينه
       وبين مصحف صفحة "المصحف" أو مصحف صفحة "وضع الحفظ".
    ===================================================== */

    function buildWirdPage() {

        wirdSection = document.createElement("section");

        wirdSection.id = "ntWirdPage";
        wirdSection.className = "section mushaf-section";

        wirdSection.innerHTML = `
            <div class="container">

                <div class="nt-back-row">
                    <a class="nt-back-btn" href="#home">‹ الرئيسية</a>
                </div>

                <div class="section-heading">
                    <span>🗓️</span>
                    <div>
                        <h2>الورد اليومي</h2>
                        <p>خطة ختمة بعدد أيام أنت اللي بتحدده</p>
                    </div>
                </div>

                <div id="ntWirdHost"></div>

                <div class="mushaf-page" id="ntWirdMushaf" style="margin-top:18px;">
                    <div class="nt-tasmee-hint">
                        هيظهر هنا المصحف الخاص بصفحة الورد
                    </div>
                </div>

            </div>
        `;

        main.appendChild(wirdSection);

        wirdHost = document.getElementById("ntWirdHost");
        wirdMushaf = document.getElementById("ntWirdMushaf");

    }


    /* =====================================================
       النافبار: إضافة الأدوات
    ===================================================== */

    function buildNav() {

        if (navLinks) {

            const link = document.createElement("a");

            link.href = "#tools";
            link.className = "nav-link";

            link.innerHTML = "<span>🧰</span> الأدوات";

            navLinks.appendChild(link);

        }


        if (mobileNav) {

            const label = document.createElement("div");

            label.className = "nt-nav-group-label";

            label.textContent = "الأدوات 🧰";

            mobileNav.appendChild(label);


            tools().forEach(tool => {

                const item = document.createElement("a");

                item.href = "#" + toolRoute(tool.key);

                item.textContent = `${tool.icon} ${tool.label}`;

                mobileNav.appendChild(item);

            });

        }

    }


    function closeMobileNav() {

        if (mobileNav) {
            mobileNav.classList.remove("open");
        }

    }


    /* =====================================================
       الراوتر
    ===================================================== */

    function sectionsFor(route) {

        if (route === "home") {

            return [
                document.getElementById("home"),
                homeFeaturesSection
            ].filter(Boolean);

        }

        if (route === "tools") {
            return [toolsIndexSection];
        }

        if (route === "tasmee") {
            return [tasmeeSection];
        }

        if (route === "memorize") {
            return [memoSection];
        }

        if (route === "wird") {
            return [wirdSection];
        }

        if (route.indexOf("tool-") === 0) {
            return [toolPageSection];
        }

        const section = document.getElementById(route);

        if (section && section.parentElement === main) {
            return [section];
        }

        return null;

    }


    function updateNavActive(route) {

        const target =
            route === "tasmee" || route === "memorize" || route === "wird" || route.indexOf("tool-") === 0
                ? "tools"
                : route;

        document.querySelectorAll(".nav-link").forEach(link => {

            link.classList.toggle(
                "active",
                link.getAttribute("href") === "#" + target
            );

        });

    }


    function go(route, keepScroll) {

        const clean = String(route || "home").replace(/^#/, "") || "home";

        let targets = sectionsFor(clean);

        if (!targets || !targets.length) {

            targets = sectionsFor("home");

        }


        /* تنضيف الصفحة اللي كنا فيها */
        if (
            currentRoute &&
            currentRoute !== clean &&
            (
                currentRoute === "tasmee" ||
                currentRoute === "memorize" ||
                currentRoute === "wird" ||
                currentRoute.indexOf("tool-") === 0
            )
        ) {

            try {

                window.NT.leavePage();

            } catch (error) { /* */ }

        }


        currentRoute = clean;

        document.body.dataset.ntPage = clean;


        main.querySelectorAll(":scope > section").forEach(section => {

            section.classList.toggle(
                "nt-page-active",
                targets.indexOf(section) !== -1
            );

        });


        if (clean.indexOf("tool-") === 0) {

            openToolPage(clean.slice(5));

        }

        if (clean === "tasmee") {

            renderTasmeeSetup();

        }

        if (clean === "memorize") {

            window.NT.renderMemorization(memoHost, memoMushaf);

        }

        if (clean === "wird") {

            window.NT.renderWird(wirdHost, wirdMushaf);

        }


        updateNavActive(clean);

        closeMobileNav();

        if (!keepScroll) {

            window.scrollTo({ top: 0, behavior: "auto" });

        }

    }


    function openToolPage(key) {

        const tool = window.NT.getTool(key);

        if (!tool || !toolHost) {

            go("tools");

            return;

        }

        toolHeadingIcon.textContent = tool.icon;
        toolHeadingTitle.textContent = tool.label;
        toolHeadingDesc.textContent = tool.desc || "";

        toolHost.innerHTML = "";

        try {

            window.NT.runTool(key, toolHost);

        } catch (error) {

            toolHost.innerHTML = `
                <div class="nt-card">
                    <h4>حصلت مشكلة</h4>
                    <div class="nt-muted">
                        الأداة دي مقدرتش تفتح دلوقتي، جرب تاني.
                    </div>
                </div>
            `;

        }

    }


    /* =====================================================
       فتح المصحف من أي مكان = روح لصفحة المصحف
    ===================================================== */

    function wrapOpenMushaf() {

        if (typeof window.openMushaf !== "function") {
            return;
        }

        const original = window.openMushaf;

        window.openMushaf = function (surah, scrollToMushaf) {

            if (scrollToMushaf !== false) {

                go("mushaf");

            }

            return original.call(this, surah, false);

        };

    }


    /* =====================================================
       تشغيل
    ===================================================== */

    function init() {

        if (!main) {
            return;
        }

        /* الزرار العائم بقى مش محتاجينه: الأدوات في النافبار */
        const fab = document.querySelector(".nt-fab");

        if (fab) {
            fab.remove();
        }

        document.body.classList.add("nt-router");

        buildHomeFeatures();
        buildToolsIndex();
        buildToolPage();
        buildTasmeePage();
        buildMemoPage();
        buildWirdPage();
        buildNav();
        wrapOpenMushaf();


        /* أي لينك داخلي بيشتغل كأنه انتقال بين صفحات */
        document.addEventListener("click", event => {

            const link = event.target.closest('a[href^="#"]');

            if (!link) {
                return;
            }

            const href = link.getAttribute("href");

            if (!href || href === "#") {
                return;
            }

            const route = href.slice(1);

            if (!sectionsFor(route)) {
                return;
            }

            event.preventDefault();

            if (("#" + currentRoute) === href) {

                window.scrollTo({ top: 0, behavior: "smooth" });

                closeMobileNav();

                return;

            }

            if (location.hash !== href) {

                history.pushState(null, "", href);

            }

            go(route);

        });


        window.addEventListener("hashchange", () => {

            go(location.hash || "#home");

        });

        window.addEventListener("popstate", () => {

            go(location.hash || "#home");

        });


        /*
            app.js عنده مستمع scroll بيحدد اللينك النشط على أساس
            إن كل الأقسام تحت بعضها. دلوقتي فيه قسم واحد ظاهر،
            فبنرجّع التحديد الصح بعده على طول (المستمع بتاعنا
            بيتسجل بعده فبيشتغل بعده).
        */
        window.addEventListener("scroll", () => {

            updateNavActive(currentRoute);

        });


        go(location.hash || "#home");

    }


    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", init);

    } else {

        init();

    }

})();