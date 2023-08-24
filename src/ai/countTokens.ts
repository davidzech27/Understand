import wasm from "tiktoken/lite/tiktoken_bg.wasm?module"
import model from "tiktoken/encoders/cl100k_base.json"
import { init, Tiktoken } from "tiktoken/lite/init"

export async function initializeWASM() {
	await init((imports) => WebAssembly.instantiate(wasm, imports))
}

export default function countTokens(
	arg: (
		| { text: string }
		| {
				messages: {
					role: "assistant" | "user" | "system"
					content: string
				}[]
		  }
	) & {
		model: "gpt-4-0613" | "gpt-3.5-turbo-0613" | "gpt-3.5-turbo-16k-0613"
	}
) {
	const encoding = new Tiktoken(
		model.bpe_ranks,
		model.special_tokens,
		model.pat_str
	)

	if ("text" in arg) {
		const tokens = encoding.encode(arg.text)

		encoding.free()

		return tokens.length
	}

	const chatML = arg.messages
		.map(
			({ role, content }) => `<|im_start|>${role}
${content}
<|im_end|>`
		)
		.join("\n")
		.concat("\n<|im_start|>assistant")

	const tokens = encoding.encode(chatML)

	encoding.free()

	return tokens.length
}
