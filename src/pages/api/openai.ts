import openaiHandler from "~/server/modules/openai/edgeRoute";

export const config = {
	runtime: "edge",
};

export default openaiHandler;
