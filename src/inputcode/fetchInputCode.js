import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchInputCode(request, env, corsHeaders) {
	try {
		// const result = {}
		const result = await db.prepare("SELECT * FROM inputcode").all()
		console.log("result", result)
		return responseSuccess(result, corsHeaders)
		if (!result) {
			return responseFailed("No studies found", 404, corsHeaders)
		}

		return responseSuccess({ codes: result }, corsHeaders)
	} catch (err) {
		console.error("Exception", err)
		return responseError(err, "Exception", 500, corsHeaders)
	}
}
