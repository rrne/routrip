import { HomeBody } from '@/components/home-body';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  let username: string | null = null;

  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', data.user.id)
      .single();

    username = profile?.username ?? null;
  }

  return (
    <div className="flex flex-1 flex-col">
      <HomeBody isLoggedIn={!!data.user} initialUsername={username} />
    </div>
  );
}
