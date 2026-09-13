import { BookOpen, GraduationCap, Headphones, MessageCircle, FileText, PenTool, Wrench, Plane, Star } from 'lucide-react';
import type { Category } from './types';

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
