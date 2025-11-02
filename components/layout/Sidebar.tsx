'use client';

// サイドナビゲーションコンポーネント
// デザインシステム準拠

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  icon: string; // Material Icons name
  label: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar() {
  const pathname = usePathname();

  const navSections: NavSection[] = [
    {
      title: 'クライアント',
      items: [
        { icon: 'home', label: 'ホーム', href: '/' },
        { icon: 'flag', label: '目標・実行', href: '/plan-do' },
        { icon: 'assessment', label: '振り返り・改善', href: '/check-action' },
        { icon: 'psychology', label: 'AIアシスタント', href: '/ai-assistant' },
      ],
    },
    {
      title: 'メンター',
      items: [
        { icon: 'dashboard', label: 'ダッシュボード', href: '/mentor' },
      ],
    },
    {
      title: 'その他',
      items: [
        { icon: 'settings', label: '設定', href: '/settings' },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className="fixed left-0 top-0 w-[240px] h-screen overflow-y-auto z-100"
      style={{ backgroundColor: 'var(--primary-dark)' }}
    >
      {/* ヘッダー */}
      <div
        className="p-6 border-b"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <div className="flex items-center gap-2 text-white text-2xl font-bold">
          <span className="material-icons">explore</span>
          <span>COM:PASS</span>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="p-4">
        {navSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            <div
              className="text-xs font-medium uppercase mb-2 px-2"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              {section.title}
            </div>
            {section.items.map((item, itemIndex) => (
              <Link
                key={itemIndex}
                href={item.href}
                className={`
                  flex items-center gap-2 px-4 py-2 mb-1 rounded-lg
                  transition-all duration-300
                  ${
                    isActive(item.href)
                      ? 'text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }
                `}
                style={
                  isActive(item.href)
                    ? { backgroundColor: 'var(--primary)' }
                    : {}
                }
              >
                <span className="material-icons text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
