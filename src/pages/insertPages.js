import { responseError, responseFailed, responseSuccess } from "../response"

export async function insertPages(request, db, corsHeaders) {
	try {
		const { pages } = await request.json()
		if (!pages) {
			return responseFailed(null, "New pages not found", 400, corsHeaders)
		}

		const stmt = await db.prepare(
			`INSERT INTO pages (type, name, question, selected, actions, options, system1, system2, video1, video2, studyid, expected_vote)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		const batch = []

		for (const page of pages) {
			const requiredFields = [
				"type",
				"name",
				"question",
				"selected",
				"actions",
				"options",
				"system1",
				"system2",
				"video1",
				"video2",
				"studyid",
				"expected_vote",
			]
			const missingFields = requiredFields.filter((field) => !page[field])
			if (missingFields.length > 0) {
				console.log("page", JSON.stringify(page))
				return responseError(null, `Missing required fields in ${missingFields.join(", ")}`, 400, corsHeaders)
			}

			const { type, name, question, selected, actions, options, system1, system2, video1, video2, studyid, expected_vote } = page

			batch.push(stmt.bind(type, name, question, selected, actions, options, system1, system2, video1, video2, studyid, expected_vote))
		}

		const batchResult = await db.batch(batch)
		console.log(JSON.stringify(batchResult))
		if (!batchResult) {
			console.log(JSON.stringify(batchResult))
			return responseFailed(JSON.stringify(batchResult), `Failed to insert pages`, 400, corsHeaders)
		}

		return responseSuccess(batchResult, "All pages updated successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
