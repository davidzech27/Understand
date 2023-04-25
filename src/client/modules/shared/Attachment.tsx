import { useRef } from "react";
import Link from "next/link";
import RowItem from "./RowItem";

interface Props {
	id: string;
	title?: string;
	url: string;
	thumbnailUrl?: string;
}

const Attachment: React.FC<Props> = ({ id, title, url, thumbnailUrl }) => {
	const linkRef = useRef<HTMLAnchorElement>(null);

	return (
		<RowItem id={id}>
			<div
				ref={(element) => {
					linkRef.current &&
						element &&
						(linkRef.current.style.width = `${
							element.offsetWidth - 60
						}px`);
				}}
				className="flex h-20 cursor-pointer items-center"
			>
				{thumbnailUrl !== undefined ? (
					<img
						src={thumbnailUrl}
						alt={`Thumbnail of attachment with ${
							title !== undefined ? `title ${title}` : "no title"
						}`}
						className="aspect-square h-12 rounded-full border-[0.75px] border-border"
					/>
				) : (
					<div className="h-12 w-12 border-[0.75px] border-border" />
				)}

				{/* select text not working here */}
				<div className="ml-3 flex flex-shrink flex-col">
					{title !== undefined && (
						<span className="mb-[1px] font-medium leading-none opacity-90">
							{title}
						</span>
					)}

					<Link
						href={url}
						onClick={(e) => e.stopPropagation()}
						target="_blank"
						ref={linkRef}
						className="w-min overflow-hidden overflow-ellipsis whitespace-nowrap text-sm opacity-60 hover:underline" // ellipsis not working yet
					>
						{url}
					</Link>
				</div>
			</div>
		</RowItem>
	);
};

export default Attachment;
