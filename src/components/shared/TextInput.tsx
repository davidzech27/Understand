import { forwardRef } from "react";
import clsx from "clsx";

interface Props {
	value: string;
	setValue: (value: string) => void;
	placeholder: string;
	bigText?: true;
	autofocus?: true;
}

const TextInput = forwardRef<HTMLInputElement, Props>(
	({ value, setValue, placeholder, bigText, autofocus }, ref) => {
		return (
			<input
				type="text"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				placeholder={placeholder}
				autoFocus={autofocus}
				ref={ref}
				className={clsx(
					"-mb-1.5 h-full w-full cursor-pointer resize-none rounded-md border-[1px] border-border bg-surface py-1.5 px-3 font-medium opacity-80 outline-none transition-colors duration-150 focus:cursor-auto focus:bg-surface-bright",
					bigText && "text-xl"
				)}
			/>
		);
	}
);

TextInput.displayName = "TextArea";

export default TextInput;