/**
 * One continuous ink line in the shape of a brain. It draws itself on load
 * (see .brain-draw in globals.css).
 *
 * To use your own drawing: draw it as ONE stroke path (no fill), export as SVG,
 * and paste its `d="..."` value into BRAIN_PATH below. Keep viewBox in sync
 * with your SVG's viewBox.
 */
export const BRAIN_VIEWBOX = '0 0 240 200';
export const BRAIN_PATH =
  'M120 192 C120 178 118 166 112 158 C95 161 77 156 66 146 C46 150 26 138 24 118 C8 110 6 86 20 74 C14 54 30 36 50 36 C56 18 80 8 100 16 C112 4 138 4 150 16 C170 8 196 18 200 38 C222 42 236 62 228 82 C242 96 236 122 218 128 C214 146 196 156 178 150 C168 160 148 162 136 156 C130 162 124 160 118 156 C110 140 118 124 106 114 C94 104 76 108 70 95 C64 82 80 72 76 60 C92 66 104 52 120 58 C134 64 128 84 146 86 C162 88 168 70 184 74 C200 78 196 98 182 104 C170 110 172 126 160 132';

export function BrainLine({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox={BRAIN_VIEWBOX}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`brain-draw ${className}`}
    >
      <path pathLength={1} d={BRAIN_PATH} />
    </svg>
  );
}
