import {
	useState,
	useEffect,
	type Dispatch,
	type SetStateAction,
	useRef,
} from "react";

const useStickyState = <S>(
	defaultValue: S,
	key: string
): [S, Dispatch<SetStateAction<S>>] => {
	const [value, setValue] = useState<S>(
		typeof window !== "undefined"
			? () => {
					const stickyValue = window.localStorage.getItem(key);

					return stickyValue !== null
						? (JSON.parse(stickyValue) as S)
						: defaultValue;
			  }
			: defaultValue
	);

	const oldKey = useRef(key);

	useEffect(() => {
		if (key === oldKey.current) {
			window.localStorage.setItem(key, JSON.stringify(value));
		} else {
			oldKey.current = key;
		}
	}, [key, value]);

	useEffect(() => {
		setValue(() => {
			const stickyValue = window.localStorage.getItem(key);

			return stickyValue !== null
				? (JSON.parse(stickyValue) as S)
				: defaultValue;
		});
	}, [key, defaultValue]);

	return [value, setValue];
};

export default useStickyState;
