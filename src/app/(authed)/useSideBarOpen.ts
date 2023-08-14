import { atom, useAtom } from "jotai"

const sideBarOpenAtom = atom(true)

export default function useSideBarOpen() {
	const [sideBarOpen, setSideBarOpen] = useAtom(sideBarOpenAtom)

	return {
		sideBarOpen,
		toggleSideBarOpen: () => setSideBarOpen((prev) => !prev),
	}
}
