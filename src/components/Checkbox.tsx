import type { MouseEvent } from 'react';
import { cx } from '../lib/hooks';
import { Icon } from './Icon';
import s from './CatalogView.module.css';

/** Compact row-selection checkbox (supports the "mixed" state for select-all). */
export function Checkbox({
	state,
	onClick,
	label
}: {
	state: 'on' | 'off' | 'mixed';
	onClick: (e: MouseEvent) => void;
	label: string;
}) {
	return (
		<button
			className={cx(s.check, state !== 'off' && s.checked)}
			role="checkbox"
			aria-checked={state === 'mixed' ? 'mixed' : state === 'on'}
			aria-label={label}
			title={label}
			onClick={onClick}
		>
			{state === 'on' && <Icon name="check" size={10} stroke={3} />}
			{state === 'mixed' && <Icon name="minus" size={10} stroke={3} />}
		</button>
	);
}
