import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TranslationTable } from '../TranslationTable';

test('saves full target string', async () => {
  const onSave = vi.fn();
  const user = userEvent.setup();

  render(
    <TranslationTable
      units={[{ id: 'k', source: 'Hello', target: '' }]}
      onSave={onSave}
      onDelete={vi.fn()}
      onAddKey={vi.fn()}
      onClearTranslation={vi.fn()}
      onReorder={vi.fn()}
      searchQuery=""
      sourceLanguage="en"
      targetLanguage="de"
      xliffVersion="1.2"
      onVersionChange={vi.fn()}
      isSourceOnly={false}
    />
  );

  const target = screen.getByPlaceholderText(/enter translation/i);
  await user.type(target, 'Beispiel');

  const saveButton = screen.getByRole('button', { name: /save/i });
  await user.click(saveButton);

  expect(onSave).toHaveBeenCalledTimes(1);
  expect(onSave).toHaveBeenCalledWith('k', 'k', 'Hello', 'Beispiel');
});
