import DirectoryClient from './directory/DirectoryClient';

export const dynamic = 'force-dynamic';

/**
 * Homepage - GL365 Directory
 * The directory is now the main landing page.
 * Previous homepage content moved to /services
 */
export default function HomePage() {
  return <DirectoryClient />;
}
