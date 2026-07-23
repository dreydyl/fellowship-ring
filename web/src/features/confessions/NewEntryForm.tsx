// Form for writing a new confession entry.

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCreateConfessionEntry } from './hooks/useCreateConfessionEntry';

const entrySchema = z.object({
  content: z.string().min(1, 'Write something before saving.'),
});

type EntryFormValues = z.infer<typeof entrySchema>;

export function NewEntryForm() {
  const navigate = useNavigate();
  const createEntry = useCreateConfessionEntry();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
  });

  async function onSubmit(values: EntryFormValues) {
    const entry = await createEntry.mutateAsync(values.content);
    reset();
    navigate(`/entries/${entry.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          What's on your heart?
        </label>
        <textarea
          id="content"
          rows={6}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          {...register('content')}
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
        )}
      </div>

      {createEntry.isError && (
        <p className="text-sm text-red-600">
          {createEntry.error instanceof Error
            ? createEntry.error.message
            : 'Something went wrong saving your entry.'}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        Save Entry
      </button>
    </form>
  );
}
