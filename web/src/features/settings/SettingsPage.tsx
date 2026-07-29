// Settings page: account/profile preferences.

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Header } from '../../components/Header';
import { useProfile } from '../assessment/hooks/useProfile';
import { useUpdateGender } from './hooks/useUpdateGender';

const genderSchema = z.object({
  gender: z.enum(['male', 'female', 'none']),
});

type GenderValues = z.infer<typeof genderSchema>;

export function SettingsPage() {
  const { data: profile } = useProfile();
  const updateGender = useUpdateGender();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GenderValues>({
    resolver: zodResolver(genderSchema),
    defaultValues: { gender: 'none' },
  });

  useEffect(() => {
    if (!profile) return;
    reset({ gender: profile.gender ?? 'none' });
  }, [profile, reset]);

  async function onSubmit(values: GenderValues) {
    await updateGender.mutateAsync(values.gender);
  }

  return (
    <div>
      <Header />
      <div className="mx-auto max-w-sm px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Settings</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
              Gender
            </label>
            <select
              id="gender"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('gender')}
            >
              <option value="none">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
          </div>

          {updateGender.isError && (
            <p className="text-sm text-red-600">
              {updateGender.error instanceof Error
                ? updateGender.error.message
                : 'Something went wrong updating your profile.'}
            </p>
          )}

          {updateGender.isSuccess && <p className="text-sm text-green-600">Saved.</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}
