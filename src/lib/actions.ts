/** Auto-grow a textarea to fit its content. Pass the bound value so the action
 *  re-measures when the value changes programmatically. */
export function autosize(node: HTMLTextAreaElement, _value?: unknown) {
	const resize = () => {
		node.style.height = 'auto';
		node.style.height = `${Math.min(node.scrollHeight, 320)}px`;
	};

	// Re-measure when the textarea's width changes (layout, window resize, panel
	// toggles). Guard on width so setting height doesn't loop the observer.
	let lastWidth = -1;
	const ro = new ResizeObserver((entries) => {
		const w = entries[0].contentRect.width;
		if (w !== lastWidth) {
			lastWidth = w;
			resize();
		}
	});
	ro.observe(node);

	// Initial measure after the element has been laid out.
	requestAnimationFrame(resize);
	node.addEventListener('input', resize);

	return {
		update() {
			requestAnimationFrame(resize);
		},
		destroy() {
			ro.disconnect();
			node.removeEventListener('input', resize);
		}
	};
}
