import { useEffect } from "react";
import { forwardRef, ForwardedRef } from "react";
import ExpandingTextArea from "react-expanding-textarea";

interface Props {
	value: string;
	setValue: (value: string) => void;
	placeholder: string;
	id?: string;
	onEnter?: () => void;
}

const TextArea = forwardRef<HTMLTextAreaElement, Props>(
	({ value, setValue, placeholder, id, onEnter }, ref) => {
		return (
			<ExpandingTextArea
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={(e) => {
					if (
						onEnter !== undefined &&
						e.key === "Enter" &&
						!e.shiftKey
					) {
						e.preventDefault();

						onEnter();
					}
				}}
				placeholder={placeholder}
				id={id}
				ref={ref}
				className="-mb-1.5 h-full w-full cursor-pointer select-text resize-none rounded-md border-[1px] border-border bg-surface py-1.5 px-3 font-medium opacity-80 transition-colors duration-150 focus:cursor-auto focus:bg-surface-bright"
			/>
		);
	}
);

TextArea.displayName = "TextArea";

export default TextArea;
