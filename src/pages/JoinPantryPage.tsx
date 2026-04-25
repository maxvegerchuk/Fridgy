import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui';

// Requires this SECURITY DEFINER function in Supabase:
//
// create or replace function public.join_pantry_by_token(p_token text)
// returns uuid as $$
// declare
//   v_pantry_id uuid;
// begin
//   select id into v_pantry_id from public.pantries where invite_token = p_token;
//   if v_pantry_id is null then return null; end if;
//   insert into public.pantry_members (pantry_id, user_id, role)
//   values (v_pantry_id, auth.uid(), 'editor')
//   on conflict (pantry_id, user_id) do nothing;
//   return v_pantry_id;
// end;
// $$ language plpgsql security definer;

type JoinState = 'joining' | 'already_member' | 'error';

export default function JoinPantryPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [state, setState] = useState<JoinState>('joining');

  useEffect(() => {
    if (!token) {
      navigate('/pantry', { replace: true });
      return;
    }

    let cancelled = false;

    async function join() {
      const { data: pantryId, error } = await supabase.rpc('join_pantry_by_token', {
        p_token: token,
      });

      if (cancelled) return;

      if (error || !pantryId) {
        setState('error');
        return;
      }

      // Check if we were already a member (RPC returns the id either way)
      // Show appropriate message then redirect
      const isNew = !error;
      setState(isNew ? 'already_member' : 'already_member');

      toast("You can now see their pantry", 'success');
      navigate('/pantry', { replace: true });
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
          onClick={() => navigate('/pantry', { replace: true })}
          className="text-green-500 font-semibold text-sm active:opacity-70"
        >
          Go to Pantry
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-neutral-500 font-sans">Joining pantry…</p>
      </div>
    </div>
  );
}
