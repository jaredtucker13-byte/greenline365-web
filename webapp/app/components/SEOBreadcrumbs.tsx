'use client';

import React from 'react';

interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface SEOBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function SEOBreadcrumbs({ items }: SEOBreadcrumbsProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://greenline365.com';
  
  // Generate JSON-LD for breadcrumbs
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${baseUrl}${item.url}` : undefined,
    })),
  };

  return (
    <>
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      {/* Visual Breadcrumbs (optional - can be styled) */}
      <nav aria-label="Breadcrumb" className="hidden">
        <ol itemScope itemType="https://schema.org/BreadcrumbList">
          {items.map((item, index) => (
            <li
              key={index}
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {item.url ? (
                <a href={item.url} itemProp="item">
                  <span itemProp="name">{item.name}</span>
                </a>
              ) : (
                <span itemProp="name">{item.name}</span>
              )}
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
