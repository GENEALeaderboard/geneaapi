import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchConfigs(request, db, corsHeaders) {
	try {
		const url = new URL(request.url) // Parse the request URL
		const params = new URLSearchParams(url.search)

		const type = params.get("type") // Get specific query param
		if (!type) {
			console.log("request", request)
			return responseFailed(null, "Study type is required", 400, corsHeaders)
		}

		const { results: configs } = await db.prepare("SELECT * FROM configs WHERE type = ?").bind(type).run()
		if (!configs) {
			return responseFailed(null, "No study configs found", 404, corsHeaders)
		}

		return responseSuccess(configs, "Fetch configs success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
