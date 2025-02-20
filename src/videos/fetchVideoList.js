import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchVideoList(request, db, corsHeaders) {
	try {
		const url = new URL(request.url)
		const params = new URLSearchParams(url.search)

		const type = params.get("type")

		if (!type) {
			return responseFailed(null, "Type is required", 404, corsHeaders)
		}

		const response = await db.prepare("SELECT * FROM videos WHERE type = ?").bind(type).run()

		if (!response.results) {
			return responseFailed(null, "No videos found", 404, corsHeaders)
		}

		return responseSuccess(response.results, "Fetch videos success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
