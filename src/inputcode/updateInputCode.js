import { responseError, responseFailed, responseSuccess } from "../response"

export async function updateInputCode(request, env, corsHeaders) {
	try {
		// const result = {}
		const db = env.DB_HEMVIP
		const response = await db.prepare('INSERT INTO inputcode (id, code) VALUES (1, "wayne_0_1_1")').all()
		console.log("response", JSON.stringify(response))

		if (!response.results) {
			return responseFailed(null, "No inputcodes found", 404, corsHeaders)
		}

		return responseSuccess({ codes: response.results }, corsHeaders)
	} catch (err) {
		console.error("Exception", err)
		return responseError(err, "Exception", 500, corsHeaders)
	}
}
