import { getHomeLayout } from '@/utils/homeLayout';
import LibraryV2View from '@/components/home/v2/library/LibraryV2View';
import LibraryClassicPage from './LibraryClassicPage';

export default function LibraryPage() {
  if (getHomeLayout() === 'v2') {
    return <LibraryV2View />;
  }

  return <LibraryClassicPage />;
}
