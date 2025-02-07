import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchStudies(client, request, env, corsHeaders) {
	try {
		const db = client.db("hemvip")

		const result = await db.collection("studies").findOne({})
		if (!result) {
			return responseFailed("No studies found", 404, corsHeaders)
		}

		return responseSuccess(result, corsHeaders)
	} catch (err) {
		return responseError(err, "Exception", 401, corsHeaders)
	}
}
