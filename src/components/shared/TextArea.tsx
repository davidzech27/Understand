import { forwardRef } from "react";

interface Props {
	value: string;
	setValue: (value: string) => void;
	placeholder: string;
}

const TextArea = forwardRef<HTMLTextAreaElement, Props>(
	({ value, setValue, placeholder }, ref) => {
		// figure out how to make grow properly later
		return (
			<textarea
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder={placeholder}
				ref={ref}
				className="-mb-1.5 h-full w-full cursor-pointer select-text resize-none rounded-md border-[1px] border-border bg-surface py-1.5 px-3 font-medium opacity-80 outline-none transition-colors duration-150 focus:cursor-auto focus:bg-surface-bright"
			/>
		);
	}
);

TextArea.displayName = "TextArea";

export default TextArea;
