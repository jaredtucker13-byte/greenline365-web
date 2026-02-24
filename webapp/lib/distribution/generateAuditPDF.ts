import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Branded PDF styles: black (#0A0A0A) bg, gold (#D4AF37) headers
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0A0A0A',
    padding: 40,
    fontFamily: 'Helvetica',
    color: '#FFFFFF',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#D4AF37',
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '35%',
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.5,
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  opportunityItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  bullet: {
    width: 12,
    fontSize: 10,
    color: '#D4AF37',
  },
  opportunityText: {
    flex: 1,
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#D4AF37',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#FFFFFF',
    opacity: 0.4,
  },
  footerBrand: {
    fontSize: 8,
    color: '#D4AF37',
    fontWeight: 'bold',
  },
});

export interface AuditPDFData {
  url: string;
  title: string;
  seoScore: number;
  metaDescription: string;
  metaKeywords: string;
  headings: { h1: string[]; h2: string[]; h3: string[] };
  wordCount: number;
  links: { internal: number; external: number };
  images: { total: number; missingAlt: { src: string }[] };
  canonical: string | null;
  openGraph: {
    title: string | null;
    description: string | null;
    image: string | null;
  };
  opportunities: string[];
  generatedAt?: string;
}

export function AuditPDFDocument({ data }: { data: AuditPDFData }) {
  const date = data.generatedAt || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.headerTitle }, 'SEO Audit Report'),
        React.createElement(Text, { style: styles.headerSubtitle }, `${data.url}  |  ${date}`)
      ),
      // Score
      React.createElement(
        View,
        { style: styles.scoreContainer },
        React.createElement(Text, { style: styles.scoreNumber }, String(data.seoScore)),
        React.createElement(Text, { style: styles.scoreLabel }, 'SEO Score')
      ),
      // Meta Tags
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Meta Tags'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Title'),
          React.createElement(Text, { style: styles.value }, data.title || 'Missing')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Description'),
          React.createElement(Text, { style: styles.value }, data.metaDescription || 'Missing')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Keywords'),
          React.createElement(Text, { style: styles.value }, data.metaKeywords || 'None')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Canonical'),
          React.createElement(Text, { style: styles.value }, data.canonical || 'Missing')
        )
      ),
      // Content Stats
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Content Analysis'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Word Count'),
          React.createElement(Text, { style: styles.value }, String(data.wordCount))
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'H1 Tags'),
          React.createElement(Text, { style: styles.value }, data.headings.h1.join(', ') || 'None')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'H2 Tags'),
          React.createElement(Text, { style: styles.value }, `${data.headings.h2.length} found`)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Internal Links'),
          React.createElement(Text, { style: styles.value }, String(data.links.internal))
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'External Links'),
          React.createElement(Text, { style: styles.value }, String(data.links.external))
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Images'),
          React.createElement(
            Text,
            { style: styles.value },
            `${data.images.total} total, ${data.images.missingAlt.length} missing alt`
          )
        )
      ),
      // Open Graph
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Open Graph'),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'OG Title'),
          React.createElement(Text, { style: styles.value }, data.openGraph.title || 'Missing')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'OG Description'),
          React.createElement(Text, { style: styles.value }, data.openGraph.description || 'Missing')
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'OG Image'),
          React.createElement(Text, { style: styles.value }, data.openGraph.image || 'Missing')
        )
      ),
      // Opportunities
      data.opportunities.length > 0
        ? React.createElement(
            View,
            { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, 'Opportunity Gaps'),
            ...data.opportunities.map((gap, i) =>
              React.createElement(
                View,
                { key: i, style: styles.opportunityItem },
                React.createElement(Text, { style: styles.bullet }, '\u2022'),
                React.createElement(Text, { style: styles.opportunityText }, gap)
              )
            )
          )
        : null,
      // Footer
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(Text, { style: styles.footerBrand }, 'Greenline365'),
        React.createElement(Text, { style: styles.footerText }, `Generated ${date}`)
      )
    )
  );
}
