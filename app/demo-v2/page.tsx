/**
 * Demo V2 Theme Page
 * Przykładowa strona demonstracyjna dla Next.js App Router
 */

import { DemoPage } from '@/components/theme-v2/demo/DemoPage';

export const metadata = {
  title: 'V2 Theme Demo - Aukcje Gołębi',
  description: 'Demonstracja nowego motywu V2 z efektami 3D i mikrointerakcjami',
};

export default function DemoV2Page() {
  return <DemoPage />;
}
