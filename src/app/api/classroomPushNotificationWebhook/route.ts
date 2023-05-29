import webhookHandler from "~/sync/classroomPushNotificationWebhookEdgeRoute"

export const runtime = "edge"

export const POST = webhookHandler
