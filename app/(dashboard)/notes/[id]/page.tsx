import AllNotesLink from '@/components/AllNotesLink';
import Note from '@/components/Note';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotePage({ params }: { params: { id: string } }) {
  const id = params.id;

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const { data: note } = await supabase
    .from('notes')
    .select(
      `id, title, transcript, highlights, created_at, user_id, note_tags ( tags ( id, name ) ), transformation_outputs ( id, transformed_text, transformation_prompts ( type ), created_at )`
    )
    .order('created_at', {
      referencedTable: 'transformation_outputs',
      ascending: false,
    })
    .eq('id', id)
    .limit(1)
    .single();

  const { data: prompts } = await supabase
    .from('transformation_prompts')
    .select(`id, prompt, type`);

  return (
    <>
      <AllNotesLink />
      {note && prompts ? <Note note={note} prompts={prompts} /> : null}
    </>
  );
}
