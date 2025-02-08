import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchSubmissions(client, request, env, corsHeaders) {
	try {
		const db = env.DB_HEMVIP
		const response = await db.prepare("SELECT * FROM submissions").all()

		if (!response.result) {
			return responseFailed(null, "No submissions found", 404, corsHeaders)
		}

		return responseSuccess({ submissions: response.result }, "Fetch submissions success", corsHeaders)
	} catch (err) {
		return responseError(err, "Exception", 401, corsHeaders)
	}
}
