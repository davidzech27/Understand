import { useEffect, useRef } from "react";

const useCallOnce = (fn: () => void) => {
	const called = useRef(false);

	useEffect(() => {
		if (called.current) return;

		fn();

		called.current = true;
	}, []);
};

export default useCallOnce;
