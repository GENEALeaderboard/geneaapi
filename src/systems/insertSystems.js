import { responseError, responseFailed, responseSuccess } from "../response"

export async function insertSystems(request, env, corsHeaders) {
	try {
		const db = env.DB_HEMVIP
		if (!db) {
			return responseFailed(null, "No database found", 404, corsHeaders)
		}

		const { codes } = await request.json()
		if (!codes) {
			return responseFailed(null, "Invalid input", 400, corsHeaders)
		}

		const response = await db.prepare("UPDATE inputcode SET code = ? WHERE id = 1").bind(codes).run()
		if (!response.success) {
			return responseFailed(null, "Failed to update inputcode", 400, corsHeaders)
		}

		return responseSuccess({}, "Input Codes updated successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", errorMessage)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
