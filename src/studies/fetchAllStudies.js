import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchAllStudies(request, db, corsHeaders) {
	try {
		// Optional ?type= filter: fetch only studies of that type, plus their
		// pages/videos. Without it, return every study (the full export).
		const url = new URL(request.url)
		const type = url.searchParams.get("type")

		const studiesStmt = type
			? db.prepare("SELECT * FROM studies WHERE type = ?").bind(type)
			: db.prepare("SELECT * FROM studies")
		const { results: studies } = await studiesStmt.all()
		if (studies.length === 0) {
			return responseFailed(null, type ? `No studies found with type '${type}'` : "No studies found", 404, corsHeaders)
		}

		// Fetch pages for the selected studies and the videos those pages reference.
		const pageDictByStudies = await fetchPagesForStudies(db, type)
		const videoDict = await fetchVideosForPages(db, type)

		const studiesWithPages = combineStudiesWithPagesAndVideos(studies, pageDictByStudies, videoDict)

		return responseSuccess(studiesWithPages, "Fetch studies success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.error("Exception:", err)
		return responseError(err, errorMessage, 500, corsHeaders)
	}
}

// Pages for the selected studies (all, or those of a given type), grouped by
// studyid. A studyid subquery keeps this to a single bound variable regardless of
// how many studies match — D1 caps bound parameters per statement (~100).
async function fetchPagesForStudies(db, type) {
	const stmt = type
		? db.prepare("SELECT * FROM pages WHERE studyid IN (SELECT id FROM studies WHERE type = ?)").bind(type)
		: db.prepare("SELECT * FROM pages")
	const { results } = await stmt.all()

	const pagesDict = {}
	for (const page of results) {
		;(pagesDict[page.studyid] ||= []).push(page)
	}
	return pagesDict
}

// Only the videos referenced (video1/video2) by those pages, keyed by id. Again a
// subquery, so there is no large IN(...) list of ids to bind.
async function fetchVideosForPages(db, type) {
	const stmt = type
		? db
				.prepare(
					`SELECT * FROM videos WHERE id IN (
						SELECT video1 FROM pages WHERE studyid IN (SELECT id FROM studies WHERE type = ?)
						UNION
						SELECT video2 FROM pages WHERE studyid IN (SELECT id FROM studies WHERE type = ?)
					)`
				)
				.bind(type, type)
		: db.prepare("SELECT * FROM videos")
	const { results } = await stmt.all()

	const videoDict = {}
	for (const video of results) {
		videoDict[video.id] = video
	}
	return videoDict
}

// Combine studies with their pages, resolving each page's video ids to objects.
function combineStudiesWithPagesAndVideos(studies, pagesDict, videosDict) {
	return studies.map((study) => {
		const pages = pagesDict[study.id] || []
		const pagesWithVideos = pages.map((page) => ({
			...page,
			video1: videosDict[page.video1],
			video2: videosDict[page.video2],
		}))
		return { ...study, pages: pagesWithVideos }
	})
}
