import { responseError, responseFailed, responseSuccess } from "../response"

export async function updateInputCode(request, env, corsHeaders) {
	try {
		const { codes } = await request.json()
		console.log("codes", codes)
		const db = env.DB_HEMVIP
		const response = await db.prepare("UPDATE inputcode SET code = ? WHERE id = 1").bind(codes).run()
		console.log("response", JSON.stringify(response))

		if (!response.success) {
			return responseFailed(null, "Failed to update inputcode", 400, corsHeaders)
		}

		return responseSuccess({}, "Input Codes updated successfully", corsHeaders)
	} catch (err) {
		console.error("Exception", err)
		return responseError(err, "Exception", 500, corsHeaders)
	}
}
