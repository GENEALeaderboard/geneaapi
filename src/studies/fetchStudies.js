import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchStudies(request, db, corsHeaders) {
	try {
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
