import { Metadata } from 'next';
import HomeLedgerClient from './HomeLedgerClient';

export const metadata: Metadata = {
  title: 'Home Ledger — GreenLine365',
  description: 'The Carfax for your home. Complete property intelligence: maintenance history, behind-the-walls documentation, asset tracking, and more.',
};

export default function HomeLedgerPage() {
  return <HomeLedgerClient />;
}
