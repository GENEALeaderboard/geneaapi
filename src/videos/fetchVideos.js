import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchVideos(request, env, corsHeaders) {
	try {
		const db = env.DB_HEMVIP
		if (!db) {
			return responseFailed(null, "Database no found", 404, corsHeaders)
		}
		const response = await db.prepare("SELECT * FROM videos").all()

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
