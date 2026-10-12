/* =========================================================
   BOOKS-DATA.JS  —  نور التلاوة
   =========================================================
   مكتبة "الأحكام والتجويد": الأقسام والكتب اللي بتظهر فيها.
   تقدر تزوّد كتاب جديد بإنك تنسخ أي بلوك وتغيّر بياناته.

   حقول الكتاب:
   - id      : اسم مميز (إنجليزي من غير مسافات).
   - cat     : القسم: "tajweed" أو "ahkam" أو "tafsir".
   - title / author / desc : العنوان والمؤلف ووصف قصير.
   - level   : (اختياري) مبتدئ / متوسط / متقدم.
   - meta    : (اختياري) معلومة صغيرة (عدد الصفحات، الحجم...).
   - embed   : رابط القراءة جوه التطبيق (iframe). الأفضل:
               https://archive.org/embed/<ID>  لأي كتاب على أرشيف الإنترنت،
               أو gview(<رابط PDF>) لأي PDF مباشر.
   - pdf     : رابط تحميل PDF مباشر.
   - page    : صفحة الكتاب الأصلية. لو مفيش embed بيتفتح منها
               "اقرأ أونلاين"، ولو مفيش pdf بيتحمّل منها.
   - parts   : للكتب متعددة المجلدات: [{ label, embed, pdf, page }].

   مصادر الكتب هنا: أرشيف الإنترنت (archive.org) وويكي مصدر
   ومواقع إسلامية معروفة. لو رابط اتغيّر مستقبلًا، عدّله هنا بس.
   بعد أي تعديل غيّر رقم CACHE_NAME في sw.js.
========================================================= */

(function () {

    "use strict";

    /* قارئ جوجل: بيعرض أي PDF مباشر جوه iframe (شغّال على الموبايل كمان) */
    function gview(url) {
        return "https://docs.google.com/gview?embedded=true&url=" + encodeURIComponent(url);
    }

    var IA = "https://archive.org";


    window.NT_BOOKS_CATS = [
        {
            id: "tajweed",
            icon: "🎙️",
            title: "تعلّم التجويد",
            desc: "كتب بتعلّمك أحكام التجويد خطوة خطوة"
        },
        {
            id: "ahkam",
            icon: "⚖️",
            title: "الأحكام الشرعية",
            desc: "أحكام الطهارة والصلاة والصيام وغيرها بأدلتها"
        },
        {
            id: "tafsir",
            icon: "📖",
            title: "التفسير",
            desc: "كتب تفسير القرآن الكريم بأسلوب مبسّط"
        }
    ];


    window.NT_BOOKS = [

        /* ---------------------- التجويد ---------------------- */

        {
            id: "tajweed-muyassar",
            cat: "tajweed",
            title: "التجويد الميسّر",
            author: "نخبة من المختصين، منهم د. علي بن عبدالرحمن الحذيفي",
            desc: "من إصدارات مجمع الملك فهد لطباعة المصحف الشريف. يجمع مبادئ علم التجويد وأبوابه ومسائله الأساسية على قراءة حفص عن عاصم بأسلوب سهل، وأنسب كتاب تبدأ بيه.",
            level: "مبتدئ",
            meta: "178 صفحة",
            embed: IA + "/embed/a769n",
            pdf: IA + "/download/a769n/a769n.pdf",
            page: IA + "/details/a769n"
        },

        {
            id: "tajweed-mufid-muyassar",
            cat: "tajweed",
            title: "المفيد الميسّر في علم التجويد",
            author: "عبدالله عبدالقادر حيلوز",
            desc: "شرح لأحكام التجويد على رواية حفص عن عاصم من طريق الشاطبية، فيه أمثلة وتمارين محلولة لكل حكم، وتطبيق عملي على استخراج الأحكام من سورة البلد.",
            level: "متوسط",
            meta: "176 صفحة",
            embed: gview(IA + "/download/adel-0033/Quraan04610.pdf"),
            pdf: IA + "/download/adel-0033/Quraan04610.pdf",
            page: IA + "/details/adel-0033"
        },

        {
            id: "tajweed-matn-mufid",
            cat: "tajweed",
            title: "متن المفيد في علم التجويد",
            author: "محمد بن شامي بن مطاعن شيبة العدوي القرشي",
            desc: "متن مختصر يضم أهم مسائل التجويد على الراجح عند مؤلفه. مناسب للمراجعة السريعة وللحفظ بعد ما تفهم الأحكام من كتاب مبسّط.",
            level: "متوسط",
            embed: gview(IA + "/download/adel-0033/Quraan03882.pdf"),
            pdf: IA + "/download/adel-0033/Quraan03882.pdf",
            page: IA + "/details/adel-0033"
        },

        {
            id: "tajweed-nihaya",
            cat: "tajweed",
            title: "نهاية القول المفيد في علم التجويد",
            author: "محمد مكي نصر الجريسي",
            desc: "مرجع موسّع في التجويد، وصفه الرافع على أرشيف الإنترنت بأنه من أقيم كتب التجويد. مناسب بعد ما تتقن الأساسيات وتحب تتعمق.",
            level: "متقدم",
            embed: IA + "/embed/tajweed_20131222_1024",
            page: IA + "/details/tajweed_20131222_1024"
        },


        /* ---------------------- الأحكام ---------------------- */

        {
            id: "ahkam-fiqh-muyassar",
            cat: "ahkam",
            title: "الفقه الميسّر في ضوء الكتاب والسنة",
            author: "نخبة من العلماء، بإشراف مجمع الملك فهد",
            desc: "يشمل أحكام العبادات والمعاملات مقرونة بأدلتها من القرآن والسنة الصحيحة، بعبارة واضحة وبدون تعقيد، ويقتصر على القول الراجح في المسائل. مناسب للمبتدئ وعامة المسلمين.",
            level: "مبتدئ",
            meta: "حوالي 426 صفحة",
            page: "https://shamela.ws/book/22726"
        },

        {
            id: "ahkam-umdat",
            cat: "ahkam",
            title: "العمدة في الأحكام",
            author: "عبدالغني بن عبدالواحد المقدسي",
            desc: "مجموعة أحاديث الأحكام المتفق عليها بين البخاري ومسلم، مرتبة على أبواب الفقه (الطهارة، الصلاة، الصيام، الحج...). كتاب صغير مشهور يبدأ بيه كتير من طلبة العلم.",
            level: "متوسط",
            meta: "120 صفحة، نسخة مصوّرة",
            embed: gview("https://ar.wikisource.org/wiki/Special:FilePath/" + encodeURIComponent("العمدة_في_الأحكام.pdf")),
            pdf: "https://ar.wikisource.org/wiki/Special:FilePath/" + encodeURIComponent("العمدة_في_الأحكام.pdf"),
            page: "https://ar.wikisource.org/wiki/" + encodeURIComponent("ملف:العمدة_في_الأحكام.pdf")
        },

        {
            id: "ahkam-tahara",
            cat: "ahkam",
            title: "مختصر أحكام الطهارة",
            author: "مكتبة الألوكة",
            desc: "كتاب مختصر (PDF) في أحكام الطهارة، تلاقي فيه تحميل الملف من صفحة الكتاب.",
            level: "مبتدئ",
            page: "https://www.alukah.net/sharia/7/159836/" +
                "%d9%85%d8%ae%d8%aa%d8%b5%d8%b1-%d8%a3%d8%ad%d9%83%d8%a7%d9%85-" +
                "%d8%a7%d9%84%d8%b7%d9%87%d8%a7%d8%b1%d8%a9-PDF/"
        },


        /* ---------------------- التفسير ---------------------- */

        {
            id: "tafsir-muyassar",
            cat: "tafsir",
            title: "التفسير الميسّر",
            author: "نخبة من العلماء، مجمع الملك فهد",
            desc: "من أفضل مختصرات التفسير وأوثقها، بعبارة سهلة تبيّن معنى الآية بإيجاز. أنسب بداية لمن يريد يفهم معاني القرآن. الصفحة فيها ملف PDF وملف Word.",
            level: "مبتدئ",
            page: "https://mtafsir.net/threads/" +
                "%D8%AD%D9%85%D9%84-%D9%86%D8%B3%D8%AE%D8%AA%D9%83-%D8%A7%D9%84%D8%A7%D9%84%D9%83%D8%AA%D8%B1%D9%88" +
                "%D9%86%D9%8A%D8%A9-%D8%A7%D9%84%D9%85%D8%B9%D8%AA%D9%85%D8%AF%D8%A9-%D9%85%D9%86-%D8%A7%D9%84%D8%AA" +
                "%D9%81%D8%B3%D9%8A%D8%B1-%D8%A7%D9%84%D9%85%D9%8A%D8%B3%D8%B1-%D9%84%D9%86%D8%AE%D8%A8%D8%A9-%D9%85" +
                "%D9%86-%D8%A7%D9%84%D8%B9%D9%84%D9%85%D8%A7%D8%A1.9383/latest"
        },

        {
            id: "tafsir-mukhtasar",
            cat: "tafsir",
            title: "المختصر في تفسير القرآن الكريم",
            author: "مركز تفسير للدراسات القرآنية",
            desc: "تفسير معاصر موجز وواضح، مكتوب لقارئ اليوم من غير تعقيد الكتب الأكاديمية الطويلة. النسخة ملوّنة.",
            level: "مبتدئ",
            meta: "نسخة ملونة، حوالي 143 ميجا",
            embed: IA + "/embed/Mukhtasr_tafsir",
            pdf: IA + "/download/Mukhtasr_tafsir/" + encodeURIComponent("المختصر فى تفسير القرآن الكريم.pdf"),
            page: IA + "/details/Mukhtasr_tafsir"
        },

        {
            id: "tafsir-safwa",
            cat: "tafsir",
            title: "صفوة التفاسير",
            author: "محمد علي الصابوني",
            desc: "تفسير سهل العبارة يجمع خلاصة أشهر التفاسير، بشرح للمعنى الإجمالي والمناسبات وأسباب النزول. مناسب للقارئ العادي.",
            level: "متوسط",
            meta: "3 مجلدات",
            page: IA + "/details/Safwattafasir",
            parts: [
                {
                    label: "المجلد الأول",
                    embed: IA + "/embed/Safwattafasir/satf1",
                    pdf: IA + "/download/Safwattafasir/satf1_text.pdf",
                    page: IA + "/details/Safwattafasir/satf1"
                },
                {
                    label: "المجلد الثاني",
                    embed: IA + "/embed/Safwattafasir/satf2",
                    pdf: IA + "/download/Safwattafasir/satf2_text.pdf",
                    page: IA + "/details/Safwattafasir/satf2"
                },
                {
                    label: "المجلد الثالث",
                    embed: IA + "/embed/Safwattafasir/satf3",
                    pdf: IA + "/download/Safwattafasir/satf3_text.pdf",
                    page: IA + "/details/Safwattafasir/satf3"
                }
            ]
        },

        {
            id: "tafsir-ibnkathir-mukhtasar",
            cat: "tafsir",
            title: "مختصر تفسير ابن كثير",
            author: "محمد علي الصابوني",
            desc: "اختصار لتفسير ابن كثير (التفسير بالمأثور) في ثلاثة مجلدات، بنفس منهجه في تفسير القرآن بالقرآن ثم بالسنة وأقوال الصحابة.",
            level: "متوسط",
            meta: "3 مجلدات",
            page: IA + "/details/mtfibnkthir",
            parts: [
                {
                    label: "المجلد الأول",
                    embed: IA + "/embed/mtfibnkthir/mtfik1",
                    page: IA + "/details/mtfibnkthir/mtfik1/"
                },
                {
                    label: "المجلد الثاني",
                    embed: IA + "/embed/mtfibnkthir/mtfik2",
                    page: IA + "/details/mtfibnkthir/mtfik2/"
                },
                {
                    label: "المجلد الثالث",
                    embed: IA + "/embed/mtfibnkthir/mtfik3",
                    page: IA + "/details/mtfibnkthir/mtfik3/"
                }
            ]
        },

        {
            id: "tafsir-ibnkathir",
            cat: "tafsir",
            title: "تفسير القرآن العظيم (ابن كثير)",
            author: "ابن كثير، طبعة دار طيبة",
            desc: "من أشهر كتب التفسير بالمأثور، 8 مجلدات مقسومة على 4 ملفات PDF. للمتوسع بعد ما تقرأ تفسير مختصر. بيتحمّل من صفحة الأرشيف.",
            level: "متقدم",
            meta: "8 مجلدات في 4 ملفات",
            page: IA + "/details/way2sona_20180318"
        }

    ];

})();