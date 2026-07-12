import { responseError, responseFailed, responseSuccess } from "../response"

// SQLite/D1 caps a statement at 999 bound variables; chunk IN(...) lists below it.
const IN_CHUNK = 900

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

		// Fetch pages only for the studies we're returning.
		// pagesDict: { [studyId]: [page1, page2, ...] }
		const pageDictByStudies = await fetchPagesForStudies(db, studies)

		// Fetch only the videos those pages reference.
		// videoDict: { [videoId]: video }
		const videoDict = await fetchVideosForPages(db, pageDictByStudies)

		// Combine studies with their pages and videos
		const studiesWithPages = combineStudiesWithPagesAndVideos(studies, pageDictByStudies, videoDict)

		return responseSuccess(studiesWithPages, "Fetch studies success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.error("Exception:", err)
		return responseError(err, errorMessage, 500, corsHeaders)
	}
}

// Fetch pages for the given studies in one (chunked) query and group by studyid,
// instead of one full-table scan per study. Relies on the index on pages(studyid).
async function fetchPagesForStudies(db, studies) {
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

	return pagesDict
}

// Fetch only the videos referenced by the pages (video1/video2), keyed by id.
async function fetchVideosForPages(db, pagesDict) {
	const idSet = new Set()
	for (const pages of Object.values(pagesDict)) {
		for (const page of pages) {
			if (page.video1 != null) idSet.add(page.video1)
			if (page.video2 != null) idSet.add(page.video2)
		}
	}

	const ids = Array.from(idSet)
	const videoDict = {}

	for (let i = 0; i < ids.length; i += IN_CHUNK) {
		const slice = ids.slice(i, i + IN_CHUNK)
		const placeholders = slice.map(() => "?").join(", ")
		const { results } = await db
			.prepare(`SELECT * FROM videos WHERE id IN (${placeholders})`)
			.bind(...slice)
			.all()
		for (const video of results) {
			videoDict[video.id] = video
		}
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
