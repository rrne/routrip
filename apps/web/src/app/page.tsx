import { HomeBody } from '@/components/home-body';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col">
      <HomeBody userEmail={data.user?.email ?? null} />
    </div>
  );
}
