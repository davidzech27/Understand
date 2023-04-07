import Link from "next/link";

interface Props {
	title?: string;
	url: string;
	thumbnailUrl?: string;
	onClick: () => void;
}

const Attachment: React.FC<Props> = ({ title, url, thumbnailUrl, onClick }) => {
	return (
		<div
			onClick={onClick}
			className="flex h-20 cursor-pointer items-center rounded-md border-[0.75px] border-border pl-6 pr-8 transition-colors duration-150 hover:bg-surface-hover"
		>
			{thumbnailUrl !== undefined ? (
				<img
					src={thumbnailUrl}
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
					className="w-min overflow-hidden overflow-ellipsis whitespace-nowrap text-sm opacity-60 hover:underline" // ellipsis not working yet
				>
					{url}
				</Link>
			</div>
		</div>
	);
};

export default Attachment;
