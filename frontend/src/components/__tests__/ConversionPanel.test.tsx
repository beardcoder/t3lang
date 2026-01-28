import { render, screen, fireEvent } from '@testing-library/react';
import { ConversionPanel } from '../ConversionPanel';

test('conversion panel confirms selected version', () => {
  const onConfirm = vi.fn();

  render(
    <ConversionPanel
      isOpen
      currentVersion="1.2"
      onClose={() => {}}
      onConfirm={onConfirm}
    />
  );

  const option = screen.getByLabelText(/xliff 2\.0/i) as HTMLInputElement;
  fireEvent.click(option);

  const confirmButton = screen.getByRole('button', { name: /convert/i });
  fireEvent.click(confirmButton);

  expect(onConfirm).toHaveBeenCalledWith('2.0');
});
