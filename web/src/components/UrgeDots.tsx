// Compact visual representation of urge intensity (1–5) using five colored dots.
// Shared by the History page and Entry View page.
// See docs/DESIGN.md section 6 ("Component Library" — UrgeDots).

import { urgeColor } from '../utils/severityColors';

export function UrgeDots({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: n <= value ? urgeColor(value) : '#d4edea' }}
        />
      ))}
    </div>
  );
}
