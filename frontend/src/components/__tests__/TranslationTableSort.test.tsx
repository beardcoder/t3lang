import { render, screen, fireEvent } from '@testing-library/react';
import { TranslationTable } from '../TranslationTable';

const units = [
  { id: 'b.key', source: 'Zebra', target: '' },
  { id: 'a.key', source: 'Apple', target: '' },
];

test('applies automatic sort by key', () => {
  const onReorder = vi.fn();

  render(
    <TranslationTable
      units={units}
      onSave={vi.fn()}
      onDelete={vi.fn()}
      onAddKey={vi.fn()}
      onClearTranslation={vi.fn()}
      onReorder={onReorder}
      searchQuery=""
      sourceLanguage="en"
      targetLanguage="de"
      xliffVersion="1.2"
      onVersionChange={vi.fn()}
      isSourceOnly
    />
  );

  const select = screen.getByLabelText(/sort order/i) as HTMLSelectElement;
  fireEvent.change(select, { target: { value: 'key-asc' } });

  const applyButton = screen.getByRole('button', { name: /apply sort/i });
  fireEvent.click(applyButton);

  expect(onReorder).toHaveBeenCalledTimes(1);
  expect(onReorder.mock.calls[0][0].map((unit: { id: string }) => unit.id)).toEqual(['a.key', 'b.key']);
});
