import { RouteView } from '@/components/route-view';
import { createClient } from '@/lib/supabase/server';

export default async function RoutePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return <RouteView user={data.user ?? null} />;
}
