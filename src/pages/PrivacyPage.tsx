import { ArrowLeft } from 'lucide-react';
import type { Language } from '../data/types';

type Props = {
  darkMode: boolean;
  language: Language;
  onBack: () => void;
};

const policy = {
  zh: {
    title: '隐私政策',
    updated: '生效日期：2026 年 9 月 13 日',
    intro: 'Nihongo Hub（以下简称“本网站”）重视你的隐私。本政策说明我们在提供账号、个人 Space、资源管理和学习打卡功能时如何处理信息。',
    back: '返回 Nihongo Hub',
    sections: [
      ['1. 我们收集的信息', [
        '账号信息：使用邮箱验证码登录时的邮箱地址；使用 Google 登录时由 Google 提供的账号标识、邮箱及基础资料。',
        '你主动保存的内容：私人资源的名称、说明、链接、分类和标签。',
        '学习活动：资源 Mark、浏览历史、访问次数和每日打卡记录。',
        '基础访问数据：页面路径、访问时间、来源、设备类型、浏览器、操作系统和大致地区等聚合统计信息。',
      ]],
      ['2. 信息用途', [
        '创建并维护账号，提供登录、个人 Space、资源管理和打卡功能。',
        '同步你的学习记录、保障服务安全、诊断故障并改进网站体验。',
        '发送登录所需的邮箱验证码；我们不会把验证码邮件用于营销。',
      ]],
      ['3. 服务提供商', [
        'Supabase：提供账号认证、数据库和数据访问控制。',
        'Resend：发送邮箱登录验证码，因此会处理验证码邮件所需的邮箱地址。',
        'Vercel：托管网站并提供以聚合统计为目的的 Web Analytics。',
        'Google：仅在你选择 Google 登录时处理认证信息。各服务提供商会按照其自身条款和隐私政策处理信息。',
      ]],
      ['4. 保存、删除与安全', [
        '信息仅在提供服务、保障安全及履行适用法律义务所需期间保存。你可以通过下方邮箱申请访问、更正或删除账号及相关个人数据。',
        '我们采用 Supabase 的身份认证与行级访问控制等措施限制私人数据访问。互联网传输和电子存储无法保证绝对安全。',
      ]],
      ['5. 跨境处理', [
        '上述服务提供商可能在你所在国家或地区以外处理数据。使用本网站即表示你知悉此类处理可能适用不同的数据保护规则。',
      ]],
      ['6. 政策更新', [
        '功能或数据处理方式变化时，我们可能更新本政策，并在本页面标注新的生效日期。重大变化将通过网站内的适当方式提示。',
      ]],
    ],
    contactTitle: '7. 联系我们',
    contactText: '如需咨询隐私问题，或申请访问、更正、删除个人数据，请联系：',
  },
  jp: {
    title: 'プライバシーポリシー',
    updated: '施行日：2026年9月13日',
    intro: 'Nihongo Hub（以下「本サイト」）は、利用者のプライバシーを尊重します。本ポリシーでは、アカウント、マイスペース、リソース管理、学習チェック機能を提供する際の情報の取扱いについて説明します。',
    back: 'Nihongo Hub に戻る',
    sections: [
      ['1. 収集する情報', [
        'アカウント情報：メール認証コードでログインする際のメールアドレス、および Google ログイン時に Google から提供されるアカウント識別子、メールアドレス、基本プロフィール。',
        '利用者が保存する内容：個人リソースの名称、説明、URL、カテゴリー、タグ。',
        '学習活動：リソースの Mark、閲覧履歴、閲覧回数、日々のチェック記録。',
        '基本的なアクセスデータ：ページパス、アクセス時刻、参照元、端末種別、ブラウザ、OS、おおよその地域などの集計情報。',
      ]],
      ['2. 利用目的', [
        'アカウントの作成・維持、ログイン、マイスペース、リソース管理、チェック機能の提供。',
        '学習記録の同期、サービスの安全確保、障害調査、利用体験の改善。',
        'ログインに必要なメール認証コードの送信。認証メールをマーケティングには使用しません。',
      ]],
      ['3. 外部サービス', [
        'Supabase：認証、データベース、データアクセス制御を提供します。',
        'Resend：ログイン用認証コードを送信するため、送信先メールアドレスを処理します。',
        'Vercel：サイトをホスティングし、集計を目的とした Web Analytics を提供します。',
        'Google：Google ログインを選択した場合に限り、認証情報を処理します。各事業者は、それぞれの規約およびプライバシーポリシーに従って情報を処理します。',
      ]],
      ['4. 保存、削除および安全管理', [
        '情報は、サービス提供、安全確保および適用法令上の義務に必要な期間に限り保存します。下記メールアドレスから、個人データの開示、訂正またはアカウントと関連データの削除を申請できます。',
        'Supabase の認証機能や行レベルのアクセス制御などを用いて、個人データへのアクセスを制限します。ただし、インターネット通信および電子保存の絶対的な安全性を保証することはできません。',
      ]],
      ['5. 国外での処理', [
        '上記のサービス提供者は、利用者の国または地域外でデータを処理する場合があります。その場合、異なるデータ保護法令が適用される可能性があります。',
      ]],
      ['6. ポリシーの変更', [
        '機能またはデータ処理方法の変更に応じて本ポリシーを更新し、本ページに新しい施行日を表示します。重要な変更は、サイト内の適切な方法でお知らせします。',
      ]],
    ],
    contactTitle: '7. お問い合わせ',
    contactText: 'プライバシーに関するお問い合わせ、または個人データの開示・訂正・削除の申請は、以下までご連絡ください：',
  },
} as const;

export function PrivacyPage({ darkMode, language, onBack }: Props) {
  const content = policy[language];
  const text = darkMode ? 'text-[#ead8c5]' : 'text-[#4c3b2b]';
  const muted = darkMode ? 'text-[#b9a793]' : 'text-[#76624d]';

  return (
    <article className={`mx-auto max-w-3xl rounded-3xl border px-5 py-8 shadow-sm sm:px-10 sm:py-12 ${darkMode ? 'border-[#4a3f33] bg-[#28221c]' : 'border-[#ddcdb6] bg-[#fffaf2]'}`}>
      <button type="button" onClick={onBack} className={`inline-flex items-center gap-2 text-sm font-medium hover:underline ${muted}`}>
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />{content.back}
      </button>
      <header className="mt-8 border-b border-current/15 pb-7">
        <p className={`text-sm font-semibold tracking-[0.14em] ${darkMode ? 'text-[#e19a69]' : 'text-[#a8512c]'}`}>NIHONGO HUB</p>
        <h1 className={`mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${text}`}>{content.title}</h1>
        <p className={`mt-3 text-sm ${muted}`}>{content.updated}</p>
        <p className={`mt-6 leading-7 ${text}`}>{content.intro}</p>
      </header>
      <div className="mt-8 space-y-9">
        {content.sections.map(([heading, paragraphs]) => (
          <section key={heading}>
            <h2 className={`text-xl font-semibold ${text}`}>{heading}</h2>
            <div className={`mt-3 space-y-3 leading-7 ${muted}`}>
              {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}
        <section>
          <h2 className={`text-xl font-semibold ${text}`}>{content.contactTitle}</h2>
          <p className={`mt-3 leading-7 ${muted}`}>{content.contactText}</p>
          <a href="mailto:chinshi.c@qq.com" className={`mt-2 inline-block font-medium underline underline-offset-4 ${darkMode ? 'text-[#f0ad78]' : 'text-[#a8512c]'}`}>chinshi.c@qq.com</a>
        </section>
      </div>
    </article>
  );
}
