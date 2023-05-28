import webhookHandler from "~/google/classroomPushNotificationWebhookEdgeRoute"

export const runtime = "edge"

export const POST = webhookHandler
