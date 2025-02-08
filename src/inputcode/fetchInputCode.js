import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchInputCode(request, env, corsHeaders) {
	try {
		const db = env.DB_HEMVIP
		if (!db) {
			return responseFailed(null, "No database found", 404, corsHeaders)
		}

		const response = await db.prepare("SELECT * FROM inputcode").all()

		if (!response.results) {
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
