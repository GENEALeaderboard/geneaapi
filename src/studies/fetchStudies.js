import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchStudies(client, request, env, corsHeaders) {
	try {
		const db = env.DB_HEMVIP
		if (!db) {
			return responseFailed(null, "No database found", 404, corsHeaders)
		}

		const response = await db.prepare("SELECT * FROM studies").all()

		if (!response.results) {
			return responseFailed(null, "No studies found", 404, corsHeaders)
		}

		return responseSuccess({ codes: response.results }, "Fetch studies success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
