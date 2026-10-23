import { useEffect, type ReactNode } from 'react';
import { Icon } from './Icon';
import s from './Modal.module.css';

export function Modal({
	open,
	onClose,
	title,
	children,
	footer
}: {
	open: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	footer?: ReactNode;
}) {
	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className={s.backdrop}
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			{/* macOS-style sheet: drops down from the top of the window */}
			<div className={s.sheet} role="dialog" aria-modal="true" aria-label={title}>
				<header className={s.header}>
					<h2>{title}</h2>
					<button className="tool-btn" onClick={onClose} aria-label="Close">
						<Icon name="x" size={14} />
					</button>
				</header>
				<div className={s.body}>{children}</div>
				{footer && <footer className={s.footer}>{footer}</footer>}
			</div>
		</div>
	);
}
