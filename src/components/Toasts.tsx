import { useSnapshot } from 'valtio';
import { app } from '../lib/state';
import s from './Toasts.module.css';

export function Toasts() {
	const { toasts } = useSnapshot(app);
	return (
		<div className={s.stack}>
			{toasts.map((t) => (
				<div key={t.id} className={`${s.toast} ${s[t.kind]}`}>
					<span className={s.dot}></span>
					{t.message}
				</div>
			))}
		</div>
	);
}
