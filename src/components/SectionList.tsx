import { Fragment } from "react"

import Heading from "./Heading"
import UnorderedList from "./UnorderedList"

interface Props<TItem> {
	sections: {
		heading: string
		items: TItem[]
		renderItem: ({
			item,
			index,
		}: {
			item: TItem
			index: number
		}) => React.ReactNode
		renderEmpty?: () => React.ReactNode
	}[]
	headingSize: "small" | "medium" | "large"
	className?: string
}

export default function SectionList<TItem>({
	sections,
	headingSize,
	className,
}: Props<TItem>) {
	return (
		<div className={className}>
			{sections.map(
				({ heading, items, renderItem, renderEmpty }, index) => (
					<Fragment key={index}>
						<Heading size={headingSize} className="ml-1">
							{heading}
						</Heading>

						<UnorderedList
							items={items}
							renderItem={(item, index) =>
								renderItem({ item, index })
							}
							renderEmpty={() =>
								renderEmpty !== undefined ? renderEmpty() : null
							}
							className="mb-2.5 mt-2"
						/>
					</Fragment>
				),
			)}
		</div>
	)
}
