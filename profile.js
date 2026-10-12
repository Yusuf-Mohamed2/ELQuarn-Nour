/* =========================================================
   PROFILE.JS  —  نور التلاوة
   =========================================================
   البروفيل: اسم + صورة اختيارية (بتتسأل عنهم أول مرة بس)،
   وصفحة إحصائيات الاستماع (أكتر شيخ، أكتر سورة، الوقت...).

   - الاستماع بيتتبّع من عنصر audio الأساسي (نفس اللي
     بتشغّل بيه التلاوة)، ومفيش حاجة بتتبعت لأي سيرفر:
     كل حاجة بتتخزن في localStorage على الجهاز بس.
   - لازم يتحمّل بعد pages.js (الراوتر بيلقط الصفحة
     الجديدة #profile لوحده لأنها section جوه <main>).
========================================================= */

(function () {

    "use strict";

    var PROFILE_KEY = "noorTelawa_profile";
    var STATS_KEY = "noorTelawa_stats";
    var TOUR_KEY = "noorTelawaTourSeen_v1";

    /* أقل مدة استماع (بالثواني) عشان نعتبرها "مرة استماع" */
    var MIN_PLAY_SECONDS = 20;

    var KEEP_DAYS = 120;


    /* =====================================================
       تخزين
    ===================================================== */

    function read(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch (error) {
            return fallback;
        }
    }

    function write(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            return false;
        }
    }

    function normalizeStats(raw) {
        var s = raw && typeof raw === "object" ? raw : {};
        return {
            since: s.since || Date.now(),
            total: Number(s.total) || 0,
            readers: s.readers || {},
            surahs: s.surahs || {},
            plays: {
                readers: (s.plays && s.plays.readers) || {},
                surahs: (s.plays && s.plays.surahs) || {}
            },
            days: s.days || {}
        };
    }

    var profile = read(PROFILE_KEY, null);
    var stats = normalizeStats(read(STATS_KEY, null));


    /* =====================================================
       أدوات
    ===================================================== */

    function esc(text) {
        var div = document.createElement("div");
        div.textContent = String(text == null ? "" : text);
        return div.innerHTML;
    }

    function toast(message) {
        try { showToast(message); } catch (error) { /* */ }
    }

    function pad(n) {
        return n < 10 ? "0" + n : String(n);
    }

    function dayKey(date) {
        return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
    }

    function formatDuration(seconds) {

        var total = Math.round(seconds);

        if (total < 60) {
            return total < 5 ? "0 دقيقة" : "أقل من دقيقة";
        }

        var minutes = Math.round(total / 60);

        if (minutes < 60) {
            return minutes + " دقيقة";
        }

        var hours = Math.floor(minutes / 60);
        var rest = minutes % 60;

        return rest
            ? hours + " ساعة و " + rest + " دقيقة"
            : hours + " ساعة";
    }

    function findReader(id) {
        try {
            for (var i = 0; i < readers.length; i++) {
                if (String(readers[i].id) === String(id)) {
                    return readers[i];
                }
            }
        } catch (error) { /* */ }
        return null;
    }

    function findSurah(id) {
        try {
            for (var i = 0; i < surahs.length; i++) {
                if (String(surahs[i].id) === String(id)) {
                    return surahs[i];
                }
            }
        } catch (error) { /* */ }
        return null;
    }

    function topEntries(map, limit) {
        return Object.keys(map)
            .map(function (key) { return { id: key, seconds: map[key] }; })
            .filter(function (item) { return item.seconds >= 1; })
            .sort(function (a, b) { return b.seconds - a.seconds; })
            .slice(0, limit);
    }


    /* =====================================================
       تتبّع الاستماع
    ===================================================== */

    var lastTick = 0;
    var sessionKey = "";
    var sessionSeconds = 0;
    var sessionCounted = false;
    var lastSave = 0;
    var saveTimer = null;

    function currentIds() {

        var readerId = null;
        var surahId = null;

        try {
            if (typeof selectedReader !== "undefined" && selectedReader) {
                readerId = selectedReader.id;
            }
        } catch (error) { /* */ }

        try {
            if (typeof selectedSurah !== "undefined" && selectedSurah) {
                surahId = selectedSurah.id;
            }
        } catch (error) { /* */ }

        return { reader: readerId, surah: surahId };
    }

    function bump(map, key, amount) {
        map[key] = (map[key] || 0) + amount;
    }

    function pruneDays() {

        var cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - KEEP_DAYS);
        var cutoffKey = dayKey(cutoff);

        Object.keys(stats.days).forEach(function (key) {
            if (key < cutoffKey) {
                delete stats.days[key];
            }
        });
    }

    function saveStats() {

        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }

        lastSave = Date.now();
        pruneDays();
        write(STATS_KEY, stats);
    }

    function addListening(ids, seconds) {

        if (ids.surah == null) {
            return;
        }

        stats.total += seconds;
        bump(stats.surahs, ids.surah, seconds);

        if (ids.reader != null) {
            bump(stats.readers, ids.reader, seconds);
        }

        bump(stats.days, dayKey(new Date()), seconds);

        var key = ids.reader + "|" + ids.surah;

        if (key !== sessionKey) {
            sessionKey = key;
            sessionSeconds = 0;
            sessionCounted = false;
        }

        sessionSeconds += seconds;

        if (!sessionCounted && sessionSeconds >= MIN_PLAY_SECONDS) {

            sessionCounted = true;

            bump(stats.plays.surahs, ids.surah, 1);

            if (ids.reader != null) {
                bump(stats.plays.readers, ids.reader, 1);
            }
        }

        if (Date.now() - lastSave > 10000) {
            saveStats();
        }
    }

    function onTimeUpdate() {

        if (audio.paused || audio.seeking) {
            lastTick = 0;
            return;
        }

        var now = Date.now();

        if (!lastTick) {
            lastTick = now;
            return;
        }

        var delta = (now - lastTick) / 1000;
        lastTick = now;

        /* فجوة كبيرة = تقطيع أو تعليق، منحسبهاش استماع */
        if (delta <= 0 || delta > 2.5) {
            return;
        }

        addListening(currentIds(), delta);
    }

    function startTracking() {

        if (typeof audio === "undefined" || !audio) {
            return;
        }

        audio.addEventListener("timeupdate", onTimeUpdate);

        ["pause", "waiting", "seeking", "emptied", "stalled"].forEach(function (name) {
            audio.addEventListener(name, function () {
                lastTick = 0;
            });
        });

        audio.addEventListener("pause", saveStats);

        audio.addEventListener("ended", function () {
            lastTick = 0;
            sessionKey = "";
            saveStats();
        });

        window.addEventListener("pagehide", saveStats);

        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "hidden") {
                saveStats();
            }
        });
    }


    /* =====================================================
       الصورة الشخصية
    ===================================================== */

    function fileToAvatar(file) {

        return new Promise(function (resolve, reject) {

            var reader = new FileReader();

            reader.onerror = reject;

            reader.onload = function () {

                var img = new Image();

                img.onerror = reject;

                img.onload = function () {

                    var size = 256;
                    var canvas = document.createElement("canvas");

                    canvas.width = size;
                    canvas.height = size;

                    var side = Math.min(img.width, img.height);
                    var sx = (img.width - side) / 2;
                    var sy = (img.height - side) / 2;

                    canvas.getContext("2d").drawImage(img, sx, sy, side, side, 0, 0, size, size);

                    resolve(canvas.toDataURL("image/jpeg", 0.85));
                };

                img.src = reader.result;
            };

            reader.readAsDataURL(file);
        });
    }

    function initialOf(name) {
        var trimmed = String(name || "").trim();
        return trimmed ? Array.from(trimmed)[0] : "👤";
    }

    function avatarInner() {

        if (profile && profile.photo) {
            return '<img src="' + profile.photo + '" alt="">';
        }

        if (profile && profile.name) {
            return "<span>" + esc(initialOf(profile.name)) + "</span>";
        }

        return "<span>👤</span>";
    }


    /* =====================================================
       زرار الصورة في النافبار
    ===================================================== */

    var avatarBtn = null;

    function buildAvatarButton() {

        var container = document.querySelector(".nav-container");

        if (!container) {
            return;
        }

        avatarBtn = document.createElement("a");

        avatarBtn.href = "#profile";
        avatarBtn.className = "nt-avatar-btn";
        avatarBtn.id = "ntAvatarBtn";
        avatarBtn.title = "البروفيل";

        var anchor =
            document.getElementById("themeToggleBtn") ||
            document.getElementById("settingsBtn");

        if (anchor) {
            container.insertBefore(avatarBtn, anchor);
        } else {
            container.appendChild(avatarBtn);
        }

        refreshAvatarButton();
    }

    function refreshAvatarButton() {

        if (!avatarBtn) {
            return;
        }

        avatarBtn.innerHTML = avatarInner();
        avatarBtn.title = profile && profile.name ? profile.name : "البروفيل";
    }


    /* =====================================================
       نافذة إنشاء / تعديل البروفيل
    ===================================================== */

    var overlay = null;
    var pendingPhoto = null;
    var editing = false;

    function buildModal() {

        overlay = document.createElement("div");

        overlay.className = "nt-pf-overlay";
        overlay.hidden = true;

        overlay.innerHTML =
            '<div class="nt-pf-modal" role="dialog" aria-modal="true" aria-labelledby="ntPfTitle">' +
                '<div class="nt-pf-mark">☪</div>' +
                '<h3 id="ntPfTitle"></h3>' +
                '<p class="nt-pf-sub" id="ntPfSub"></p>' +

                '<button type="button" class="nt-pf-photo" id="ntPfPhotoBtn" aria-label="اختيار صورة">' +
                    '<span class="nt-pf-photo-view" id="ntPfPhotoView"></span>' +
                    '<span class="nt-pf-photo-plus">+</span>' +
                '</button>' +
                '<div class="nt-pf-photo-hint">' +
                    '<span>صورتك (اختياري)</span>' +
                    '<button type="button" class="nt-pf-link" id="ntPfPhotoRemove" hidden>إزالة الصورة</button>' +
                '</div>' +
                '<input type="file" accept="image/*" id="ntPfFile" hidden>' +

                '<label class="nt-pf-label" for="ntPfName">اسمك</label>' +
                '<input type="text" class="nt-pf-input" id="ntPfName" maxlength="30" ' +
                       'placeholder="اكتب اسمك هنا" autocomplete="off">' +
                '<div class="nt-pf-error" id="ntPfError"></div>' +

                '<div class="nt-pf-actions">' +
                    '<button type="button" class="nt-pf-btn nt-pf-primary" id="ntPfSave">ابدأ</button>' +
                    '<button type="button" class="nt-pf-btn nt-pf-ghost" id="ntPfCancel" hidden>إلغاء</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var fileInput = overlay.querySelector("#ntPfFile");
        var nameInput = overlay.querySelector("#ntPfName");

        overlay.querySelector("#ntPfPhotoBtn").addEventListener("click", function () {
            fileInput.click();
        });

        overlay.querySelector("#ntPfPhotoRemove").addEventListener("click", function () {
            pendingPhoto = "";
            paintModalPhoto();
        });

        fileInput.addEventListener("change", function () {

            var file = fileInput.files && fileInput.files[0];

            fileInput.value = "";

            if (!file) {
                return;
            }

            fileToAvatar(file).then(function (dataUrl) {
                pendingPhoto = dataUrl;
                paintModalPhoto();
            }).catch(function () {
                setModalError("ماقدرناش نقرأ الصورة دي، جرّب صورة تانية");
            });
        });

        nameInput.addEventListener("input", function () {
            setModalError("");
        });

        nameInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                saveFromModal();
            }
        });

        overlay.querySelector("#ntPfSave").addEventListener("click", saveFromModal);
        overlay.querySelector("#ntPfCancel").addEventListener("click", closeModal);
    }

    function setModalError(text) {
        overlay.querySelector("#ntPfError").textContent = text || "";
    }

    function paintModalPhoto() {

        var view = overlay.querySelector("#ntPfPhotoView");
        var removeBtn = overlay.querySelector("#ntPfPhotoRemove");

        if (pendingPhoto) {
            view.innerHTML = '<img src="' + pendingPhoto + '" alt="">';
            removeBtn.hidden = false;
        } else {
            view.innerHTML = "<span>📷</span>";
            removeBtn.hidden = true;
        }
    }

    function openModal(isEdit) {

        if (!overlay) {
            buildModal();
        }

        editing = !!isEdit;
        pendingPhoto = editing && profile ? (profile.photo || "") : "";

        overlay.querySelector("#ntPfTitle").textContent =
            editing ? "تعديل البروفيل" : "أهلًا بيك في نور التلاوة";

        overlay.querySelector("#ntPfSub").textContent =
            editing
                ? "غيّر اسمك أو صورتك"
                : "عرّفنا باسمك عشان نجهّز لك بروفيل فيه إحصائيات استماعك";

        overlay.querySelector("#ntPfSave").textContent = editing ? "حفظ" : "ابدأ";
        overlay.querySelector("#ntPfCancel").hidden = !editing;
        overlay.querySelector("#ntPfName").value = editing && profile ? profile.name : "";

        setModalError("");
        paintModalPhoto();

        overlay.hidden = false;
        document.body.classList.add("nt-pf-lock");

        setTimeout(function () {
            try { overlay.querySelector("#ntPfName").focus(); } catch (error) { /* */ }
        }, 80);
    }

    function closeModal() {

        if (overlay) {
            overlay.hidden = true;
        }

        document.body.classList.remove("nt-pf-lock");
    }

    function saveFromModal() {

        var name = overlay.querySelector("#ntPfName").value.trim();

        if (!name) {
            setModalError("اكتب اسمك الأول");
            overlay.querySelector("#ntPfName").focus();
            return;
        }

        profile = {
            name: name,
            photo: pendingPhoto || "",
            createdAt: (profile && profile.createdAt) || Date.now(),
            updatedAt: Date.now()
        };

        if (!write(PROFILE_KEY, profile)) {
            setModalError("مساحة التخزين ممتلئة، جرّب صورة أصغر أو من غير صورة");
            return;
        }

        var wasEditing = editing;

        closeModal();
        refreshAvatarButton();
        renderPage();

        toast(wasEditing ? "اتحفظ البروفيل ✅" : "أهلًا " + name + " 🌙");
    }


    /* =====================================================
       صفحة البروفيل
    ===================================================== */

    var section = null;

    function buildSection() {

        var main = document.querySelector("main");

        if (!main) {
            return;
        }

        section = document.createElement("section");

        section.id = "profile";
        section.className = "section nt-pf-section";

        main.appendChild(section);

        /* الراوتر بيضيف nt-page-active على القسم، فبنرسم أول ما يظهر */
        new MutationObserver(function () {
            if (section.classList.contains("nt-page-active")) {
                renderPage();
            }
        }).observe(section, { attributes: true, attributeFilter: ["class"] });
    }

    function computeStreak() {

        var streak = 0;
        var cursor = new Date();

        /* لو لسه ماسمعتش النهاردة، نبدأ العدّ من امبارح */
        if (!(stats.days[dayKey(cursor)] > 0)) {
            cursor.setDate(cursor.getDate() - 1);
        }

        while (stats.days[dayKey(cursor)] > 0) {
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }

        return streak;
    }

    function readerAvatarHtml(reader, big) {

        var cls = "nt-pf-ravatar" + (big ? " nt-pf-ravatar-big" : "");
        var initial = reader && reader.initial ? reader.initial : initialOf(reader && reader.name);
        var img = reader && reader.photo
            ? '<img src="' + esc(reader.photo) + '" alt="" data-ntpf-img>'
            : "";

        return '<span class="' + cls + '"><b>' + esc(initial) + "</b>" + img + "</span>";
    }

    function rankListHtml(entries, kind) {

        var max = entries.length ? entries[0].seconds : 1;

        return entries.map(function (entry, index) {

            var label;
            var lead = "";
            var plays = (kind === "reader" ? stats.plays.readers : stats.plays.surahs)[entry.id] || 0;

            if (kind === "reader") {
                var reader = findReader(entry.id);
                label = reader ? reader.name : "قارئ";
                lead = readerAvatarHtml(reader, false);
            } else {
                var surah = findSurah(entry.id);
                label = surah ? "سورة " + surah.name : "سورة";
                lead = '<span class="nt-pf-rank">' + (index + 1) + "</span>";
            }

            var width = Math.max(6, Math.round((entry.seconds / max) * 100));

            return (
                '<div class="nt-pf-row">' +
                    lead +
                    '<div class="nt-pf-row-main">' +
                        '<div class="nt-pf-row-top">' +
                            "<strong>" + esc(label) + "</strong>" +
                            "<small>" + esc(formatDuration(entry.seconds)) +
                                (plays ? " · " + plays + " مرة" : "") + "</small>" +
                        "</div>" +
                        '<div class="nt-pf-bar"><i style="width:' + width + '%"></i></div>' +
                    "</div>" +
                "</div>"
            );
        }).join("");
    }

    function weekChartHtml() {

        var days = [];

        for (var i = 6; i >= 0; i--) {
            var date = new Date();
            date.setDate(date.getDate() - i);
            days.push({
                key: dayKey(date),
                label: date.toLocaleDateString("ar-EG", { weekday: "short" }),
                seconds: stats.days[dayKey(date)] || 0,
                today: i === 0
            });
        }

        var max = Math.max.apply(null, days.map(function (d) { return d.seconds; }).concat([60]));

        return '<div class="nt-pf-week">' + days.map(function (d) {

            var height = d.seconds > 0 ? Math.max(8, Math.round((d.seconds / max) * 100)) : 4;

            return (
                '<div class="nt-pf-day' + (d.today ? " is-today" : "") + '" title="' + esc(formatDuration(d.seconds)) + '">' +
                    '<div class="nt-pf-day-bar"><i style="height:' + height + '%"></i></div>' +
                    "<span>" + esc(d.label) + "</span>" +
                "</div>"
            );
        }).join("") + "</div>";
    }

    function renderPage() {

        if (!section) {
            return;
        }

        var html = "";

        html += '<div class="container"><div class="nt-pf-wrap">';

        html += '<div class="nt-back-row"><a class="nt-back-btn" href="#home">‹ الرئيسية</a></div>';

        if (!profile) {

            html +=
                '<div class="nt-pf-hero nt-pf-empty">' +
                    '<div class="nt-pf-avatar">' + avatarInner() + "</div>" +
                    "<h2>لسه معملتش بروفيل</h2>" +
                    "<p>اكتب اسمك وضيف صورة لو حبيت، وهنوريك إحصائيات استماعك.</p>" +
                    '<button type="button" class="nt-pf-btn nt-pf-primary" id="ntPfCreate">إنشاء البروفيل</button>' +
                "</div>";

        } else {

            var since = new Date(profile.createdAt || stats.since).toLocaleDateString("ar-EG", {
                year: "numeric", month: "long", day: "numeric"
            });

            html +=
                '<div class="nt-pf-hero">' +
                    '<div class="nt-pf-avatar">' + avatarInner() + "</div>" +
                    "<h2>" + esc(profile.name) + "</h2>" +
                    "<p>معانا من " + esc(since) + "</p>" +
                    '<button type="button" class="nt-pf-btn nt-pf-ghost" id="ntPfEdit">✏️ تعديل البروفيل</button>' +
                "</div>";
        }

        var topReaders = topEntries(stats.readers, 5);
        var topSurahs = topEntries(stats.surahs, 5);
        var hasData = stats.total >= 5 && (topSurahs.length || topReaders.length);

        if (!hasData) {

            html +=
                '<div class="nt-pf-card nt-pf-nodata">' +
                    "<h3>📊 إحصائياتك</h3>" +
                    "<p>لسه مفيش استماع متسجّل. شغّل أي سورة وهتبدأ إحصائياتك تظهر هنا تلقائيًا.</p>" +
                    '<a class="nt-pf-btn nt-pf-primary" href="#listen">ابدأ الاستماع 🎧</a>' +
                "</div>";

        } else {

            var distinctReaders = Object.keys(stats.readers).filter(function (k) { return stats.readers[k] >= 1; }).length;
            var distinctSurahs = Object.keys(stats.surahs).filter(function (k) { return stats.surahs[k] >= 1; }).length;
            var totalPlays = Object.keys(stats.plays.surahs).reduce(function (sum, k) { return sum + stats.plays.surahs[k]; }, 0);

            html +=
                '<div class="nt-pf-tiles">' +
                    tile("⏱️", formatDuration(stats.total), "إجمالي وقت الاستماع") +
                    tile("🔁", String(totalPlays), "مرة استماع") +
                    tile("🔥", computeStreak() + " يوم", "أيام متتالية") +
                    tile("🎙️", String(distinctReaders), "قارئ سمعتلهم") +
                    tile("📖", String(distinctSurahs) + " / 114", "سورة سمعتها") +
                "</div>";

            if (topReaders.length) {

                var best = findReader(topReaders[0].id);

                html +=
                    '<div class="nt-pf-card nt-pf-best">' +
                        readerAvatarHtml(best, true) +
                        "<div>" +
                            "<small>أكتر شيخ بتسمعله</small>" +
                            "<h3>" + esc(best ? best.name : "—") + "</h3>" +
                            "<span>" + esc(formatDuration(topReaders[0].seconds)) + "</span>" +
                        "</div>" +
                    "</div>";
            }

            if (topSurahs.length) {

                var bestSurah = findSurah(topSurahs[0].id);

                html +=
                    '<div class="nt-pf-card nt-pf-best">' +
                        '<span class="nt-pf-ravatar nt-pf-ravatar-big"><b>📖</b></span>' +
                        "<div>" +
                            "<small>أكتر سورة بتحب تسمعها</small>" +
                            "<h3>" + esc(bestSurah ? "سورة " + bestSurah.name : "—") + "</h3>" +
                            "<span>" + esc(formatDuration(topSurahs[0].seconds)) + "</span>" +
                        "</div>" +
                    "</div>";
            }

            html +=
                '<div class="nt-pf-card"><h3>آخر 7 أيام</h3>' + weekChartHtml() + "</div>";

            if (topReaders.length) {
                html += '<div class="nt-pf-card"><h3>🎙️ أكتر القراء استماعًا</h3>' + rankListHtml(topReaders, "reader") + "</div>";
            }

            if (topSurahs.length) {
                html += '<div class="nt-pf-card"><h3>📖 أكتر السور استماعًا</h3>' + rankListHtml(topSurahs, "surah") + "</div>";
            }

            html += '<button type="button" class="nt-pf-link nt-pf-reset" id="ntPfReset">مسح الإحصائيات</button>';
        }

        html += "</div></div>";

        section.innerHTML = html;

        /* صور القراء اللي مش لاقيها تفضل الحرف الأول */
        section.querySelectorAll("img[data-ntpf-img]").forEach(function (img) {
            img.addEventListener("error", function () { img.remove(); });
        });

        var createBtn = section.querySelector("#ntPfCreate");
        var editBtn = section.querySelector("#ntPfEdit");
        var resetBtn = section.querySelector("#ntPfReset");

        if (createBtn) {
            createBtn.addEventListener("click", function () { openModal(false); });
        }

        if (editBtn) {
            editBtn.addEventListener("click", function () { openModal(true); });
        }

        if (resetBtn) {
            resetBtn.addEventListener("click", function () {

                if (!confirm("متأكد إنك عايز تمسح كل إحصائيات الاستماع؟")) {
                    return;
                }

                stats = normalizeStats(null);
                saveStats();
                renderPage();
                toast("اتمسحت الإحصائيات");
            });
        }
    }

    function tile(icon, value, label) {
        return (
            '<div class="nt-pf-tile">' +
                "<span>" + icon + "</span>" +
                "<strong>" + esc(value) + "</strong>" +
                "<small>" + esc(label) + "</small>" +
            "</div>"
        );
    }


    /* =====================================================
       تشغيل
    ===================================================== */

    function tourSeen() {
        try {
            return !!localStorage.getItem(TOUR_KEY) || location.search.indexOf("skipTour=1") !== -1;
        } catch (error) {
            return true;
        }
    }

    function init() {

        buildSection();
        buildAvatarButton();
        startTracking();

        /* لو الصفحة اتفتحت على #profile مباشرة، الراوتر كان لسه معندوش القسم */
        if (location.hash === "#profile") {
            window.dispatchEvent(new Event("hashchange"));
        }

        /* أول مرة: نسأل عن الاسم والصورة (بعد الجولة، مش قبلها) */
        if (!profile && tourSeen()) {
            setTimeout(function () {
                if (!profile) {
                    openModal(false);
                }
            }, 700);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();