// Shared color/label scales for addiction severity and urge intensity.
// See docs/DESIGN.md section 2 ("Design Tokens & Theme") for the source spec.

export const severityColors = ['', '#3dbf7e', '#5cc98a', '#f0a500', '#e07340', '#d94f4f'];
//                                ↑ empty slot so index 1 = Minimal, 5 = Severe
export const severityLabels = ['', 'Minimal', 'Mild', 'Moderate', 'Significant', 'Severe'];

export function urgeColor(v: number): string {
  if (v <= 1) return '#3dbf7e';
  if (v <= 2) return '#5cc98a';
  if (v <= 3) return '#f0a500';
  if (v <= 4) return '#e07340';
  return '#d94f4f';
}
