import { responseError, responseFailed, responseSuccess } from "../response"

export async function deleteStudies(request, db, corsHeaders) {
	try {
		const { ids } = await request.json()
		if (!ids || !Array.isArray(ids) || ids.length === 0) {
			return responseFailed(null, "ids array is required", 400, corsHeaders)
		}

		const placeholders = ids.map(() => "?").join(", ")
		await db.prepare(`DELETE FROM studies WHERE id IN (${placeholders}) AND status = 'new'`).bind(...ids).run()

		return responseSuccess(null, "Studies deleted successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.error("Exception:", err)
		return responseError(err, errorMessage, 500, corsHeaders)
	}
}
