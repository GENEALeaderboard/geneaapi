import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchSystems(request, db, corsHeaders) {
	try {
		const response = await db.prepare("SELECT * FROM systems").all()

		if (!response.results) {
			return responseFailed(null, "No systems found", 404, corsHeaders)
		}

		return responseSuccess(response.results, "Fetch systems success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
