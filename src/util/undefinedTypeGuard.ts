const undefinedTypeGuard = <TData>(data: TData | undefined): data is TData => {
	return data !== undefined;
};

export default undefinedTypeGuard;
