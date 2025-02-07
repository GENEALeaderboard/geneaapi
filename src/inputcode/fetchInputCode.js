import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchInputCode(request, env, corsHeaders) {
	try {
		// const result = {}
		const db = env.DB_HEMVIP
		const response = await db.prepare("SELECT * FROM inputcode").all()

		if (!response.result) {
			return responseFailed("No studies found", 404, corsHeaders)
		}

		return responseSuccess({ codes: response.result }, corsHeaders)
	} catch (err) {
		console.error("Exception", err)
		return responseError(err, "Exception", 500, corsHeaders)
	}
}
