/* =========================================================
   MUSHAF-PAGER.JS
   =========================================================
   بيحوّل أي مصحف في التطبيق (المصحف الرئيسي، التسميع، وضع
   الحفظ، الورد) من سورة طويلة بتتمرر لتحت، لصفحات مصحف
   حقيقية جنب بعض: بتسحب يمين/شمال وتقلّب الصفحة.

   - كل صفحة فيها نفس الآيات اللي في نفس صفحة المصحف المدني
     (604 صفحة)، لأن رقم الصفحة جاي من نفس API الآيات.
   - علامة سجدة التلاوة: ۩ جوه نص الآية + مربع "سجدة" في
     هامش الصفحة زي المصحف المطبوع.

   الملف إضافي: مبيغيّرش أي كلاس قديم، ومبيشتغلش غير على
   .ayahs اللي عليها data-surah (الرسّامين بيحطوها).
========================================================= */

(function () {

    "use strict";

    const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
    const SAJDA_SIGN = "\u06E9";

    const reduceMotion =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function toArabic(n) {
        return String(n).replace(/\d/g, d => AR_DIGITS[d]);
    }

    function el(tag, className) {
        const node = document.createElement(tag);
        if (className) {
            node.className = className;
        }
        return node;
    }

    function esc(text) {
        const div = document.createElement("div");
        div.textContent = String(text == null ? "" : text);
        return div.innerHTML;
    }


    /* ---------------------------------------------------
       مراقب الأحجام: بيعيد ترتيب علامات السجدة لما حجم
       الصفحة يتغير (دوران الشاشة، تغيير الخط، إلخ)، وبيرجّع
       الصفحة الحالية لما المصحف يظهر تاني بعد ما كان مخفي.
    --------------------------------------------------- */

    const resizeObserver =
        typeof ResizeObserver === "function"
            ? new ResizeObserver(entries => {
                entries.forEach(entry => {
                    const target = entry.target;
                    if (target.classList.contains("nt-pager")) {
                        restoreIndex(target);
                    } else if (target.classList.contains("nt-mpage-inner")) {
                        layoutSajdaTags(target);
                    }
                });
            })
            : null;


    /* ---------------------------------------------------
       علامة السجدة
    --------------------------------------------------- */

    /*
        ۩ جوه نص الآية: لو الـ API رجّعها في النص بنلفّها
        بعنصر عشان نكبّرها ونلوّنها (من غير ما نغيّر النص
        نفسه)، ولو مش موجودة بنضيفها قبل رقم الآية.
    */
    function decorateSajdaSign(ayahSpan) {
        if (ayahSpan.querySelector(".nt-sajda-sign")) {
            return;
        }

        const walker = document.createTreeWalker(
            ayahSpan,
            NodeFilter.SHOW_TEXT
        );

        let node = walker.nextNode();

        while (node) {
            const index = node.nodeValue.indexOf(SAJDA_SIGN);

            if (index !== -1) {
                const after = node.splitText(index);
                after.splitText(1);

                const sign = el("span", "nt-sajda-sign");
                after.parentNode.insertBefore(sign, after);
                sign.appendChild(after);
                return;
            }

            node = walker.nextNode();
        }

        const sign = el("span", "nt-sajda-sign");
        sign.textContent = SAJDA_SIGN;

        const number = ayahSpan.querySelector(".ayah-number");

        if (number) {
            ayahSpan.insertBefore(sign, number);
        } else {
            ayahSpan.appendChild(sign);
        }
    }

    /*
        مربع "سجدة" في هامش الصفحة، على نفس سطر آخر الآية.
        بيتحسب من مكان الآية الفعلي، فبنعيد حسابه كل ما
        الصفحة تتغير.
    */
    function layoutSajdaTags(inner) {
        inner.querySelectorAll(":scope > .nt-sajda-tag").forEach(tag => {
            tag.remove();
        });

        const innerRect = inner.getBoundingClientRect();

        if (!innerRect.width) {
            return;
        }

        inner.querySelectorAll(".ayah[data-sajda], .nt-pv[data-sajda]").forEach(ayah => {
            const rects = ayah.getClientRects();

            if (!rects.length) {
                return;
            }

            const last = rects[rects.length - 1];

            const tag = el("div", "nt-sajda-tag");
            tag.innerHTML =
                `<b>${SAJDA_SIGN}</b><span>سجدة</span>`;
            tag.style.top =
                `${last.top - innerRect.top + last.height / 2}px`;

            inner.appendChild(tag);
        });
    }


    /* ---------------------------------------------------
       مسافة صغيرة بعد المد فوق الحروف اللي مبتتوصلش
    --------------------------------------------------- */

    /*
        علامة المد (ٓ) فوق حرف زي الألف بتتمد ناحية الحرف اللي
        بعده، ولو الحرف ده طويل (زي اللام في "ٱلضَّآلِّينَ")
        العلامة بتلمسه. الحروف دي مبتتوصلش بالحرف اللي بعدها
        (ا د ذ ر ز و)، فنقدر نحط مسافة صغيرة بعدها من غير ما
        نكسر شكل الكلمة. بنلف الحرف بـ span من غير ما نغيّر
        النص نفسه، فالتسميع والبحث مبيتأثروش.
    */
    const MADD_AFTER = new RegExp(
        "([\u0627\u0622\u0623\u0625\u0671\u062F\u0630\u0631\u0632\u0648\u0624]" +
        "[\u064B-\u0652\u0654-\u065F\u0670\u06D6-\u06ED]*" +
        "\u0653" +
        "[\u064B-\u0652\u0654-\u065F\u0670\u06D6-\u06ED]*)" +
        "(?=[\u0621-\u064A\u0671])",
        "g"
    );

    const MADD_ALEF = /\u0622(?=[\u0621-\u064A\u0671])/g;

    function spaceMadd(ayahSpan) {
        const walker = document.createTreeWalker(
            ayahSpan,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    if (node.parentElement.closest(".ayah-number")) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodes = [];
        let node = walker.nextNode();

        while (node) {
            nodes.push(node);
            node = walker.nextNode();
        }

        nodes.forEach(textNode => {
            const text = textNode.nodeValue;

            const hits = [];

            let m;

            MADD_AFTER.lastIndex = 0;
            while ((m = MADD_AFTER.exec(text))) {
                hits.push([m.index, m.index + m[0].length]);
            }

            /* آ المركّبة (U+0622) لوحدها، مع تجنّب التكرار */
            MADD_ALEF.lastIndex = 0;
            while ((m = MADD_ALEF.exec(text))) {
                const start = m.index;
                const end = start + 1;
                if (!hits.some(h => start >= h[0] && start < h[1])) {
                    hits.push([start, end]);
                }
            }

            if (!hits.length) {
                return;
            }

            hits.sort((x, y) => x[0] - y[0]);

            const frag = document.createDocumentFragment();
            let last = 0;

            hits.forEach(([start, end]) => {
                if (start < last) {
                    return;
                }
                if (start > last) {
                    frag.appendChild(
                        document.createTextNode(text.slice(last, start))
                    );
                }
                const wrap = el("span", "nt-madd");
                wrap.textContent = text.slice(start, end);
                frag.appendChild(wrap);
                last = end;
            });

            if (last < text.length) {
                frag.appendChild(document.createTextNode(text.slice(last)));
            }

            textNode.parentNode.replaceChild(frag, textNode);
        });
    }


    /* ---------------------------------------------------
       الانتقال بين السور بالسحب
    --------------------------------------------------- */

    /*
        لما توصل لآخر صفحة في السورة وتكمل سحب، بتظهر أول صفحة
        من السورة اللي بعدها (وبالعكس لو رجعت لقبل أول صفحة
        بتظهر آخر صفحة من السورة اللي قبلها). أول ما تقف عند
        صفحة سورة تانية، بنفتحها بنفس طريقة اختيار السورة من
        القايمة بتاعة المصحف ده، فكل حاجة (العنوان، التشغيل،
        التسميع...) بتتحدث لوحدها. وبعدها تكمل سحب لسورة
        بعدها وهكذا.
    */

    const SELECT_BY_ROOT = {
        mushafPage: "mushafSurahSelect",
        ntTasmeeMushaf: "ntTasmeePickSurah",
        ntMemoMushaf: "ntMemoSurah",
        ntWirdMushaf: "ntWirdPickSurah"
    };

    const ayahsCache = new Map();

    let pendingLanding = null;

    function surahNameOf(id) {
        try {
            if (typeof getSurahById === "function") {
                const surah = getSurahById(id);
                if (surah && surah.name) {
                    return surah.name;
                }
            }
        } catch (error) {
            /* تجاهل */
        }
        return "";
    }

    function fetchSurahAyahs(id) {
        if (id < 1 || id > 114) {
            return Promise.resolve(null);
        }

        if (!ayahsCache.has(id)) {
            const base =
                typeof QURAN_API === "string"
                    ? QURAN_API
                    : "https://api.alquran.cloud/v1/surah";

            ayahsCache.set(
                id,
                fetch(`${base}/${id}/quran-uthmani`)
                    .then(response => (response.ok ? response.json() : null))
                    .then(data => (data && data.data && data.data.ayahs) || null)
                    .catch(() => null)
                    .then(ayahs => {
                        if (!ayahs || !ayahs.length) {
                            ayahsCache.delete(id);
                            return null;
                        }
                        return ayahs;
                    })
            );
        }

        return ayahsCache.get(id);
    }

    /* هل فيه جلسة شغالة (تشغيل/تسميع/حفظ) المفروض منقاطعهاش؟ */
    function isBusy(rootId) {
        try {
            if (rootId === "ntTasmeeMushaf") {
                return !!(window.NT && window.NT.isTasmeeActive());
            }

            if (rootId === "ntMemoMushaf") {
                return !!(
                    window.NT &&
                    window.NT.isMemorizationActive &&
                    window.NT.isMemorizationActive()
                );
            }

            if (rootId === "mushafPage") {
                return typeof audio !== "undefined" && !audio.paused;
            }
        } catch (error) {
            /* تجاهل */
        }

        return false;
    }

    /* صفحة واحدة (بتستخدم للصفحات الحقيقية وصفحات المعاينة) */
    function makePage(info) {
        const page = el("div", "nt-mpage");
        page.dataset.page = info.page;

        const inner = el("div", "nt-mpage-inner");

        const head = el("div", "nt-mpage-head");
        head.innerHTML = `
            <span>سورة ${esc(info.surahName)}</span>
            <span>${info.juz ? "الجزء " + toArabic(info.juz) : ""}</span>
        `;
        inner.appendChild(head);

        if (info.basmala) {
            inner.appendChild(info.basmala);
        }

        const ayahs = el("div", "ayahs");
        ayahs.dataset.ntPaged = "1";

        info.nodes.forEach(node => ayahs.appendChild(node));

        inner.appendChild(ayahs);

        const foot = el("div", "nt-mpage-foot");
        foot.innerHTML = `<span>${toArabic(info.page)}</span>`;
        inner.appendChild(foot);

        page.appendChild(inner);

        if (resizeObserver) {
            resizeObserver.observe(inner);
        }

        return page;
    }

    /*
        which = "next": أول صفحة من السورة (بسملتها فوق).
        which = "prev": آخر صفحة من السورة.
        الآيات هنا class بتاعها nt-pv مش ayah، عشان باقي التطبيق
        (التمييز، التسميع، الاختيار) ميلاقيش آيات تانية غير
        آيات السورة المفتوحة.
    */
    function buildPreviewPage(id, ayahs, which) {
        const pageNo =
            which === "next"
                ? Number(ayahs[0].page)
                : Number(ayahs[ayahs.length - 1].page);

        const part = ayahs.filter(a => Number(a.page) === pageNo);

        const nodes = part.map(a => {
            let text = String(a.text || "");

            if (id !== 1 && window.NT && window.NT.stripBasmala) {
                text = window.NT.stripBasmala(text);
            }

            const span = el("span", "nt-pv");
            span.dataset.number = a.numberInSurah;
            span.innerHTML =
                `${esc(text.trim())} <span class="ayah-number">${a.numberInSurah}</span>`;

            spaceMadd(span);

            if (a.sajda) {
                span.dataset.sajda = "1";
                decorateSajdaSign(span);
            }

            return span;
        });

        let basmala = null;

        if (part[0].numberInSurah === 1 && id !== 1 && id !== 9) {
            basmala = el("div", "basmala");
            basmala.textContent = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ";
        }

        const page = makePage({
            page: pageNo,
            juz: Number(part[0].juz) || 0,
            surahName: surahNameOf(id),
            basmala,
            nodes
        });

        page.dataset.preview = which;
        page.dataset.surah = String(id);

        return page;
    }

    function attachNeighbors(pager, surahId) {
        [["prev", surahId - 1], ["next", surahId + 1]].forEach(([which, id]) => {
            fetchSurahAyahs(id).then(ayahs => {
                if (!ayahs || !pager.isConnected) {
                    return;
                }

                if (pager.querySelector(`:scope > .nt-mpage[data-preview="${which}"]`)) {
                    return;
                }

                const page = buildPreviewPage(id, ayahs, which);

                if (which === "next") {
                    pager.appendChild(page);
                } else {
                    /*
                        الصفحة بتتحط في أول الصف (يمين)، فكل اللي موجود
                        بيزحف شمال، ولازم نرجّع السحب عشان نفضل واقفين
                        على نفس الصفحة.
                    */
                    const index = Number(pager.dataset.index) || 0;
                    const width = pager.clientWidth;

                    pager.style.scrollSnapType = "none";
                    pager.insertBefore(page, pager.firstChild);
                    pager.dataset.index = String(index + 1);

                    if (width) {
                        pager.scrollLeft = -(index + 1) * width;
                    }

                    requestAnimationFrame(() => {
                        pager.style.scrollSnapType = "";
                    });
                }

                layoutAllTags(pager);
            });
        });
    }

    function backToRealPage(pager, previewIndex, which) {
        const width = pager.clientWidth;

        if (!width) {
            return;
        }

        const target = previewIndex + (which === "next" ? -1 : 1);

        pager.scrollTo({
            left: -target * width,
            behavior: reduceMotion ? "auto" : "smooth"
        });
    }

    function settleCheck(pager, rootId) {
        if (
            pager.dataset.switching ||
            pager.dataset.touching ||
            pager.classList.contains("nt-dragging")
        ) {
            return;
        }

        const index = currentIndex(pager);
        const page = pager.children[index];

        if (!page || !page.dataset.preview) {
            return;
        }

        const which = page.dataset.preview;
        const targetId = Number(page.dataset.surah);
        const select = document.getElementById(SELECT_BY_ROOT[rootId]);

        if (!select || isBusy(rootId)) {
            backToRealPage(pager, index, which);
            return;
        }

        pager.dataset.switching = "1";

        pendingLanding = {
            rootId,
            surah: targetId,
            where: which === "next" ? "first" : "last",
            at: Date.now()
        };

        select.value = String(targetId);
        select.dispatchEvent(new Event("change", { bubbles: true }));

        /* لو السورة متفتحتش لأي سبب، نرجع للصفحة اللي كنا فيها */
        setTimeout(() => {
            if (pager.isConnected) {
                delete pager.dataset.switching;
                pendingLanding = null;
                backToRealPage(pager, currentIndex(pager), which);
            }
        }, 5000);
    }

    /* ---------------------------------------------------
       التقسيم لصفحات
    --------------------------------------------------- */

    function paginate(container) {

        if (!container || container.dataset.ntPaged) {
            return;
        }

        const root = container.parentElement;

        if (!root || !root.classList.contains("mushaf-page")) {
            return;
        }

        const spans = Array.from(
            container.querySelectorAll(":scope > .ayah")
        );

        /*
            لو رقم الصفحة ناقص (مثلاً رد قديم من الكاش)،
            بنسيب الشكل القديم زي ما هو بدل ما نبوّظه.
        */
        if (
            !spans.length ||
            spans.some(span => !Number(span.dataset.page))
        ) {
            container.dataset.ntPaged = "skip";
            return;
        }

        container.dataset.ntPaged = "1";

        const surahName = container.dataset.surahName || "";

        const groups = [];
        let current = null;

        spans.forEach(span => {
            const pageNo = Number(span.dataset.page);

            if (!current || current.page !== pageNo) {
                current = {
                    page: pageNo,
                    juz: Number(span.dataset.juz) || 0,
                    spans: []
                };
                groups.push(current);
            }

            current.spans.push(span);

            spaceMadd(span);

            if (span.dataset.sajda) {
                decorateSajdaSign(span);
            }
        });

        const basmala = root.querySelector(":scope > .basmala");

        const pager = el("div", "nt-pager");
        pager.setAttribute("dir", "rtl");
        pager.dataset.index = "0";

        groups.forEach((group, groupIndex) => {
            pager.appendChild(
                makePage({
                    page: group.page,
                    juz: group.juz,
                    surahName,
                    /* البسملة بتتعرض في أول صفحة من السورة بس */
                    basmala: groupIndex === 0 ? basmala : null,
                    nodes: group.spans
                })
            );
        });

        container.remove();

        root.classList.add("nt-paged");
        root.appendChild(pager);

        /* لو وصلنا هنا بسحب من سورة تانية، نقف في المكان الصح */
        const surahId = Number(container.dataset.surah) || 0;

        let landIndex = 0;

        if (pendingLanding) {
            if (
                pendingLanding.rootId === root.id &&
                pendingLanding.surah === surahId &&
                Date.now() - pendingLanding.at < 10000
            ) {
                if (pendingLanding.where === "last") {
                    landIndex = groups.length - 1;
                }
                pendingLanding = null;
            } else if (Date.now() - pendingLanding.at >= 10000) {
                pendingLanding = null;
            }
        }

        pager.dataset.index = String(landIndex);

        if (landIndex && pager.clientWidth) {
            pager.style.scrollSnapType = "none";
            pager.scrollLeft = -landIndex * pager.clientWidth;
            requestAnimationFrame(() => {
                pager.style.scrollSnapType = "";
            });
        }

        enableMouseDrag(pager);

        pager.addEventListener("touchstart", () => {
            pager.dataset.touching = "1";
        }, { passive: true });

        ["touchend", "touchcancel"].forEach(type => {
            pager.addEventListener(type, () => {
                delete pager.dataset.touching;
                scheduleSettle();
            }, { passive: true });
        });

        let settleTimer = null;

        function scheduleSettle() {
            clearTimeout(settleTimer);
            settleTimer = setTimeout(() => {
                settleCheck(pager, root.id);
            }, 200);
        }

        let ticking = false;

        pager.addEventListener("scroll", () => {
            scheduleSettle();

            if (ticking) {
                return;
            }
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                trackIndex(pager);
            });
        }, { passive: true });

        trackIndex(pager);

        if (surahId && SELECT_BY_ROOT[root.id]) {
            attachNeighbors(pager, surahId);
        }

        if (resizeObserver) {
            resizeObserver.observe(pager);
        }

        layoutAllTags(pager);

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => layoutAllTags(pager));
        }
    }

    /* ---------------------------------------------------
       السحب بالماوس على اللاب
    --------------------------------------------------- */

    /*
        على الموبايل والتاتش باد السحب شغال لوحده، لكن الماوس
        مبيحرّكش حاوية فيها scroll بالسحب. فبنعمل السحب بإيدينا
        للماوس بس: اسحب يمين = الصفحة اللي بعدها، اسحب شمال =
        اللي قبلها. الضغطة العادية على آية (من غير سحب) لسه
        شغالة زي ما هي.
    */
    function enableMouseDrag(pager) {
        let startX = 0;
        let startScroll = 0;
        let startIndex = 0;
        let lastX = 0;
        let lastTime = 0;
        let velocity = 0;
        let pressed = false;
        let dragging = false;
        let pointerId = null;
        let restoreTimer = null;

        pager.classList.add("nt-draggable");

        pager.addEventListener("pointerdown", event => {
            if (event.pointerType !== "mouse" || event.button !== 0) {
                return;
            }

            clearTimeout(restoreTimer);
            pager.style.scrollSnapType = "";

            pressed = true;
            dragging = false;
            pointerId = event.pointerId;

            startX = lastX = event.clientX;
            startScroll = pager.scrollLeft;
            startIndex = currentIndex(pager);
            lastTime = performance.now();
            velocity = 0;
        });

        pager.addEventListener("pointermove", event => {
            if (!pressed || event.pointerId !== pointerId) {
                return;
            }

            const dx = event.clientX - startX;

            if (!dragging) {
                if (Math.abs(dx) < 6) {
                    return;
                }

                dragging = true;

                pager.classList.add("nt-dragging");
                pager.style.scrollSnapType = "none";

                try {
                    pager.setPointerCapture(pointerId);
                } catch (error) {
                    /* مش مشكلة لو المتصفح رفض */
                }

                const selection = window.getSelection();
                if (selection) {
                    selection.removeAllRanges();
                }
            }

            const now = performance.now();
            const dt = Math.max(now - lastTime, 1);

            velocity = (event.clientX - lastX) / dt;
            lastX = event.clientX;
            lastTime = now;

            /* اسحب يمين = المحتوى يروح يمين = scrollLeft يقل */
            pager.scrollLeft = startScroll - dx;

            event.preventDefault();
        });

        function finish(event) {
            if (!pressed || (event && event.pointerId !== pointerId)) {
                return;
            }

            pressed = false;

            if (!dragging) {
                return;
            }

            dragging = false;

            pager.classList.remove("nt-dragging");

            try {
                pager.releasePointerCapture(pointerId);
            } catch (error) {
                /* تجاهل */
            }

            const width = pager.clientWidth || 1;
            const dx = lastX - startX;

            let target = startIndex;

            /* سحبة كفاية أو سريعة = نقلب الصفحة */
            if (Math.abs(dx) > width * 0.18 || Math.abs(velocity) > 0.5) {
                target += dx > 0 ? 1 : -1;
            }

            target = Math.max(0, Math.min(pageCount(pager) - 1, target));

            pager.scrollTo({
                left: -target * width,
                behavior: reduceMotion ? "auto" : "smooth"
            });

            /* نرجّع الـ snap بعد ما الحركة تخلص */
            restoreTimer = setTimeout(() => {
                pager.style.scrollSnapType = "";
                trackIndex(pager);
            }, reduceMotion ? 0 : 500);

            /* السحب ميتحسبش ضغطة على آية */
            const swallow = clickEvent => {
                clickEvent.stopPropagation();
                clickEvent.preventDefault();
            };

            pager.addEventListener("click", swallow, {
                capture: true,
                once: true
            });

            setTimeout(() => {
                pager.removeEventListener("click", swallow, true);
            }, 60);
        }

        pager.addEventListener("pointerup", finish);
        pager.addEventListener("pointercancel", finish);
        pager.addEventListener("lostpointercapture", finish);
    }

    function layoutAllTags(pager) {
        pager.querySelectorAll(".nt-mpage-inner").forEach(layoutSajdaTags);
    }

    function pageCount(pager) {
        return pager.children.length;
    }

    function currentIndex(pager) {
        const width = pager.clientWidth;

        if (!width) {
            return Number(pager.dataset.index) || 0;
        }

        return Math.max(
            0,
            Math.min(
                pageCount(pager) - 1,
                Math.round(Math.abs(pager.scrollLeft) / width)
            )
        );
    }

    function trackIndex(pager) {
        if (!pager.clientWidth) {
            return;
        }

        pager.dataset.index = String(currentIndex(pager));
    }

    /*
        لما المصحف يتخفي ويظهر تاني (تنقّل بين الصفحات أو وضع
        ملء الشاشة) المتصفح بيرجّع السحب لأول صفحة، فبنرجعه
        للصفحة اللي كان واقف عندها.
    */
    function restoreIndex(pager) {
        const width = pager.clientWidth;

        if (!width) {
            return;
        }

        const wanted = Number(pager.dataset.index) || 0;

        if (Math.round(Math.abs(pager.scrollLeft) / width) !== wanted) {
            pager.scrollLeft = -wanted * width;
        }

        trackIndex(pager);
    }


    /* ---------------------------------------------------
       مراقبة ظهور أي مصحف جديد في التطبيق
    --------------------------------------------------- */

    function handleNode(node) {
        if (node.nodeType !== 1) {
            return;
        }

        if (node.matches && node.matches(".ayahs[data-surah]")) {
            paginate(node);
        }

        if (node.querySelectorAll) {
            node.querySelectorAll(".ayahs[data-surah]").forEach(paginate);
        }
    }

    /*
        لو المصحف اتفضّى (رسالة "جاري التحميل" مثلاً) بنشيل
        وضع الصفحات عنه عشان الرسالة تتعرض عادي.
    */
    function cleanup() {
        document.querySelectorAll(".mushaf-page.nt-paged").forEach(root => {
            if (!root.querySelector(":scope > .nt-pager")) {
                root.classList.remove("nt-paged");
            }
        });
    }

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(handleNode);
        });

        cleanup();
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    /* لو فيه مصحف اترسم قبل ما الملف ده يتحمّل */
    document.querySelectorAll(".ayahs[data-surah]").forEach(paginate);

    window.NTMushafPager = { paginate };

})();