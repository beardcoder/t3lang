import { sortUnits } from '../sort';

const units = [
  { id: 'b.key', source: 'Zebra', target: '' },
  { id: 'a.key', source: 'Apple', target: '' },
];

test('sortUnits sorts by key ascending', () => {
  const sorted = sortUnits(units, 'key-asc');
  expect(sorted.map((u) => u.id)).toEqual(['a.key', 'b.key']);
});

test('sortUnits sorts by source ascending', () => {
  const sorted = sortUnits(units, 'source-asc');
  expect(sorted.map((u) => u.source)).toEqual(['Apple', 'Zebra']);
});
