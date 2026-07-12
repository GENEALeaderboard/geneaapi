import { responseError, responseFailed, responseSuccess } from "../response"

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

		// Pages for the selected studies, grouped by studyid. A studyid subquery keeps
		// this to a single bound variable (D1 caps bound parameters per statement),
		// and the index on pages(studyid) keeps it cheap.
		const pagesStmt = type
			? db.prepare("SELECT * FROM pages WHERE studyid IN (SELECT id FROM studies WHERE type = ?)").bind(type)
			: db.prepare("SELECT * FROM pages")
		const { results: allPages } = await pagesStmt.all()

		const pagesDict = {}
		for (const page of allPages) {
			;(pagesDict[page.studyid] ||= []).push(page)
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
