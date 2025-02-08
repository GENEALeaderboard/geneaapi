import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchInputCode(request, db, corsHeaders) {
	try {
		const response = await db.prepare("SELECT * FROM inputcode").all()

		if (!response.results || response.results.length === 0) {
			return responseFailed(null, "No inputcode found", 404, corsHeaders)
		}

		const codes = response.results[0].code.split(",")

		return responseSuccess(codes, "Fetch codes success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
