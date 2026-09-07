import { render, screen } from '@testing-library/react';
import { BookOpen } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from './HomePage';

describe('HomePage catalog counts', () => {
  it('shows the authorized catalog total instead of the static array length', () => {
    render(
      <HomePage
        categories={[{
          id: 'basic',
          nameKey: 'basicLearning',
          icon: BookOpen,
          resources: [{ name: 'stale static item', description: '', url: 'https://example.com', tags: [] }],
        }]}
        categoryCounts={{ basic: 14 }}
        darkMode={false}
        language="zh"
        todaysPhrase={{ japanese: '学ぶ', romaji: 'manabu', zh: '学习' }}
        onCategoryClick={vi.fn()}
        t={(key) => ({ welcomeTitle: '欢迎', welcomeDesc: '描述', basicLearning: '基础', resourcesAvailable: '个资源' }[key] ?? key)}
      />,
    );

    expect(screen.getByText('14 个资源')).toBeInTheDocument();
    expect(screen.queryByText('1 个资源')).not.toBeInTheDocument();
  });
});
