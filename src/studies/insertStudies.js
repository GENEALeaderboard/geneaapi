import { responseError, responseFailed, responseSuccess } from "../response"

export async function insertStudies(request, db, corsHeaders) {
	try {

		const { studies } = await request.json()
		if (!studies || !Array.isArray(studies)) {
			return responseFailed(null, "New studies not found or invalid format", 400, corsHeaders)
		}

		const studiesInsertedIds = []
		const stmt = await db.prepare("INSERT INTO studies (status, name, time_start, type, global_actions) VALUES (?, ?, ?, ?, ?)")
		const batch = []

		for (const study of studies) {
			const { status, name, time_start, type, global_actions } = study

			if (!status || !name || !time_start || !type || !global_actions) {
				throw new Error("Missing required fields in study object")
			}

			batch.push(stmt.bind(status, name, time_start, type, global_actions))
		}

		const batchResult = await db.batch(batch)
		console.log(JSON.stringify(batchResult))
		for (const result of batchResult) {
			studiesInsertedIds.push(result.meta.last_row_id)
		}
		console.log("studiesInsertedIds", studiesInsertedIds)
		return responseSuccess(studiesInsertedIds, "All studies inserted successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.error("Exception:", err) // Use console.error for errors
		return responseError(err, errorMessage, 500, corsHeaders) // Use 500 for server errors
	}
}
