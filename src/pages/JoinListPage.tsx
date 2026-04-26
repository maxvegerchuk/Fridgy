import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui';

// Requires this SECURITY DEFINER function in Supabase:
//
// create or replace function public.join_list_by_token(p_token text)
// returns uuid as $$
// declare
//   v_list_id uuid;
// begin
//   select id into v_list_id from public.shopping_lists where invite_token = p_token;
//   if v_list_id is null then return null; end if;
//   insert into public.list_members (list_id, user_id, role)
//   values (v_list_id, auth.uid(), 'editor')
//   on conflict (list_id, user_id) do nothing;
//   return v_list_id;
// end;
// $$ language plpgsql security definer;

type JoinState = 'joining' | 'error';

export default function JoinListPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [state, setState] = useState<JoinState>('joining');

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    let cancelled = false;

    async function join() {
      const { data: listId, error } = await supabase.rpc('join_list_by_token', {
        p_token: token,
      });

      if (cancelled) return;

      if (error || !listId) {
        setState('error');
        return;
      }

      toast('You have joined the list', 'success');
      navigate(`/list/${listId}`, { replace: true });
    }

    join();
    return () => { cancelled = true; };
  }, [token, navigate, toast]);

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
        <p className="text-base font-semibold text-neutral-900 font-sans text-center">
          Invalid or expired invite link
        </p>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="text-green-500 font-semibold text-sm active:opacity-70"
        >
          Go to Lists
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-500 font-sans">Joining list…</p>
      </div>
    </div>
  );
}
