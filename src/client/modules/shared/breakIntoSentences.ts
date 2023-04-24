const breakIntoSentences = (text: string) => {
	if (Intl.Segmenter === undefined) {
		return text.split(
			/(?<!\b(?:Mr|Mrs|Dr|Ms|Prof|Sr|Jr|St|e\.g|i\.e|etc)\.)(?<=[.?!][’”']?)\s+(?=[A-Z0-9])/g
		);
	}

	const segmenter = new Intl.Segmenter(undefined, {
		granularity: "sentence",
	});

	let sentences: string[] = [];

	for (const { segment: sentence } of segmenter.segment(text)) {
		sentences.push(sentence);
	}

	return sentences;
};

export default breakIntoSentences;
