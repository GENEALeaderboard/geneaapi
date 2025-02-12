import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchStudies(request, db, corsHeaders) {
	try {
		const { results: studies } = await db.prepare("SELECT * FROM studies").all()
		if (studies.length === 0) {
			return responseFailed(null, "No studies found", 404, corsHeaders)
		}

		const stmtPages = db.prepare(`SELECT * FROM pages WHERE studyid = ?`)
		const batch = []

		for (let study of studies) {
			batch.push(stmtPages.bind(study.id))
		}
		const batchResults = await db.batch(batch)

		if (batchResults.length !== studies.length) {
			console.log("batchResults", batchResults)
			return responseFailed(null, "Pages length not match with studies", 400, corsHeaders)
		}
		const studiesWithPages = studies.map((study, index) => {
			const { results: pages } = batchResults[index]
			return {
				...study,
				pages: pages,
			}
		})
		return responseSuccess(studiesWithPages, "Fetch studies success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
