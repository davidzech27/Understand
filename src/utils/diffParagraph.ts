import splitSentences from "./splitSentences"

export default function diffParagraph(
	oldParagraph: string,
	newParagraph: string,
) {
	if (oldParagraph.trim() === newParagraph.trim()) return undefined

	const oldSentences = splitSentences(oldParagraph)
	const newSentences = splitSentences(newParagraph)

	let firstDifferenceSentenceIndex = 0

	while (
		firstDifferenceSentenceIndex <
		Math.min(oldSentences.length, newSentences.length)
	) {
		if (
			oldSentences[firstDifferenceSentenceIndex]?.trim() !==
			newSentences[firstDifferenceSentenceIndex]?.trim()
		)
			break

		firstDifferenceSentenceIndex++
	}

	let lastDifferenceSentenceReverseIndex = 0

	while (
		lastDifferenceSentenceReverseIndex <
		Math.min(oldSentences.length, newSentences.length)
	) {
		if (
			oldSentences[
				oldSentences.length - 1 - lastDifferenceSentenceReverseIndex
			]?.trim() !==
			newSentences[
				newSentences.length - 1 - lastDifferenceSentenceReverseIndex
			]?.trim()
		)
			break

		lastDifferenceSentenceReverseIndex++
	}

	return {
		sentence: firstDifferenceSentenceIndex + 1,
		oldContent: oldSentences
			.slice(
				firstDifferenceSentenceIndex,
				oldSentences.length - lastDifferenceSentenceReverseIndex,
			)
			.join("")
			.trim(),
		newContent: newSentences
			.slice(
				firstDifferenceSentenceIndex,
				newSentences.length - lastDifferenceSentenceReverseIndex,
			)
			.join("")
			.trim(),
	}
}
