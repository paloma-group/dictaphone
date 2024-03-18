import EditableInput from '@/components/EditableInput';
import { createClient } from '@/utils/supabase/server';
import { updateApiKey } from '@/actions/profile/updateApiKey';
import { updateName } from '@/actions/profile/updateName';
import { updateEmail } from '@/actions/profile/updateEmail';
import ChangePasswordButton from '@/components/ChangePasswordButton';
import AddEditProfilePhoto from '@/components/AddEditProfilePhoto';

export default async function Profile() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .limit(1)
    .single();

  const { data: ai_integration } = await supabase
    .from('ai_integration')
    .select('id, api_key')
    .limit(1)
    .single();

  const handleApiKeyChange = updateApiKey.bind(null, ai_integration?.id);

  return (
    <div className="flex p-6 md:p-12 bg-white rounded-3xl mb-4 lg:mb-8">
      <div className="hidden md:block self-start xl:w-60 2xl:w-80 flex-none mr-16">
        <h3 className="text-4xl font-semibold">Profile</h3>
      </div>
      <div className="grow space-y-6">
        <div>
          <h4 className="text-xl font-bold mb-4">Profile photo</h4>
          <div className="flex p-6 md:p-12 bg-gray-200 rounded-3xl">
            <AddEditProfilePhoto />
          </div>
        </div>
        <div>
          <h4 className="text-xl font-bold mb-4">Account details</h4>
          <div className="p-6 md:p-12 flex flex-col space-y-4 bg-gray-200 rounded-3xl">
            <EditableInput
              label="Name"
              inputProps={{
                defaultValue: profile?.full_name,
                placeholder: 'Your name',
                required: true,
              }}
              action={updateName}
            />
            <EditableInput
              label="Email address"
              inputProps={{
                defaultValue: user.email,
                placeholder: 'Your email',
                type: 'email',
                required: true,
              }}
              action={updateEmail}
            />
            {user.new_email && (
              <p className="text-sm italic">
                Please follow the instructions in your email inbox to confirm
                the change of your email to "{user.new_email}"
              </p>
            )}
          </div>
        </div>
        <div>
          <h4 className="text-xl font-bold mb-4">Security</h4>
          <div className="flex p-6 md:p-12 bg-gray-200 rounded-3xl">
            <ChangePasswordButton />
          </div>
        </div>
        <div>
          <h4 className="text-xl font-bold mb-4">API keys</h4>
          <div className="grid p-6 md:p-12 bg-gray-200 rounded-3xl">
            <EditableInput
              label="API Key name"
              inputProps={{
                defaultValue: ai_integration?.api_key,
                placeholder: 'OpenAI API Key',
              }}
              action={handleApiKeyChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}