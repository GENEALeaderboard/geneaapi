import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchAttentionCheck(request, db, corsHeaders) {
	try {
		const response = await db.prepare("SELECT * FROM attentioncheck").all()

		if (!response.results) {
			return responseFailed(null, "No videos found", 404, corsHeaders)
		}

		return responseSuccess(response.results, "Fetch attention check success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
