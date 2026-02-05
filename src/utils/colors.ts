const DAY_COLORS = [
  '#4285F4', // blue
  '#EA4335', // red
  '#34A853', // green
  '#FBBC05', // yellow
  '#8E24AA', // purple
  '#00ACC1', // cyan
  '#FF7043', // deep orange
  '#5C6BC0', // indigo
  '#26A69A', // teal
  '#EC407A', // pink
];

export const DEFAULT_SEGMENT_WIDTH = 4;

export function getDayColor(index: number): string {
  return DAY_COLORS[index % DAY_COLORS.length];
}

export function getSegmentColor(segment: { color?: string }, day: { color: string }): string {
  return segment.color ?? day.color;
}

export function getSegmentWidth(segment: { width?: number }): number {
  return segment.width ?? DEFAULT_SEGMENT_WIDTH;
}
