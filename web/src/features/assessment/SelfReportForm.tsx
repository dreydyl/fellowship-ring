// Self-report form for addiction severity level.
//
// Pre-populated with the user's current profile (severity + struggle
// note) so they can quickly confirm or adjust rather than starting
// from scratch each time.

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useProfile } from './hooks/useProfile';
import { useSubmitSelfReport } from './hooks/useSubmitSelfReport';

const selfReportSchema = z.object({
  severityLevel: z.coerce.number().int().min(1).max(5),
  addictionType: z.string().optional(),
});

type SelfReportValues = z.infer<typeof selfReportSchema>;

export function SelfReportForm() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const submitSelfReport = useSubmitSelfReport();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SelfReportValues>({
    resolver: zodResolver(selfReportSchema),
    defaultValues: { severityLevel: 3 },
  });

  useEffect(() => {
    if (!profile) return;
    reset({
      severityLevel: profile.current_severity_level ?? 3,
      addictionType: profile.current_addiction_type ?? '',
    });
  }, [profile, reset]);

  async function onSubmit(values: SelfReportValues) {
    await submitSelfReport.mutateAsync({
      severityLevel: values.severityLevel,
      addictionType: values.addictionType,
    });
    navigate('/');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="severityLevel" className="block text-sm font-medium text-gray-700">
          How severe would you say this is right now? (1 = mild, 5 = severe)
        </label>
        <input
          id="severityLevel"
          type="number"
          min={1}
          max={5}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          {...register('severityLevel')}
        />
        {errors.severityLevel && (
          <p className="mt-1 text-sm text-red-600">{errors.severityLevel.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="addictionType" className="block text-sm font-medium text-gray-700">
          What are you struggling with? (optional)
        </label>
        <input
          id="addictionType"
          type="text"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          {...register('addictionType')}
        />
      </div>

      {submitSelfReport.isError && (
        <p className="text-sm text-red-600">
          {submitSelfReport.error instanceof Error
            ? submitSelfReport.error.message
            : 'Something went wrong submitting your report.'}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        Submit
      </button>
    </form>
  );
}
