import { type NextRequest } from "next/server"

const webhookHandler = async (request: NextRequest) => {
	console.log(JSON.stringify(request, null, 4))
}

export default webhookHandler
