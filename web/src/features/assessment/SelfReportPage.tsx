// Page for self-reporting addiction severity level.

import { SelfReportForm } from './SelfReportForm';

export function SelfReportPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Self-Report Severity</h1>
      <SelfReportForm />
    </div>
  );
}
