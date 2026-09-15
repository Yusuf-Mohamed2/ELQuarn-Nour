/* =========================================================
   QURAN VOICE
   DATA.JS
========================================================= */


/* =========================================================
   READERS
========================================================= */

const readers = [

    // =========================
    // 🇸🇦 Saudi Arabia
    // =========================
    {
    id: "abdulati_nasif",
    name: "عبد العاطي ناصف",
    englishName: "Abdel Ati Nasif",
    country: "مصر",
    countryCode: "EG",
    initial: "ع", 
    photo: './images/abd.jpg'
    },

    {
    id: "ajmi",
    name: "أحمد بن علي العجمي",
    englishName: "Ahmed Al-Ajmi",
    country: "السعودية",
    countryCode: "SA",
    initial: "أ", 
    photo: './images/عجمي.jpg'
    },

    {
        id: "maher",
        name: "ماهر المعيقلي",
        englishName: "Maher Al-Muaiqly",
        country: "السعودية",
        countryCode: "SA",
        initial: "م", 
        photo: './images/ماهر.jpg'
    },

    {
        id: "yasser",
        name: "ياسر الدوسري",
        englishName: "Yasser Al-Dosari",
        country: "السعودية",
        countryCode: "SA",
        initial: "ي", 
        photo: './images/ياسر.jpg'
    },

    {
        id: "saad",
        name: "سعد الغامدي",
        englishName: "Saad Al-Ghamdi",
        country: "السعودية",
        countryCode: "SA",
        initial: "س", 
        photo: './images/سعد.jpg'
    },

    {
        id: "abdurrahman",
        name: "عبد الرحمن السديس",
        englishName: "Abdurrahman Al-Sudais",
        country: "السعودية",
        countryCode: "SA",
        initial: "ع", 
        photo: './images/سديس.jpg'
    },

    {
        id: "nasser",
        name: "ناصر القطامي",
        englishName: "Nasser Al-Qatami",
        country: "السعودية",
        countryCode: "SA",
        initial: "ن", 
        photo: './images/ناصر.jpg'
    },

    {
        id: "hani",
        name: "هاني الرفاعي",
        englishName: "Hani Al-Rifai",
        country: "السعودية",
        countryCode: "SA",
        initial: "ه", 
        photo: './images/هاني.jpg'
    },

    {
        id: "khalil",
        name: "خالد الجليل",
        englishName: "Khalid Al-Jalil",
        country: "السعودية",
        countryCode: "SA",
        initial: "خ", 
        photo: './images/خالد.jpg'
    },

    {
        id: "abdullah",
        name: "عبد الله خياط",
        englishName: "Abdullah Khayat",
        country: "السعودية",
        countryCode: "SA",
        initial: "ع", 
        photo: './images/خياط.jpg'
    },

    {
        id: "ali",
        name: "علي جابر",
        englishName: "Ali Jaber",
        country: "السعودية",
        countryCode: "SA",
        initial: "ع", 
        photo: './images/جابر.jpg'
    },

    {
        id: "abdulmuhsin",
        name: "عبد المحسن القاسم",
        englishName: "Abdulmuhsin Al-Qasim",
        country: "السعودية",
        countryCode: "SA",
        initial: "ع", 
        photo: './images/قاسم.jpg'
    },

    { id: "waleed",
         name: "وليد الشمسان",
          englishName: "Waleed Al-Shamsan",
           country: "السعودية",
            countryCode: "SA", initial: "و", photo: './images/شمسان.jpg' }
            ,
             { id: "badr", name: "بدر التركي", englishName: "Badr Al-Turki", country: "السعودية", countryCode: "SA", initial: "ب", photo: './images/تركي.jpg' },

    {
        id: "salah",
        name: "صلاح البدير",
        englishName: "Salah Al-Budair",
        country: "السعودية",
        countryCode: "SA",
        initial: "ص", photo: './images/بدير.jpg'
    },

    {
        id: "bandar",
        name: "بندر بليلة",
        englishName: "Bandar Baleela",
        country: "السعودية",
        countryCode: "SA",
        initial: "ب", photo: './images/بندر.jpg'
    },

    {
        id: "khalid",
        name: "خالد المهنا",
        englishName: "Khalid Al-Muhanna",
        country: "السعودية",
        countryCode: "SA",
        initial: "خ", photo: './images/مهنا.jpg'
    },

    {
        id: "ahmad",
        name: "أحمد الحذيفي",
        englishName: "Ahmad Al-Hudhaifi",
        country: "السعودية",
        countryCode: "SA",
        initial: "أ", photo: './images/حذيفي.jpg'
    },

    {
        id: "abdullah_awad",
        name: "عبد الله عواد الجهني",
        englishName: "Abdullah Awad Al-Juhani",
        country: "السعودية",
        countryCode: "SA",
        initial: "ع", photo: './images/جهني.jpg'
    },

    {
        id: "mohammed",
        name: "محمد أيوب",
        englishName: "Muhammad Ayyub",
        country: "السعودية",
        countryCode: "SA",
        initial: "م", photo: './images/ايوب.jpg'
    },

    {
        id: "saleh",
        name: "صالح آل طالب",
        englishName: "Saleh Al-Talib",
        country: "السعودية",
        countryCode: "SA",
        initial: "ص", photo: './images/طالب.jpg'
    },

    {
        id: "fahad",
        name: "فهد العتيبي",
        englishName: "Fahad Al-Otaibi",
        country: "السعودية",
        countryCode: "SA",
        initial: "ف", photo: './images/فهد.jpg'
    },

    // =========================
    // 🇪🇬 Egypt
    // =========================

    {
        id: "abdulbasit",
        name: "عبد الباسط عبد الصمد",
        englishName: "Abdul Basit Abdus-Samad",
        country: "مصر",
        countryCode: "EG",
        initial: "ع", photo: './images/باسط.jpg'
    },

    {
        id: "minshawi",
        name: "محمد صديق المنشاوي",
        englishName: "Muhammad Siddiq Al-Minshawi",
        country: "مصر",
        countryCode: "EG",
        initial: "م", photo: './images/منشاوي.jpg'
    },

    {
        id: "mahmoud_khalil",
        name: "محمود خليل الحصري",
        englishName: "Mahmoud Khalil Al-Husary",
        country: "مصر",
        countryCode: "EG",
        initial: "م", photo: './images/حصري.jpg'
    },

    {
        id: "mustafa",
        name: "مصطفى إسماعيل",
        englishName: "Mustafa Ismail",
        country: "مصر",
        countryCode: "EG",
        initial: "م", photo: './images/مصطفي.jpg'
    },

    {
        id: "rifai",
        name: "محمد محمود الطبلاوي",
        englishName: "Mohamed Mahmoud Al-Tablawi",
        country: "مصر",
        countryCode: "EG",
        initial: "م", photo: './images/طبلاوي.jpg'
    },

    {
        id: "abdulrahman",
        name: "عبد الرحمن عبد الخالق",
        englishName: "Abdulrahman Abdulkhaliq",
        country: "مصر",
        countryCode: "EG",
        initial: "ع", photo: null
    },

    {
        id: "mohamed_siddiq",
        name: "محمود علي البنا",
        englishName: "Mahmoud Ali Al-Banna",
        country: "مصر",
        countryCode: "EG",
        initial: "م", photo: './images/بنا.jpg'
    },

    {
        id: "abdelhakim",
        name: "عبد الحكيم عبد اللطيف",
        englishName: "Abdel Hakim Abdel Latif",
        country: "مصر",
        countryCode: "EG",
        initial: "ع", photo: './images/الحكيم.jpg'
    },

    {
        id: "taha",
        name: "طه الفشني",
        englishName: "Taha Al-Fashni",
        country: "مصر",
        countryCode: "EG",
        initial: "ط", photo: './images/فشني.jpg'
    },

    {
        id: "kamel",
        name: "كامل يوسف البهتيمي",
        englishName: "Kamel Youssef Al-Bahtimi",
        country: "مصر",
        countryCode: "EG",
        initial: "ك", photo: './images/كامل.jpg'
    },

    {
        id: "ahmad_nuaina",
        name: "أحمد نعينع",
        englishName: "Ahmed Nuaina",
        country: "مصر",
        countryCode: "EG",
        initial: "أ", 
        photo: './images/نعينع.jpg'
    },

    {
        id: "muhammad_jibril",
        name: "محمد جبريل",
        englishName: "Muhammad Jibreel",
        country: "مصر",
        countryCode: "EG",
        initial: "م", 
        photo: './images/محمد.jpg'
    },

    {
        id: "mahmoud_taha",
        name: "محمود صابر",
        englishName: "Mahmoud Saber",
        country: "مصر",
        countryCode: "EG",
        initial: "م", 
        photo: './images/mahmoud.jpg'
    },

    {
        id: "farag",
        name: "فرج الله الشاذلي",
        englishName: "Farag Al-Shazly",
        country: "مصر",
        countryCode: "EG",
        initial: "ف",
        photo: './images/farag.jpg'
    },

    {
        id: "abdullah_kamel",
        name: "عبد الله كامل",
        englishName: "Abdullah Kamel",
        country: "مصر",
        countryCode: "EG",
        initial: "ع",
        photo: './images/abdullah.jpg'
    },

    // =========================
    // 🇰🇼 Kuwait
    // =========================

    {
        id: "mishary",
        name: "مشاري راشد العفاسي",
        englishName: "Mishary Rashid Alafasy",
        country: "الكويت",
        countryCode: "KW",
        initial: "م",
        photo: 'https://i1.sndcdn.com/artworks-000175802185-orujwu-t500x500.jpg'
    }

];


/* =========================================================
   SURAHS
========================================================= */

const surahs = [

    {
        id: 1,
        name: "الفاتحة",
        englishName: "Al-Fatihah",
        ayahs: 7
    },

    {
        id: 2,
        name: "البقرة",
        englishName: "Al-Baqarah",
        ayahs: 286
    },

    {
        id: 3,
        name: "آل عمران",
        englishName: "Aal-E-Imran",
        ayahs: 200
    },

    {
        id: 4,
        name: "النساء",
        englishName: "An-Nisa",
        ayahs: 176
    },

    {
        id: 5,
        name: "المائدة",
        englishName: "Al-Maidah",
        ayahs: 120
    },

    {
        id: 6,
        name: "الأنعام",
        englishName: "Al-Anam",
        ayahs: 165
    },

    {
        id: 7,
        name: "الأعراف",
        englishName: "Al-Araf",
        ayahs: 206
    },

    {
        id: 8,
        name: "الأنفال",
        englishName: "Al-Anfal",
        ayahs: 75
    },

    {
        id: 9,
        name: "التوبة",
        englishName: "At-Tawbah",
        ayahs: 129
    },

    {
        id: 10,
        name: "يونس",
        englishName: "Yunus",
        ayahs: 109
    },

    {
        id: 11,
        name: "هود",
        englishName: "Hud",
        ayahs: 123
    },

    {
        id: 12,
        name: "يوسف",
        englishName: "Yusuf",
        ayahs: 111
    },

    {
        id: 13,
        name: "الرعد",
        englishName: "Ar-Rad",
        ayahs: 43
    },

    {
        id: 14,
        name: "إبراهيم",
        englishName: "Ibrahim",
        ayahs: 52
    },

    {
        id: 15,
        name: "الحجر",
        englishName: "Al-Hijr",
        ayahs: 99
    },

    {
        id: 16,
        name: "النحل",
        englishName: "An-Nahl",
        ayahs: 128
    },

    {
        id: 17,
        name: "الإسراء",
        englishName: "Al-Isra",
        ayahs: 111
    },

    {
        id: 18,
        name: "الكهف",
        englishName: "Al-Kahf",
        ayahs: 110
    },

    {
        id: 19,
        name: "مريم",
        englishName: "Maryam",
        ayahs: 98
    },

    {
        id: 20,
        name: "طه",
        englishName: "Ta-Ha",
        ayahs: 135
    },

    {
        id: 21,
        name: "الأنبياء",
        englishName: "Al-Anbiya",
        ayahs: 112
    },

    {
        id: 22,
        name: "الحج",
        englishName: "Al-Hajj",
        ayahs: 78
    },

    {
        id: 23,
        name: "المؤمنون",
        englishName: "Al-Muminun",
        ayahs: 118
    },

    {
        id: 24,
        name: "النور",
        englishName: "An-Nur",
        ayahs: 64
    },

    {
        id: 25,
        name: "الفرقان",
        englishName: "Al-Furqan",
        ayahs: 77
    },

    {
        id: 26,
        name: "الشعراء",
        englishName: "Ash-Shuara",
        ayahs: 227
    },

    {
        id: 27,
        name: "النمل",
        englishName: "An-Naml",
        ayahs: 93
    },

    {
        id: 28,
        name: "القصص",
        englishName: "Al-Qasas",
        ayahs: 88
    },

    {
        id: 29,
        name: "العنكبوت",
        englishName: "Al-Ankabut",
        ayahs: 69
    },

    {
        id: 30,
        name: "الروم",
        englishName: "Ar-Rum",
        ayahs: 60
    },

    {
        id: 31,
        name: "لقمان",
        englishName: "Luqman",
        ayahs: 34
    },

    {
        id: 32,
        name: "السجدة",
        englishName: "As-Sajdah",
        ayahs: 30
    },

    {
        id: 33,
        name: "الأحزاب",
        englishName: "Al-Ahzab",
        ayahs: 73
    },

    {
        id: 34,
        name: "سبأ",
        englishName: "Saba",
        ayahs: 54
    },

    {
        id: 35,
        name: "فاطر",
        englishName: "Fatir",
        ayahs: 45
    },

    {
        id: 36,
        name: "يس",
        englishName: "Ya-Sin",
        ayahs: 83
    },

    {
        id: 37,
        name: "الصافات",
        englishName: "As-Saffat",
        ayahs: 182
    },

    {
        id: 38,
        name: "ص",
        englishName: "Sad",
        ayahs: 88
    },

    {
        id: 39,
        name: "الزمر",
        englishName: "Az-Zumar",
        ayahs: 75
    },

    {
        id: 40,
        name: "غافر",
        englishName: "Ghafir",
        ayahs: 85
    },

    {
        id: 41,
        name: "فصلت",
        englishName: "Fussilat",
        ayahs: 54
    },

    {
        id: 42,
        name: "الشورى",
        englishName: "Ash-Shura",
        ayahs: 53
    },

    {
        id: 43,
        name: "الزخرف",
        englishName: "Az-Zukhruf",
        ayahs: 89
    },

    {
        id: 44,
        name: "الدخان",
        englishName: "Ad-Dukhan",
        ayahs: 59
    },

    {
        id: 45,
        name: "الجاثية",
        englishName: "Al-Jathiyah",
        ayahs: 37
    },

    {
        id: 46,
        name: "الأحقاف",
        englishName: "Al-Ahqaf",
        ayahs: 35
    },

    {
        id: 47,
        name: "محمد",
        englishName: "Muhammad",
        ayahs: 38
    },

    {
        id: 48,
        name: "الفتح",
        englishName: "Al-Fath",
        ayahs: 29
    },

    {
        id: 49,
        name: "الحجرات",
        englishName: "Al-Hujurat",
        ayahs: 18
    },

    {
        id: 50,
        name: "ق",
        englishName: "Qaf",
        ayahs: 45
    },

    {
        id: 51,
        name: "الذاريات",
        englishName: "Adh-Dhariyat",
        ayahs: 60
    },

    {
        id: 52,
        name: "الطور",
        englishName: "At-Tur",
        ayahs: 49
    },

    {
        id: 53,
        name: "النجم",
        englishName: "An-Najm",
        ayahs: 62
    },

    {
        id: 54,
        name: "القمر",
        englishName: "Al-Qamar",
        ayahs: 55
    },

    {
        id: 55,
        name: "الرحمن",
        englishName: "Ar-Rahman",
        ayahs: 78
    },

    {
        id: 56,
        name: "الواقعة",
        englishName: "Al-Waqiah",
        ayahs: 96
    },

    {
        id: 57,
        name: "الحديد",
        englishName: "Al-Hadid",
        ayahs: 29
    },

    {
        id: 58,
        name: "المجادلة",
        englishName: "Al-Mujadilah",
        ayahs: 22
    },

    {
        id: 59,
        name: "الحشر",
        englishName: "Al-Hashr",
        ayahs: 24
    },

    {
        id: 60,
        name: "الممتحنة",
        englishName: "Al-Mumtahanah",
        ayahs: 13
    },

    {
        id: 61,
        name: "الصف",
        englishName: "As-Saff",
        ayahs: 14
    },

    {
        id: 62,
        name: "الجمعة",
        englishName: "Al-Jumuah",
        ayahs: 11
    },

    {
        id: 63,
        name: "المنافقون",
        englishName: "Al-Munafiqun",
        ayahs: 11
    },

    {
        id: 64,
        name: "التغابن",
        englishName: "At-Taghabun",
        ayahs: 18
    },

    {
        id: 65,
        name: "الطلاق",
        englishName: "At-Talaq",
        ayahs: 12
    },

    {
        id: 66,
        name: "التحريم",
        englishName: "At-Tahrim",
        ayahs: 12
    },

    {
        id: 67,
        name: "الملك",
        englishName: "Al-Mulk",
        ayahs: 30
    },

    {
        id: 68,
        name: "القلم",
        englishName: "Al-Qalam",
        ayahs: 52
    },

    {
        id: 69,
        name: "الحاقة",
        englishName: "Al-Haqqah",
        ayahs: 52
    },

    {
        id: 70,
        name: "المعارج",
        englishName: "Al-Maarij",
        ayahs: 44
    },

    {
        id: 71,
        name: "نوح",
        englishName: "Nuh",
        ayahs: 28
    },

    {
        id: 72,
        name: "الجن",
        englishName: "Al-Jinn",
        ayahs: 28
    },

    {
        id: 73,
        name: "المزمل",
        englishName: "Al-Muzzammil",
        ayahs: 20
    },

    {
        id: 74,
        name: "المدثر",
        englishName: "Al-Muddaththir",
        ayahs: 56
    },

    {
        id: 75,
        name: "القيامة",
        englishName: "Al-Qiyamah",
        ayahs: 40
    },

    {
        id: 76,
        name: "الإنسان",
        englishName: "Al-Insan",
        ayahs: 31
    },

    {
        id: 77,
        name: "المرسلات",
        englishName: "Al-Mursalat",
        ayahs: 50
    },

    {
        id: 78,
        name: "النبأ",
        englishName: "An-Naba",
        ayahs: 40
    },

    {
        id: 79,
        name: "النازعات",
        englishName: "An-Naziat",
        ayahs: 46
    },

    {
        id: 80,
        name: "عبس",
        englishName: "Abasa",
        ayahs: 42
    },

    {
        id: 81,
        name: "التكوير",
        englishName: "At-Takwir",
        ayahs: 29
    },

    {
        id: 82,
        name: "الانفطار",
        englishName: "Al-Infitar",
        ayahs: 19
    },

    {
        id: 83,
        name: "المطففين",
        englishName: "Al-Mutaffifin",
        ayahs: 36
    },

    {
        id: 84,
        name: "الانشقاق",
        englishName: "Al-Inshiqaq",
        ayahs: 25
    },

    {
        id: 85,
        name: "البروج",
        englishName: "Al-Buruj",
        ayahs: 22
    },

    {
        id: 86,
        name: "الطارق",
        englishName: "At-Tariq",
        ayahs: 17
    },

    {
        id: 87,
        name: "الأعلى",
        englishName: "Al-Ala",
        ayahs: 19
    },

    {
        id: 88,
        name: "الغاشية",
        englishName: "Al-Ghashiyah",
        ayahs: 26
    },

    {
        id: 89,
        name: "الفجر",
        englishName: "Al-Fajr",
        ayahs: 30
    },

    {
        id: 90,
        name: "البلد",
        englishName: "Al-Balad",
        ayahs: 20
    },

    {
        id: 91,
        name: "الشمس",
        englishName: "Ash-Shams",
        ayahs: 15
    },

    {
        id: 92,
        name: "الليل",
        englishName: "Al-Layl",
        ayahs: 21
    },

    {
        id: 93,
        name: "الضحى",
        englishName: "Ad-Duha",
        ayahs: 11
    },

    {
        id: 94,
        name: "الشرح",
        englishName: "Ash-Sharh",
        ayahs: 8
    },

    {
        id: 95,
        name: "التين",
        englishName: "At-Tin",
        ayahs: 8
    },

    {
        id: 96,
        name: "العلق",
        englishName: "Al-Alaq",
        ayahs: 19
    },

    {
        id: 97,
        name: "القدر",
        englishName: "Al-Qadr",
        ayahs: 5
    },

    {
        id: 98,
        name: "البينة",
        englishName: "Al-Bayyinah",
        ayahs: 8
    },

    {
        id: 99,
        name: "الزلزلة",
        englishName: "Az-Zalzalah",
        ayahs: 8
    },

    {
        id: 100,
        name: "العاديات",
        englishName: "Al-Adiyat",
        ayahs: 11
    },

    {
        id: 101,
        name: "القارعة",
        englishName: "Al-Qariah",
        ayahs: 11
    },

    {
        id: 102,
        name: "التكاثر",
        englishName: "At-Takathur",
        ayahs: 8
    },

    {
        id: 103,
        name: "العصر",
        englishName: "Al-Asr",
        ayahs: 3
    },

    {
        id: 104,
        name: "الهمزة",
        englishName: "Al-Humazah",
        ayahs: 9
    },

    {
        id: 105,
        name: "الفيل",
        englishName: "Al-Fil",
        ayahs: 5
    },

    {
        id: 106,
        name: "قريش",
        englishName: "Quraysh",
        ayahs: 4
    },

    {
        id: 107,
        name: "الماعون",
        englishName: "Al-Maun",
        ayahs: 7
    },

    {
        id: 108,
        name: "الكوثر",
        englishName: "Al-Kawthar",
        ayahs: 3
    },

    {
        id: 109,
        name: "الكافرون",
        englishName: "Al-Kafirun",
        ayahs: 6
    },

    {
        id: 110,
        name: "النصر",
        englishName: "An-Nasr",
        ayahs: 3
    },

    {
        id: 111,
        name: "المسد",
        englishName: "Al-Masad",
        ayahs: 5
    },

    {
        id: 112,
        name: "الإخلاص",
        englishName: "Al-Ikhlas",
        ayahs: 4
    },

    {
        id: 113,
        name: "الفلق",
        englishName: "Al-Falaq",
        ayahs: 5
    },

    {
        id: 114,
        name: "الناس",
        englishName: "An-Nas",
        ayahs: 6
    }

];


/* =========================================================
   GET READER
========================================================= */

function getReaderById(id) {

    return readers.find(
        reader =>
            reader.id === id
    );

}


/* =========================================================
   GET SURAH
========================================================= */

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
        normalizeArabic(query);


    if (!text) {

        return readers;

    }


    return readers.filter(
        reader =>

            normalizeArabic(
                reader.name
            ).includes(text) ||

            normalizeArabic(
                reader.englishName
            ).includes(text) ||

            normalizeArabic(
                reader.country
            ).includes(text)

    );

}


/* =========================================================
   SEARCH SURAHS
========================================================= */

function searchSurahs(query) {

    const text =
        normalizeArabic(query);


    if (!text) {

        return surahs;

    }


    return surahs.filter(
        surah =>

            normalizeArabic(
                surah.name
            ).includes(text) ||

            normalizeArabic(
                surah.englishName
            ).includes(text)

    );

}


/* =========================================================
   READER ALIASES
========================================================= */

const readerAliases = {

    // =========================
    // Maher
    // =========================
    // =========================
// Ahmed Al-Ajmi
// =========================
// =========================
// Abdel Ati Nasif
// =========================

    "عبد العاطي": "abdulati_nasif",
    "عبدالعاطي": "abdulati_nasif",
    "ناصف": "abdulati_nasif",
    "عبد العاطي ناصف": "abdulati_nasif",
    "عبدالعاطي ناصف": "abdulati_nasif",
    "الشيخ عبد العاطي ناصف": "abdulati_nasif",

    "العجمي": "ajmi",
    "أحمد العجمي": "ajmi",
    "احمد العجمي": "ajmi",
    "أحمد بن علي العجمي": "ajmi",
    "احمد بن علي العجمي": "ajmi",
    "الشيخ العجمي": "ajmi",
    "الشيخ أحمد العجمي": "ajmi",

    "ماهر": "maher",
    "ماهر المعيقلي": "maher",
    "الشيخ ماهر": "maher",
    "الشيخ ماهر المعيقلي": "maher",

    // =========================
    // Yasser Al-Dosari
    // =========================

    "ياسر": "yasser",
    "ياسر الدوسري": "yasser",
    "الشيخ ياسر": "yasser",
    "الشيخ ياسر الدوسري": "yasser",

    // =========================
    // Saad Al-Ghamdi
    // =========================

    "سعد": "saad",
    "سعد الغامدي": "saad",
    "الغامدي": "saad",

    // =========================
    // Al-Sudais
    // =========================

    "السديس": "abdurrahman",
    "عبد الرحمن السديس": "abdurrahman",
    "عبدالرحمن السديس": "abdurrahman",
    "الشيخ السديس": "abdurrahman",

    // =========================
    // Nasser Al-Qatami
    // =========================

    "ناصر": "nasser",
    "ناصر القطامي": "nasser",
    "القطامي": "nasser",

    // =========================
    // Hani Al-Rifai
    // =========================

    "هاني": "hani",
    "هاني الرفاعي": "hani",
    "الرفاعي": "hani",

    // =========================
    // Khalid Al-Jalil
    // =========================

    "خالد الجليل": "khalil",
    "الجليل": "khalil",

    // =========================
    // Abdullah Khayat
    // =========================

    "عبد الله خياط": "abdullah",
    "عبدالله خياط": "abdullah",
    "الخياط": "abdullah",

    // =========================
    // Ali Jaber
    // =========================

    "علي جابر": "ali",
    "علي": "ali",

    // =========================
    // Abdulmuhsin Al-Qasim
    // =========================

    "عبد المحسن القاسم": "abdulmuhsin",
    "عبدالمحسن القاسم": "abdulmuhsin",
    "القاسم": "abdulmuhsin",

    // =========================
    // Salah Al-Budair
    // =========================

    "صلاح البدير": "salah",
    "البدير": "salah",
    "صلاح": "salah",

    // =========================
    // Bandar Baleela
    // =========================

    "بندر بليلة": "bandar",
    "بندر": "bandar",
    "بليلة": "bandar",

    "وليد الشمسان": "waleed",
     "الشمسان": "waleed",
      "وليد": "waleed",

       "بدر التركي": "badr",
        "التركي": "badr",
         "بدر": "badr",

    // =========================
    // Khalid Al-Muhanna
    // =========================

    "خالد المهنا": "khalid",
    "المهنا": "khalid",

    // =========================
    // Ahmad Al-Hudhaifi
    // =========================

    "أحمد الحذيفي": "ahmad",
    "احمد الحذيفي": "ahmad",
    "الحذيفي": "ahmad",

    // =========================
    // Abdullah Al-Juhani
    // =========================

    "عبد الله عواد الجهني": "abdullah_awad",
    "عبدالله عواد الجهني": "abdullah_awad",
    "الجهني": "abdullah_awad",

    // =========================
    // Muhammad Ayyub
    // =========================

    "محمد أيوب": "mohammed",
    "محمد": "mohammed",
    "أيوب": "mohammed",

    // =========================
    // Saleh Al-Talib
    // =========================

    "صالح آل طالب": "saleh",
    "صالح الطالب": "saleh",
    "آل طالب": "saleh",

    // =========================
    // Fahad Al-Otaibi
    // =========================

    "فهد العتيبي": "fahad",
    "العتيبي": "fahad",
    "فهد": "fahad",

    // =========================
    // Abdul Basit
    // =========================

    "عبد الباسط": "abdulbasit",
    "عبدالباسط": "abdulbasit",
    "عبد الباسط عبد الصمد": "abdulbasit",
    "الشيخ عبد الباسط": "abdulbasit",

    // =========================
    // Al-Minshawi
    // =========================

    "المنشاوي": "minshawi",
    "المنشاوى": "minshawi",
    "محمد المنشاوي": "minshawi",
    "محمد صديق المنشاوي": "minshawi",
    "الشيخ المنشاوي": "minshawi",

    // =========================
    // Al-Husary
    // =========================

    "الحصري": "mahmoud_khalil",
    "محمود خليل الحصري": "mahmoud_khalil",
    "محمود الحصري": "mahmoud_khalil",
    "الشيخ الحصري": "mahmoud_khalil",

    // =========================
    // Mustafa Ismail
    // =========================

    "مصطفى إسماعيل": "mustafa",
    "مصطفى اسماعيل": "mustafa",
    "مصطفى": "mustafa",

    // =========================
    // Al-Tablawi
    // =========================

    "الطبلاوي": "rifai",
    "محمد محمود الطبلاوي": "rifai",
    "محمد الطبلاوي": "rifai",

    // =========================
    // Taha Al-Fashni
    // =========================

    "طه الفشني": "taha",
    "الفشني": "taha",

    // =========================
    // Kamel Al-Bahtimi
    // =========================

    "كامل يوسف البهتيمي": "kamel",
    "البهتيمي": "kamel",
    "كامل البهتيمي": "kamel",

    // =========================
    // Ahmed Nuaina
    // =========================

    "أحمد نعينع": "ahmad_nuaina",
    "احمد نعينع": "ahmad_nuaina",
    "نعينع": "ahmad_nuaina",

    // =========================
    // Muhammad Jibreel
    // =========================

    "محمد جبريل": "muhammad_jibril",
    "جبريل": "muhammad_jibril",

    // =========================
    // Abdullah Kamel
    // =========================

    "عبد الله كامل": "abdullah_kamel",
    "عبدالله كامل": "abdullah_kamel",

    // =========================
    // Mahmoud Ali Al-Banna
    // =========================

    "محمود علي البنا": "mohamed_siddiq",
    "محمود البنا": "mohamed_siddiq",
    "البنا": "mohamed_siddiq",

    // =========================
    // Mishary
    // =========================

    "مشاري": "mishary",
    "مشاري العفاسي": "mishary",
    "مشاري راشد": "mishary",
    "مشاري راشد العفاسي": "mishary",
    "العفاسي": "mishary"

};


/* =========================================================
   RECITATION STYLE ALIASES (ترتيل / تجويد)
   ملاحظة: بيتقال في الأمر الصوتي مع اسم الشيخ/السورة،
   وبيتحول لقيمة موحدة (murattal / mujawwad) نستخدمها
   بعد كده في اختيار "المصحف" (moshaf) المناسب من mp3quran.
========================================================= */

const recitationStyleAliases = {

    "ترتيل": "murattal",
    "بالترتيل": "murattal",
    "مرتل": "murattal",
    "بصوت مرتل": "murattal",
    "تلاوة مرتلة": "murattal",
    "تلاوه مرتله": "murattal",
    "عادي": "murattal",
    "عاديه": "murattal",
    "عادية": "murattal",

    "تجويد": "mujawwad",
    "بالتجويد": "mujawwad",
    "مجود": "mujawwad",
    "مجوّد": "mujawwad",
    "بصوت مجود": "mujawwad",
    "تلاوة مجودة": "mujawwad",
    "تلاوه مجوده": "mujawwad",
    "معلم": "mujawwad",
    "تعليمي": "mujawwad"

};

/* =========================================================
   RIWAYA (QIRAA) ALIASES - أسماء القراءات/الروايات
   بتتقال في الأمر الصوتي زي "شغل سورة يس بصوت
   السديس برواية ورش"، وبنستخدمها بعد كده للبحث
   جوه اسم "المصحف" (moshaf.name) القادم من mp3quran.
========================================================= */

const riwayaAliases = {

    "حفص": "hafs",
    "حفص عن عاصم": "hafs",
    "رواية حفص": "hafs",
    "روايه حفص": "hafs",
    "قراءة حفص": "hafs",
    "قراءه حفص": "hafs",

    "ورش": "warsh",
    "ورش عن نافع": "warsh",
    "رواية ورش": "warsh",
    "روايه ورش": "warsh",
    "قراءة ورش": "warsh",
    "قراءه ورش": "warsh",

    "قالون": "qalun",
    "قالون عن نافع": "qalun",
    "رواية قالون": "qalun",
    "روايه قالون": "qalun",

    "الدوري عن ابي عمرو": "douri_abuamr",
    "الدوري عن أبي عمرو": "douri_abuamr",
    "الدوري": "douri_abuamr",
    "دوري": "douri_abuamr",

    "السوسي": "susi",
    "سوسي": "susi",
    "رواية السوسي": "susi",

    "شعبة": "shubah",
    "شعبه": "shubah",
    "شعبة عن عاصم": "shubah",
    "رواية شعبة": "shubah",

    "خلاد": "khallad",
    "رواية خلاد": "khallad",

    "خلف": "khalaf",
    "خلف عن حمزة": "khalaf",
    "رواية خلف": "khalaf",

    "هشام": "hisham",
    "هشام عن ابن عامر": "hisham",
    "رواية هشام": "hisham",

    "ابن ذكوان": "ibnzakwan",
    "رواية ابن ذكوان": "ibnzakwan",

    "قنبل": "qunbul",
    "رواية قنبل": "qunbul",

    "البزي": "bazzi",
    "رواية البزي": "bazzi",

    "أبو الحارث": "abualharith",
    "ابو الحارث": "abualharith",

    "رويس": "ruways",
    "رواية رويس": "ruways",

    "روح": "rawh",
    "رواية روح": "rawh"

};

/*
    كل رواية ممكن تتكتب بأكتر من صيغة جوه اسم "المصحف"
    نفسه عند mp3quran (مثلاً: "حفص عن عاصم" أو "حفص")،
    فبنبحث بأي كلمة من الكلمات دي جوه اسم المصحف.
*/

const riwayaSearchTerms = {

    hafs: ["حفص"],
    warsh: ["ورش"],
    qalun: ["قالون"],
    douri_abuamr: ["الدوري عن ابي عمرو", "دوري"],
    susi: ["السوسي", "سوسي"],
    shubah: ["شعبة", "شعبه"],
    khallad: ["خلاد"],
    khalaf: ["خلف"],
    hisham: ["هشام"],
    ibnzakwan: ["ابن ذكوان", "ذكوان"],
    qunbul: ["قنبل"],
    bazzi: ["البزي", "بزي"],
    abualharith: ["ابو الحارث"],
    ruways: ["رويس"],
    rawh: ["روح"]

};

/* اسم عرض عربي لكل رواية، يستخدم في رسائل الحالة */

const riwayaDisplayNames = {

    hafs: "حفص عن عاصم",
    warsh: "ورش عن نافع",
    qalun: "قالون عن نافع",
    douri_abuamr: "الدوري عن أبي عمرو",
    susi: "السوسي عن أبي عمرو",
    shubah: "شعبة عن عاصم",
    khallad: "خلاد عن حمزة",
    khalaf: "خلف عن حمزة",
    hisham: "هشام عن ابن عامر",
    ibnzakwan: "ابن ذكوان عن ابن عامر",
    qunbul: "قنبل عن ابن كثير",
    bazzi: "البزي عن ابن كثير",
    abualharith: "أبو الحارث عن الكسائي",
    ruways: "رويس عن يعقوب",
    rawh: "روح عن يعقوب"

};


/* =========================================================
   SURAH ALIASES
========================================================= */

const surahAliases = {

    "الفاتحة": 1,
    "فاتحة": 1,
    "ام الكتاب": 1,

    "البقرة": 2,
    "بقرة": 2,

    "آل عمران": 3,
    "ال عمران": 3,
    "عمران": 3,

    "النساء": 4,
    "نساء": 4,

    "المائدة": 5,
    "المائده": 5,
    "مائدة": 5,

    "الأنعام": 6,
    "الانعام": 6,
    "أنعام": 6,

    "الأعراف": 7,
    "الاعراف": 7,
    "أعراف": 7,

    "الأنفال": 8,
    "الانفال": 8,
    "أنفال": 8,

    "التوبة": 9,
    "التوبه": 9,
    "توبة": 9,

    "يونس": 10,

    "هود": 11,

    "يوسف": 12,

    "الرعد": 13,

    "إبراهيم": 14,
    "ابراهيم": 14,

    "الحجر": 15,

    "النحل": 16,

    "الإسراء": 17,
    "الاسراء": 17,

    "الكهف": 18,
    "كهف": 18,

    "مريم": 19,

    "طه": 20,

    "الأنبياء": 21,
    "الانبياء": 21,
    "أنبياء": 21,

    "الحج": 22,

    "المؤمنون": 23,
    "المؤمنون": 23,

    "النور": 24,

    "الفرقان": 25,

    "الشعراء": 26,

    "النمل": 27,

    "القصص": 28,

    "العنكبوت": 29,

    "الروم": 30,

    "لقمان": 31,

    "السجدة": 32,
    "السجده": 32,

    "الأحزاب": 33,
    "الاحزاب": 33,

    "سبأ": 34,
    "سبا": 34,

    "فاطر": 35,

    "يس": 36,
    "ياسين": 36,
    "يٰس": 36,

    "الصافات": 37,
    "الصافات": 37,

    "ص": 38,

    "الزمر": 39,

    "غافر": 40,

    "فصلت": 41,

    "الشورى": 42,
    "الشورى": 42,

    "الزخرف": 43,

    "الدخان": 44,

    "الجاثية": 45,

    "الأحقاف": 46,
    "الاحقاف": 46,

    "محمد": 47,

    "الفتح": 48,

    "الحجرات": 49,

    "ق": 50,

    "الذاريات": 51,

    "الطور": 52,

    "النجم": 53,

    "القمر": 54,

    "الرحمن": 55,
    "رحمن": 55,

    "الواقعة": 56,
    "الواقعه": 56,
    "واقعة": 56,
    "واقعه": 56,

    "الحديد": 57,

    "المجادلة": 58,
    "المجادله": 58,

    "الحشر": 59,

    "الممتحنة": 60,
    "الممتحنه": 60,

    "الصف": 61,

    "الجمعة": 62,
    "الجمعه": 62,

    "المنافقون": 63,

    "التغابن": 64,

    "الطلاق": 65,

    "التحريم": 66,

    "الملك": 67,
    "ملك": 67,

    "القلم": 68,

    "الحاقة": 69,
    "الحاقه": 69,

    "المعارج": 70,

    "نوح": 71,

    "الجن": 72,

    "المزمل": 73,

    "المدثر": 74,

    "القيامة": 75,
    "القيامه": 75,

    "الإنسان": 76,
    "الانسان": 76,

    "المرسلات": 77,

    "النبأ": 78,
    "النبا": 78,

    "النازعات": 79,

    "عبس": 80,

    "التكوير": 81,

    "الانفطار": 82,
    "الإنفطار": 82,

    "المطففين": 83,

    "الانشقاق": 84,

    "البروج": 85,

    "الطارق": 86,

    "الأعلى": 87,
    "الاعلى": 87,

    "الغاشية": 88,
    "الغاشيه": 88,

    "الفجر": 89,

    "البلد": 90,

    "الشمس": 91,

    "الليل": 92,

    "الضحى": 93,
    "الضحا": 93,

    "الشرح": 94,
    "ألم نشرح": 94,

    "التين": 95,

    "العلق": 96,

    "القدر": 97,

    "البينة": 98,
    "البينه": 98,

    "الزلزلة": 99,
    "الزلزله": 99,

    "العاديات": 100,

    "القارعة": 101,
    "القارعه": 101,

    "التكاثر": 102,

    "العصر": 103,

    "الهمزة": 104,
    "الهمزه": 104,

    "الفيل": 105,

    "قريش": 106,

    "الماعون": 107,

    "الكوثر": 108,

    "الكافرون": 109,

    "النصر": 110,

    "المسد": 111,
    "تبت": 111,

    "الإخلاص": 112,
    "الاخلاص": 112,
    "إخلاص": 112,

    "الفلق": 113,

    "الناس": 114

};


/* =========================================================
   NORMALIZE ARABIC
========================================================= */

function normalizeArabic(text) {

    return String(text || "")
        .trim()
        .toLowerCase()

        /* Tashkeel */

        .replace(
            /[\u064B-\u065F\u0670\u06D6-\u06ED]/g,
            ""
        )

        /* Tatweel */

        .replace(
            /ـ/g,
            ""
        )

        /* Alef */

        .replace(
            /[أإآٱ]/g,
            "ا"
        )

        /* Ta Marbuta */

        .replace(
            /ة/g,
            "ه"
        )

        /* Alef Maqsura */

        .replace(
            /ى/g,
            "ي"
        )

        /* Waw Hamza */

        .replace(
            /ؤ/g,
            "و"
        )

        /* Ya Hamza */

        .replace(
            /ئ/g,
            "ي"
        )

        /* Spaces */

        .replace(
            /\s+/g,
            " "
        );

}


/* =========================================================
   FIND READER FROM COMMAND
========================================================= */

function findReaderFromCommand(command) {

    const normalizedCommand =
        normalizeArabic(command);


    const aliases =
        Object.entries(
            readerAliases
        )

        .map(
            ([alias, id]) => ({

                alias:
                    normalizeArabic(alias),

                id

            })
        )

        .sort(
            (a, b) =>
                b.alias.length -
                a.alias.length
        );


    /* -----------------------------------------
       Exact word / phrase
    ----------------------------------------- */

    for (
        const item of aliases
    ) {

        if (!item.alias) {
            continue;
        }


        const regex =
            new RegExp(
                `(?:^|\\s)${escapeRegExp(item.alias)}(?:$|\\s)`,
                "u"
            );


        if (
            regex.test(
                normalizedCommand
            )
        ) {

            return getReaderById(
                item.id
            );

        }

    }


    /* -----------------------------------------
       Fallback
    ----------------------------------------- */

    for (
        const item of aliases
    ) {

        if (
            item.alias.length <= 1
        ) {

            continue;

        }


        if (
            normalizedCommand.includes(
                item.alias
            )
        ) {

            return getReaderById(
                item.id
            );

        }

    }


    return null;

}


/* =========================================================
   FIND SURAH FROM COMMAND
========================================================= */

function findSurahFromCommand(command) {

    const normalizedCommand =
        normalizeArabic(command);


    const aliases =
        Object.entries(
            surahAliases
        )

        .map(
            ([alias, id]) => ({

                alias:
                    normalizeArabic(alias),

                id

            })
        )

        .sort(
            (a, b) =>
                b.alias.length -
                a.alias.length
        );


    for (
        const item of aliases
    ) {

        if (!item.alias) {
            continue;
        }


        /*
            Special case:
            ق
            ص
        */

        if (
            item.alias === "ق" ||
            item.alias === "ص"
        ) {

            const regex =
                new RegExp(
                    `(?:^|\\s)${escapeRegExp(item.alias)}(?:$|\\s)`,
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
                `(?:^|\\s)${escapeRegExp(item.alias)}(?:$|\\s)`,
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

    for (
        const item of aliases
    ) {

        if (
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