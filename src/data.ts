import { BookOpen, GraduationCap, Headphones, MessageCircle, FileText, PenTool, Wrench, Plane, Star } from 'lucide-react';

// Language translations
export interface Translation {
  [key: string]: {
    zh: string;
    jp: string;
  };
}

export const translations: Translation = {
  // Header
  title: { zh: '日语导航', jp: '日本語HUB' },
  
  // Navigation
  home: { zh: '首页', jp: 'ホーム' },
  basicLearning: { zh: '基础学习', jp: '五十音基礎' },
  examPrep: { zh: '考试准备', jp: 'JLPT試験' },
  listening: { zh: '听力练习', jp: '聞く' },
  speaking: { zh: '口语练习', jp: '話す' },
  reading: { zh: '阅读练习', jp: '読む' },
  writing: { zh: '写作论文', jp: '書く' },
  tools: { zh: '工具词典', jp: '辞書' },
  studyInJapan: { zh: '留学就业', jp: '留学就活' },
  weeklyPicks: { zh: '每周推荐', jp: 'おすすめ' },
  
  // Main content
  searchPlaceholder: { zh: '搜索资源...', jp: '探します...' },
  searchResults: { zh: '搜索结果', jp: '検索結果' },
  welcomeTitle: { zh: '欢迎来到日语学习中心', jp: 'ようこそ、日本語Hubへ' },
  welcomeDesc: { zh: '您的日语学习综合资源中心。发现精选的学习材料、工具和各级别的练习资源。', jp: '日本語学習の総合リソースサイト。レベル別の教材やツール、練習素材を紹介します' },
  todaysPhrase: { zh: '今日短语', jp: "今日の単語" },
  resourcesAvailable: { zh: '个资源可用', jp: '個利用可能なリソース' },
  visitResource: { zh: '访问', jp: '見る' },
  from: { zh: '来源：', jp: 'ソース: ' },
  
  // Footer
  footerText: { zh: '© 2025 by救活 日语学习导航。为日语学习者提供的综合资源。', jp: '© 2025 by救活 日本語Hub. 日本語学習の総合リソースサイト.' },
  footerEncouragement: { zh: '加油！祝您学习顺利！', jp: '勉強頑張ってね！応援しています！' },
  
  // Tags (keeping English for consistency across languages)
  beginner: { zh: '初级', jp: '初心者' },
  intermediate: { zh: '中级', jp: '中級者' },
  advanced: { zh: '高级', jp: '上級者' },
  free: { zh: '免费', jp: '無料' },
  premium: { zh: '付费', jp: '有料' },
  official: { zh: '官方', jp: '公式' },
  practice: { zh: '练习', jp: '練習' },
  grammar: { zh: '语法', jp: '文法' },
  audio: { zh: '音频', jp: '音声' },
  video: { zh: '视频', jp: '動画' },
  conversation: { zh: '对话', jp: '会話' },
  pronunciation: { zh: '发音', jp: '発音' },
  news: { zh: '新闻', jp: 'ニュース' },
  entertainment: { zh: '娱乐', jp: 'エンタメ' },
  tutoring: { zh: '辅导', jp: '個別指導' },
  technique: { zh: '技巧', jp: 'テクニック' },
  phrases: { zh: '短语', jp: 'フレーズ' },
  literature: { zh: '文学', jp: '文学' },
  community: { zh: '社区', jp: 'コミュニティ' },
  dictionary: { zh: '词典', jp: '辞書' },
  native: { zh: '母语', jp: 'ネイティブ' },
  translation: { zh: '翻译', jp: '翻訳' },
  browser: { zh: '浏览器', jp: 'ブラウザ' },
  exam: { zh: '考试', jp: '試験' },
  university: { zh: '大学', jp: '大学' },
  studyAbroad: { zh: '留学', jp: '留学' },
  career: { zh: '职业', jp: 'キャリア' },
  guide: { zh: '指南', jp: 'ガイド' },
  business: { zh: '商务', jp: 'ビジネス' },
  culture: { zh: '文化', jp: '文化' },
  contjpt: { zh: '内容', jp: 'コンテンツ' },
  podcast: { zh: '播客', jp: 'ポッドキャスト' },
  structured: { zh: '结构化', jp: '体系的' },
  tips: { zh: '技巧', jp: 'コツ' },
  allLevels: { zh: '所有级别', jp: '全レベル対応' }
};
export interface Resource {
  name: string;
  description: string;
  url: string;
  tags: string[];
}

export interface Category {
  id: string;
  nameKey: string; // Changed to use translation key
  icon: React.ElementType;
  resources: Resource[];
}

export const categories: Category[] = [
  {
    id: 'basic',
    nameKey: 'basicLearning',
    icon: BookOpen,
    resources: [
      { name: 'NHK日本世界', description: 'NHK带你学基础日语', url: 'https://www3.nhk.or.jp/nhkworld/zh/learnjapanese/', tags: ['beginner', 'grammar'] },
      { name: '五十音在线学习', description: '互动学习五十音', url: 'https://nya.ink/50yin/test.html', tags: ['beginner', 'grammar', ] },
      { name: 'いろどり', description: '生活场景简单日语', url: 'https://www.irodori.jpf.go.jp/starter/pdf.html', tags: ['beginner' ] },
      { name: 'Forvo', description: '生活中常用日语单词发音跟读', url: 'https://forvo.com/languages/ja/', tags: ['pronunciation','pharse' ] },
      { name: 'Tofugu', description: '（英语）超人气的五十音入门教程，配有记忆法、写法、发音动画等', url: 'https://www.tofugu.com/japanese/learn-hiragana/', tags: ['beginner' ] },
    ]
  },
  {
    id: 'exam',
    nameKey: 'examPrep',
    icon: GraduationCap,
    resources: [
      { name: '日本語能力試験JLPT', description: '真题练习官方网站', url: 'https://www.jlpt.jp/cn/samples/forlearners.html', tags: ['official', 'all levels'] },
      { name: 'JLPT先生', description: 'JLPT语法大全/日英对照', url: 'https://jlptsensei.com/', tags: ['practice', ] },
      { name: 'Bunpro', description: '互动练习语法N5～N1', url: 'https://bunpro.jp/', tags: ['grammar', 'premium'] },
      { name: 'u-biq', description: '分类分级测试', url: 'https://u-biq.org/', tags: [ 'structured'] },
      { name: '日本語の森', description: '分类分级教学视频', url: 'https://nihongonomori.com/', tags: ['structured'] },
    ]
  },
  {
    id: 'listening',
    nameKey: 'listening',
    icon: Headphones,
    resources: [
      { name: 'NHK Easy News', description: '简短的日语新闻文章，有音标标注', url: 'https://www3.nhk.or.jp/news/easy/', tags: ['beginner', 'news', ] },
      // { name: 'JapanesePod101', description: 'Podcast lessons for all levels', url: 'https://www.japanesepod101.com/', tags: ['beginner', 'intermediate', 'podcast'] },
      // { name: 'Anime with Japanese Subtitles', description: 'Watch anime with Japanese subtitles', url: 'https://animelon.com/', tags: ['intermediate', 'entertainment', ] },
      { name: 'Forvo', description: '生活中常用日语单词发音跟读', url: 'https://forvo.com/languages/ja/', tags: ['pronunciation', 'beginner'] },
      { name: 'NHK 高校講座', description: '针对不同科目的讲座', url: 'https://www.nhk.or.jp/kokokoza/', tags: ['lecture','knowledge' ] },
      { name: 'NHK ラジオニュース', description: 'NHK的长新闻5-10min', url: 'https://www.nhk.or.jp/radionews/', tags: ['podcast', 'news'] },
      { name: '日テレNEWS', description: '长新闻动画youtube频道', url: 'https://www.youtube.com/channel/UCuTAXTexrhetbOe3zgskJBQ/videos', tags: ['video', 'news'] },

    ]
  },
  {
    id: 'speaking',
    nameKey: 'speaking',
    icon: MessageCircle,
    resources: [
      { name: 'Shadowing日本語を話そう', description: '影子跟读bilibili频道', url: 'https://www.bilibili.com/video/BV19M411p7hQ/?vd_source=a4762ddf495a948f2249b8fde7c73b04', tags: ['conversation', ] },
      { name: '韻律読み上げチュータスズキクン', description: '输入文章会生成日语音频并标注音调', url: 'https://www.gavo.t.u-tokyo.ac.jp/ojad/phrasing', tags: ['generate'] },
      // { name: 'Shadowing Technique', description: 'Learn pronunciation through shadowing', url: 'https://www.youtube.com/watch?v=KdGc8-jzSKM', tags: ['pronunciation', 'technique', ] },
      // { name: 'Japanese Conversation Expressions', description: 'Common phrases for daily conversation', url: 'https://www.fluentu.com/blog/japanese/japanese-conversation/', tags: ['phrases', 'intermediate'] },
      { name: '日本語を楽しもう！', description: '学习口语里的拟声词', url: 'https://www2.ninjal.ac.jp/Onomatope/index.html', tags: ['phrases', 'beginner'] },
      { name: 'いろどり', description: '生活场景简单日语带音频可跟读', url: 'https://www.irodori.jpf.go.jp/starter/pdf.html', tags: ['beginner' ] },

    ]
  },
  {
    id: 'reading',
    nameKey: 'reading',
    icon: FileText,
    resources: [
      { name: 'NHK Easy News', description: '简短的日语新闻文章，有音标标注', url: 'https://www3.nhk.or.jp/news/easy/', tags: ['beginner', 'news'] },
      { name: '青空文庫', description: '免费日语文学作品网站', url: 'https://www.aozora.gr.jp/', tags: ['advanced', 'literature'] },
      // { name: 'Satori Reader', description: 'Graded reading with built-in dictionary', url: 'https://www.satorireader.com/', tags: ['intermediate', 'premium'] },
      // { name: 'Tadoku', description: 'Extensive reading materials', url: 'https://tadoku.org/', tags: ['all levels'] },
      { name: '国立国会図書館サーチ', description: '标注了[インタネット公開]的可免费阅读', url: 'https://ndlsearch.ndl.go.jp/', tags: ['books'] },
      { name: '日语版人民中国', description: '国内新闻日语版', url: 'http://www.peoplechina.com.cn/', tags: ['news'] },
      { name: '日语版人民网', description: '国内新闻日语版', url: 'https://j.people.com.cn/https://j.people.com.cn/', tags: ['news'] },
      { name: 'JAXA‘s', description: '天文科普类文章', url: 'https://fanfun.jaxa.jp/jaxas/index.html', tags: ['paper'] },
 
    ]
  },
  {
    id: 'writing',
    nameKey: 'writing',
    icon: PenTool,
    resources: [
      // { name: 'Imabi', description: '日英结合', url: 'https://www.imabi.net/', tags: ['grammar', 'advanced', ] },
      // { name: 'Japanese Writing Practice', description: 'Kanji and kana writing practice', url: 'https://www.japanese-writing.com/', tags: ['writing', 'practice', ] },
      { name: 'Lang-8', description: '在这里问日本人关于日语的任何问题', url: 'https://lang-8.com/', tags: ['communication', 'community', ] },
      { name: 'J-STAGE', description: '日语论文参考网站', url: 'https://www.jstage.jst.go.jp/', tags: ['writing', 'papper', ] },
      { name: 'CiNii', description: '日语论文参考网站', url: 'https://cir.nii.ac.jp/', tags: ['writing', 'papper', ] },
      { name: '国立国語研究所', description: '日语论文参考网站，标注「本文表示」可以下载', url: 'https://bibdb.ninjal.ac.jp/bunken/ja/https://bibdb.ninjal.ac.jp/bunken/ja/', tags: ['writing', 'papper', ] },
      { name: '早稲田大学古典籍総合データ', description: '古典书籍数据库', url: 'https://www.wul.waseda.ac.jp/kotenseki/advanced_search.html', tags: ['writing', 'papper', ] },
      { name: '日本の服の歴史', description: '介绍日本服装历史', url: 'http://www.bb.em-net.ne.jp/~maccafushigi/index.html', tags: ['writing', 'papper', ] },
      { name: '国立公文書館', description: '内阁文库公文书', url: 'https://bibdb.ninjal.ac.jp/bunken/ja/https://bibdb.ninjal.ac.jp/bunken/ja/', tags: ['writing', 'papper', ] },
     
      
    ]
  },
  {
    id: 'tools',
    nameKey: 'tools',
    icon: Wrench,
    resources: [
      { name: 'Weblio辞典・百科事典の検索サービス', description: '日本人用的官方查词网站，类似新华字典', url: 'https://www.weblio.jp/', tags: ['dictionary', 'native', ] },
      { name: 'Moji', description: '常用查词软件', url: 'https://www.mojidict.com/', tags: ['dictionary', ] },
      { name: 'DeepL', description: 'High-quality translation tool', url: 'https://www.deepl.com/', tags: ['translation', ] },
      // { name: 'Rikaikun', description: 'Browser extension for instant translations', url: 'https://chrome.google.com/webstore/detail/rikaikun/jipdnfibhldikgcjhfnomkfpcebammhp', tags: ['browser', ] },
    ]
  },
  {
    id: 'japan',
    nameKey: 'studyInJapan',
    icon: Plane,
    resources: [
      { name: '日本学生支援机构Jasso', description: '奖学金，EJU，留学生活支援官方网站', url: 'https://www.jasso.go.jp/index.html', tags: [ 'university', 'official'] },
      { name: 'Onecareer', description: '新卒看面经，面经大全', url: 'https://www.onecareer.jp/', tags: ['career', 'guide'] },
      { name: 'マイナビ', description: '常用的找工作网站', url: 'https://www.mynavi.jp/', tags: ['career', 'guide'] },
      { name: 'リクナビ', description: '常用的找工作网站', url: 'https://job.rikunabi.com/n/', tags: ['career', 'guide'] },
    ]
  },
  {
    id: 'weekly',
    nameKey: 'weeklyPicks',
    icon: Star,
    resources: [
      { name: '韻律読み上げチュータスズキクン', description: '输入文章会生成日语音频并标注音调！练习指定文章音频强推', url: 'https://www.gavo.t.u-tokyo.ac.jp/ojad/phrasing', tags: ['generate'] },
      // { name: 'Tofugu', description: 'Japanese culture and language blog', url: 'https://www.tofugu.com/', tags: ['culture', ] },
      // { name: 'FluentU Japanese', description: 'Real-world Japanese content', url: 'https://www.fluentu.com/blog/japanese/', tags: ['content', 'premium'] },
      // { name: 'JapanesePod101 YouTube', description: 'Free Japanese lessons on YouTube', url: 'https://www.youtube.com/user/japanesepod101', tags: ['video', ] },
      { name: 'Gacco', description: '日本版的[中国大学mooc]，各高校的讲座视频', url: 'https://gacco.org/', tags: ['video', 'lecture'] },
      { name: '日本学生支援机构Jasso', description: '奖学金，EJU，留学生活支援官方网站', url: 'https://www.jasso.go.jp/index.html', tags: [ 'university', 'official'] },
      { name: 'Weblio辞典・百科事典の検索サービス', description: '日本人用的官方查词网站，类似新华字典', url: 'https://www.weblio.jp/', tags: ['dictionary', 'native', ] },

    ]
  }
];

export const todaysPhrases = [
  { japanese: 'がんばって！', romaji: 'Ganbatte!' },
  { japanese: 'お疲れ様です', romaji: 'Otsukaresama desu' },
  { japanese: 'いただきます', romaji: 'Itadakimasu' },
  { japanese: 'よろしくお願いします', romaji: 'Yoroshiku onegaishimasu' },
  { japanese: 'すみません', romaji: 'Sumimasen' },
  { japanese: 'ありがとうございます', romaji: 'Arigatou gozaimasu' },
  { japanese: 'おはようございます', romaji: 'Ohayou gozaimasu' },
  { japanese: 'こんにちは', romaji: 'Konnichiwa' },
  { japanese: 'こんばんは', romaji: 'Konbanwa' },
  { japanese: 'さようなら', romaji: 'Sayounara' },
  { japanese: 'おやすみなさい', romaji: 'Oyasuminasai' },
  { japanese: 'いってきます', romaji: 'Ittekimasu' },
  { japanese: 'いってらっしゃい', romaji: 'Itterasshai' },
  { japanese: 'ただいま', romaji: 'Tadaima' },
  { japanese: 'おかえりなさい', romaji: 'Okaerinasai' },
  { japanese: 'ごめんなさい', romaji: 'Gomen nasai' },
  { japanese: '大丈夫です', romaji: 'Daijoubu desu' },
  { japanese: '気をつけて', romaji: 'Ki o tsukete' },
  { japanese: 'おめでとうございます', romaji: 'Omedetou gozaimasu' },
  { japanese: '久しぶり', romaji: 'Hisashiburi' },
  { japanese: 'わかりました', romaji: 'Wakarimashita' },
  { japanese: 'わかりません', romaji: 'Wakarimasen' },
  { japanese: 'もう一度お願いします', romaji: 'Mou ichido onegaishimasu' },
  { japanese: 'ゆっくり話してください', romaji: 'Yukkuri hanashite kudasai' },
  { japanese: 'どういたしまして', romaji: 'Dou itashimashite' },
  { japanese: 'はじめまして', romaji: 'Hajimemashite' },
  { japanese: '何ですか？', romaji: 'Nan desu ka?' },
  { japanese: 'いいえ、違います', romaji: 'Iie, chigaimasu' },
  { japanese: 'はい、そうです', romaji: 'Hai, sou desu' },
  { japanese: 'ちょっと待ってください', romaji: 'Chotto matte kudasai' },
  { japanese: '頑張ります', romaji: 'Ganbarimasu' },
  { japanese: 'いいですね', romaji: 'Ii desu ne' },
  { japanese: '気にしないでください', romaji: 'Ki ni shinaide kudasai' },
  { japanese: 'お大事に', romaji: 'Odaijini' },
  { japanese: '行ってきます', romaji: 'Ittekimasu' },
  { japanese: 'いらっしゃいませ', romaji: 'Irasshaimase' },
  { japanese: '失礼します', romaji: 'Shitsurei shimasu' },
  { japanese: '失礼しました', romaji: 'Shitsurei shimashita' },
  { japanese: 'お願いします', romaji: 'Onegaishimasu' },
  { japanese: 'どうぞ', romaji: 'Douzo' },
  { japanese: 'すごい！', romaji: 'Sugoi!' },
  { japanese: 'うれしい', romaji: 'Ureshii' },
  { japanese: '悲しい', romaji: 'Kanashii' },
  { japanese: 'おいしい', romaji: 'Oishii' },
  { japanese: 'まずい', romaji: 'Mazui' },
  { japanese: 'かわいい', romaji: 'Kawaii' },
  { japanese: 'かっこいい', romaji: 'Kakkoii' },
  { japanese: '眠いです', romaji: 'Nemui desu' },
  { japanese: '疲れました', romaji: 'Tsukaremashita' },
  { japanese: 'お腹がすきました', romaji: 'Onaka ga sukimashita' },
  { japanese: '喉が渇きました', romaji: 'Nodo ga kawakimashita' },
  { japanese: '頑張ってください', romaji: 'Ganbatte kudasai' },
  { japanese: '元気ですか？', romaji: 'Genki desu ka?' },
  { japanese: '元気です', romaji: 'Genki desu' },
  { japanese: '行きましょう', romaji: 'Ikimashou' },
  { japanese: '帰りましょう', romaji: 'Kaerimashou' },
  { japanese: '雨が降っています', romaji: 'Ame ga futteimasu' },
  { japanese: '暑いですね', romaji: 'Atsui desu ne' },
  { japanese: '寒いですね', romaji: 'Samui desu ne' },
  { japanese: '楽しいです', romaji: 'Tanoshii desu' },
  { japanese: '暇です', romaji: 'Hima desu' },
  { japanese: '忙しいです', romaji: 'Isogashii desu' },
  { japanese: 'ちょっといいですか？', romaji: 'Chotto ii desu ka?' },
  { japanese: '大好きです', romaji: 'Daisuki desu' },
  { japanese: '嫌いです', romaji: 'Kirai desu' },
  { japanese: 'お名前は？', romaji: 'Onamae wa?' },
  { japanese: '○○と申します', romaji: '○○ to moushimasu' },
  { japanese: 'どこから来ましたか？', romaji: 'Doko kara kimashita ka?' },
  { japanese: '日本が好きです', romaji: 'Nihon ga suki desu' },
  { japanese: '助けて！', romaji: 'Tasukete!' },
  { japanese: '本当に？', romaji: 'Hontou ni?' },
  { japanese: 'もちろんです', romaji: 'Mochiron desu' },
  { japanese: 'お先に失礼します', romaji: 'Osaki ni shitsurei shimasu' },
  { japanese: '気をつけて帰ってください', romaji: 'Ki o tsukete kaette kudasai' },
  { japanese: '今日も頑張りましょう', romaji: 'Kyou mo ganbarimashou' },
  { japanese: '今何時ですか？', romaji: 'Ima nanji desu ka?' },
  { japanese: 'もう一回お願いします', romaji: 'Mou ikkai onegaishimasu' }
];