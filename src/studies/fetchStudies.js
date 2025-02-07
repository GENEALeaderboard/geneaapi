import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchStudies(client, request, env, corsHeaders) {
	try {
		const db = env.DB_HEMVIP
		const response = await db.prepare("SELECT * FROM studies").all()

		if (!response.result) {
			return responseFailed(null, "No studies found", 404, corsHeaders)
		}

		return responseSuccess({ codes: response.result }, "Fetch studies success", corsHeaders)
	} catch (err) {
		return responseError(err, "Exception", 401, corsHeaders)
	}
}
