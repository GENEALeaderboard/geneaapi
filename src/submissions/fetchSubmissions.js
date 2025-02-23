import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchSubmissions(request, db, corsHeaders) {
	try {
		const response = await db.prepare("SELECT * FROM submissions").all()

		if (!response.results) {
			return responseFailed(null, "No submissions found", 404, corsHeaders)
		}

		return responseSuccess(response.results, "Fetch submissions success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
