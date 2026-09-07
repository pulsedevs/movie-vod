import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  baseUrl?: string;
}

export default function Breadcrumbs({ items, className = '', baseUrl }: BreadcrumbsProps) {
  const siteUrl =
    baseUrl ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    'https://boredflix.tv';

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href && {
        item: {
          '@type': 'Thing',
          '@id': item.href.startsWith('http') ? item.href : `${siteUrl}${item.href}`,
          name: item.label,
        },
      }),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav
        className={`mx-auto max-w-[1400px] px-4 py-2.5 sm:px-6 ${className}`}
        aria-label="Breadcrumb"
      >
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          {items.map((item, index) => (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="text-zinc-700">
                  /
                </span>
              )}
              {item.current ? (
                <span className="truncate max-w-[200px] text-zinc-400" aria-current="page">
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-zinc-300 transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
