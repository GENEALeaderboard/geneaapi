import { responseError, responseFailed, responseSuccess } from "../response"

// SQLite/D1 caps a statement at 999 bound variables; chunk IN(...) lists below it.
const IN_CHUNK = 900

export async function fetchStudies(request, db, corsHeaders) {
	try {
		// Optional ?type= filter: only studies of that type.
		const url = new URL(request.url)
		const type = url.searchParams.get("type")

		const studiesStmt = type
			? db.prepare("SELECT * FROM studies WHERE type = ?").bind(type)
			: db.prepare("SELECT * FROM studies")
		const { results: studies } = await studiesStmt.all()
		if (studies.length === 0) {
			return responseFailed(null, type ? `No studies found with type '${type}'` : "No studies found", 404, corsHeaders)
		}

		// Fetch pages for the returned studies in one (chunked) query, grouped by
		// studyid — not one full-table scan per study. Uses the index on pages(studyid).
		const ids = studies.map((study) => study.id)
		const pagesDict = {}
		for (let i = 0; i < ids.length; i += IN_CHUNK) {
			const slice = ids.slice(i, i + IN_CHUNK)
			const placeholders = slice.map(() => "?").join(", ")
			const { results } = await db
				.prepare(`SELECT * FROM pages WHERE studyid IN (${placeholders})`)
				.bind(...slice)
				.all()
			for (const page of results) {
				;(pagesDict[page.studyid] ||= []).push(page)
			}
		}

		const studiesWithPages = studies.map((study) => ({
			...study,
			pages: pagesDict[study.id] || [],
		}))
		return responseSuccess(studiesWithPages, "Fetch studies success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.error("Exception", err)
		return responseError(err, errorMessage, 500, corsHeaders)
	}
}
