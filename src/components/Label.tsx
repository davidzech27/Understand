import Heading from "./Heading"

interface Props extends React.PropsWithChildren {
	htmlFor?: string
}

export default function Label({ children, htmlFor }: Props) {
	if (typeof children !== "string")
		throw new Error(
			"String must be passed to a Label component's children prop"
		)

	return (
		<Heading asChild size="medium" className="ml-1 block">
			<label
				htmlFor={htmlFor ?? children.replaceAll(" ", "-").toLowerCase()}
			>
				{children}
			</label>
		</Heading>
	)
}
