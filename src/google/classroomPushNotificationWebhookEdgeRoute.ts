import { type NextRequest } from "next/server"

const webhookHandler = async (request: NextRequest) => {
	console.log(JSON.stringify(await request.json(), null, 4))

	return new Response()
}

export default webhookHandler
