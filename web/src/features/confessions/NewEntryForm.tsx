// Form for writing a new confession entry.

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCreateConfessionEntry } from './hooks/useCreateConfessionEntry';

const entrySchema = z.object({
  content: z.string().min(1, 'Write something before saving.'),
  urgeIntensitySlider: z.number().min(0).max(5),
});

type EntryFormValues = z.infer<typeof entrySchema>;

// The slider itself moves continuously (no snapping) between 0 and 5.
// The value that gets submitted and shown to the user is the ceiling of
// the current slider position, clamped to the 1-5 range the field stores.
function toUrgeIntensity(sliderValue: number): number {
  return Math.min(5, Math.max(1, Math.ceil(sliderValue)));
}

export function NewEntryForm() {
  const navigate = useNavigate();
  const createEntry = useCreateConfessionEntry();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormValues>({
    resolver: zodResolver(entrySchema),
    defaultValues: { urgeIntensitySlider: 1 },
  });

  const urgeIntensity = toUrgeIntensity(watch('urgeIntensitySlider'));

  async function onSubmit(values: EntryFormValues) {
    const entry = await createEntry.mutateAsync({
      content: values.content,
      urgeIntensity: toUrgeIntensity(values.urgeIntensitySlider),
    });
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

      <div>
        <label htmlFor="urgeIntensitySlider" className="block text-sm font-medium text-gray-700">
          Urge intensity: {urgeIntensity}/5
        </label>
        <input
          id="urgeIntensitySlider"
          type="range"
          min={0}
          max={5}
          step="any"
          className="mt-1 block w-full accent-indigo-600"
          {...register('urgeIntensitySlider', { valueAsNumber: true })}
        />
        {errors.urgeIntensitySlider && (
          <p className="mt-1 text-sm text-red-600">{errors.urgeIntensitySlider.message}</p>
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
