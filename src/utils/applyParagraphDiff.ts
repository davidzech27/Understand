import splitSentences from "./splitSentences"

export default function applyParagraphDiff(
	paragraph: string,
	diff: {
		sentence: number
		oldContent: string
		newContent: string
	}
) {
	const sentences = splitSentences(paragraph)

	const diffSentenceIndex = diff.sentence - 1

	const preDiff = sentences.slice(0, diffSentenceIndex).join("")
	const postDiff = sentences.slice(diffSentenceIndex).join("")

	return preDiff.concat(postDiff.replace(diff.oldContent, diff.newContent))
}
