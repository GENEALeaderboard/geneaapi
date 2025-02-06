import { responseError, responseFailed, responseSuccess } from "./response"

export async function fetchInputCode(client, request, env, corsHeaders) {
	try {
		const db = client.db("hemvip")

		const result = await db.collection("inputcode").find({}).toArray()
		const { codes } = result[0]
		if (!result) {
			return responseFailed("No studies found", 404, corsHeaders)
		}

		return responseSuccess({codes: codes}, corsHeaders)
	} catch (err) {
		return responseError(err, "Exception", 401, corsHeaders)
	}
}
