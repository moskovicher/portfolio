import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

// Bare root (shachart.com). Redirect to a locale so it never 404s.
// Geo: Israeli visitors -> Hebrew, everyone else -> English.
export default async function RootPage() {
  const h = await headers();
  const country = h.get('x-vercel-ip-country');
  redirect(country === 'IL' ? '/he' : '/en');
}
