import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchSubmissions(request, env, corsHeaders) {
	try {
		const db = env.DB_HEMVIP
		if (!db) {
			return responseFailed(null, "No database found", 404, corsHeaders)
		}

		const response = await db.prepare("SELECT * FROM submissions").all()

		if (!response.results) {
			return responseFailed(null, "No submissions found", 404, corsHeaders)
		}

		return responseSuccess({ submissions: response.results }, "Fetch submissions success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", errorMessage)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
