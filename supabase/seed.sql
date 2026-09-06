create temporary table resource_seed (
  category public.resource_category,
  sort_order integer,
  name text,
  description text,
  url text,
  tags text[]
) on commit drop;

insert into resource_seed (category, sort_order, name, description, url, tags) values
('basic', 0, 'NHK日本世界', 'NHK带你学基础日语', 'https://www3.nhk.or.jp/nhkworld/zh/learnjapanese/', array['beginner','grammar']),
('basic', 1, '五十音在线学习', '互动学习五十音', 'https://nya.ink/50yin/test.html', array['beginner','grammar']),
('basic', 2, 'いろどり', '生活场景简单日语', 'https://www.irodori.jpf.go.jp/starter/pdf.html', array['beginner']),
('basic', 3, 'Forvo', '生活中常用日语单词发音跟读', 'https://forvo.com/languages/ja/', array['pronunciation','pharse']),
('basic', 4, 'Tofugu', '（英语）超人气的五十音入门教程，配有记忆法、写法、发音动画等', 'https://www.tofugu.com/japanese/learn-hiragana/', array['beginner']),
('exam', 0, '日本語能力試験JLPT', '真题练习官方网站', 'https://www.jlpt.jp/cn/samples/forlearners.html', array['official','all levels']),
('exam', 1, 'JLPT先生', 'JLPT语法大全/日英对照', 'https://jlptsensei.com/', array['practice']),
('exam', 2, 'Bunpro', '互动练习语法N5～N1', 'https://bunpro.jp/', array['grammar','premium']),
('exam', 3, 'u-biq', '分类分级测试', 'https://u-biq.org/', array['structured']),
('exam', 4, '日本語の森', '分类分级教学视频', 'https://nihongonomori.com/', array['structured']),
('listening', 0, 'NHK Easy News', '简短的日语新闻文章，有音标标注', 'https://www3.nhk.or.jp/news/easy/', array['beginner','news']),
('listening', 1, 'Forvo', '生活中常用日语单词发音跟读', 'https://forvo.com/languages/ja/', array['pronunciation','beginner']),
('listening', 2, 'NHK 高校講座', '针对不同科目的讲座', 'https://www.nhk.or.jp/kokokoza/', array['lecture','knowledge']),
('listening', 3, 'NHK ラジオニュース', 'NHK的长新闻5-10min', 'https://www.nhk.or.jp/radionews/', array['podcast','news']),
('listening', 4, '日テレNEWS', '长新闻动画youtube频道', 'https://www.youtube.com/channel/UCuTAXTexrhetbOe3zgskJBQ/videos', array['video','news']),
('speaking', 0, 'Shadowing日本語を話そう', '影子跟读bilibili频道', 'https://www.bilibili.com/video/BV19M411p7hQ/?vd_source=a4762ddf495a948f2249b8fde7c73b04', array['conversation']),
('speaking', 1, '韻律読み上げチュータスズキクン', '输入文章会生成日语音频并标注音调', 'https://www.gavo.t.u-tokyo.ac.jp/ojad/phrasing', array['generate']),
('speaking', 2, '日本語を楽しもう！', '学习口语里的拟声词', 'https://www2.ninjal.ac.jp/Onomatope/index.html', array['phrases','beginner']),
('speaking', 3, 'いろどり', '生活场景简单日语带音频可跟读', 'https://www.irodori.jpf.go.jp/starter/pdf.html', array['beginner']),
('reading', 0, 'NHK Easy News', '简短的日语新闻文章，有音标标注', 'https://www3.nhk.or.jp/news/easy/', array['beginner','news']),
('reading', 1, '青空文庫', '免费日语文学作品网站', 'https://www.aozora.gr.jp/', array['advanced','literature']),
('reading', 2, '国立国会図書館サーチ', '标注了[インタネット公開]的可免费阅读', 'https://ndlsearch.ndl.go.jp/', array['books']),
('reading', 3, '日语版人民中国', '国内新闻日语版', 'http://www.peoplechina.com.cn/', array['news']),
('reading', 4, '日语版人民网', '国内新闻日语版', 'https://j.people.com.cn/', array['news']),
('reading', 5, 'JAXA‘s', '天文科普类文章', 'https://fanfun.jaxa.jp/jaxas/index.html', array['paper']),
('writing', 0, 'Lang-8', '在这里问日本人关于日语的任何问题', 'https://lang-8.com/', array['communication','community']),
('writing', 1, 'J-STAGE', '日语论文参考网站', 'https://www.jstage.jst.go.jp/', array['writing','papper']),
('writing', 2, 'CiNii', '日语论文参考网站', 'https://cir.nii.ac.jp/', array['writing','papper']),
('writing', 3, '国立国語研究所', '日语论文参考网站，标注「本文表示」可以下载', 'https://bibdb.ninjal.ac.jp/bunken/ja/search', array['writing','papper']),
('writing', 4, '早稲田大学古典籍総合データ', '古典书籍数据库', 'https://www.wul.waseda.ac.jp/kotenseki/advanced_search.html', array['writing','papper']),
('writing', 5, '日本の服の歴史', '介绍日本服装历史', 'http://www.bb.em-net.ne.jp/~maccafushigi/index.html', array['writing','papper']),
('writing', 6, '国立公文書館', '内阁文库公文书', 'https://www.digital.archives.go.jp/', array['writing','papper']),
('tools', 0, 'Weblio辞典・百科事典の検索サービス', '日本人用的官方查词网站，类似新华字典', 'https://www.weblio.jp/', array['dictionary','native']),
('tools', 1, 'Moji', '常用查词软件', 'https://www.mojidict.com/', array['dictionary']),
('tools', 2, 'DeepL', 'High-quality translation tool', 'https://www.deepl.com/', array['translation']),
('japan', 0, '日本学生支援机构Jasso', '奖学金，EJU，留学生活支援官方网站', 'https://www.jasso.go.jp/index.html', array['university','official']),
('japan', 1, 'Onecareer', '新卒看面经，面经大全', 'https://www.onecareer.jp/', array['career','guide']),
('japan', 2, 'マイナビ', '常用的找工作网站', 'https://www.mynavi.jp/', array['career','guide']),
('japan', 3, 'リクナビ', '常用的找工作网站', 'https://job.rikunabi.com/n/', array['career','guide']),
('weekly', 0, '韻律読み上げチュータスズキクン', '输入文章会生成日语音频并标注音调！练习指定文章音频强推', 'https://www.gavo.t.u-tokyo.ac.jp/ojad/phrasing', array['generate']),
('weekly', 1, 'Gacco', '日本版的[中国大学mooc]，各高校的讲座视频', 'https://gacco.org/', array['video','lecture']),
('weekly', 2, '日本学生支援机构Jasso', '奖学金，EJU，留学生活支援官方网站', 'https://www.jasso.go.jp/index.html', array['university','official']),
('weekly', 3, 'Weblio辞典・百科事典の検索サービス', '日本人用的官方查词网站，类似新华字典', 'https://www.weblio.jp/', array['dictionary','native']);

insert into public.resources (name, description, url, tags)
select distinct on (url) name, description, url, tags
from resource_seed
order by url, category, sort_order;

insert into public.resource_categories (resource_id, category, sort_order)
select resources.id, seed.category, seed.sort_order
from resource_seed seed
join public.resources resources on resources.owner_id is null and resources.url = seed.url;
