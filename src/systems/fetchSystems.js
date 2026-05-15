import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchSystems(request, db, corsHeaders) {
	try {
		const url = new URL(request.url)
		const category = url.searchParams.get("category") || "origin"

		const response = await db.prepare("SELECT * FROM systems WHERE category = ?").bind(category).all()

		if (!response.results) {
			return responseFailed(null, "No systems found", 404, corsHeaders)
		}

		return responseSuccess(response.results, "Fetch systems success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
