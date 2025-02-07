import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchInputCode(request, env, corsHeaders) {
	try {
		const db = env.DB_HEMVIP
		const response = await db.prepare("SELECT * FROM inputcode").all()

		if (!response.results) {
			return responseFailed(null, "No inputcode found", 404, corsHeaders)
		}

		const codes = response.results[0].code.split(",")

		return responseSuccess(codes, corsHeaders)
	} catch (err) {
		console.error("Exception", err)
		return responseError(err, "Exception", 500, corsHeaders)
	}
}
