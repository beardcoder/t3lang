import { useEffect, useLayoutEffect, type RefObject } from 'react';

/** Auto-grow a textarea to fit its content. Re-measures when `value` changes
 *  and when the textarea's width changes (layout, window resize, panel toggles). */
export function useAutosize(ref: RefObject<HTMLTextAreaElement | null>, value: unknown) {
	useLayoutEffect(() => {
		const node = ref.current;
		if (node) resize(node);
	}, [ref, value]);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;
		// Guard on width so setting height doesn't loop the observer.
		// Resize on the next frame so we don't change layout inside the observer callback.
		let lastWidth = -1;
		let frame = 0;
		const ro = new ResizeObserver((entries) => {
			const w = entries[0].contentRect.width;
			if (w === lastWidth) return;
			lastWidth = w;
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => resize(node));
		});
		ro.observe(node);
		return () => {
			cancelAnimationFrame(frame);
			ro.disconnect();
		};
	}, [ref]);
}

function resize(node: HTMLTextAreaElement) {
	node.style.height = 'auto';
	node.style.height = `${Math.min(node.scrollHeight, 320)}px`;
}

/** Join truthy class names. */
export function cx(...names: (string | false | null | undefined)[]): string {
	return names.filter(Boolean).join(' ');
}
