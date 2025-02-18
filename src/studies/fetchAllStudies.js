import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchAllStudies(request, db, corsHeaders) {
	try {
		// Fetch all studies
		const { results: studies } = await db.prepare("SELECT * FROM studies").all()
		if (studies.length === 0) {
			return responseFailed(null, "No studies found", 404, corsHeaders)
		}

		// Fetch pages for all studies
		// pagesDict: [studyId: {pages:[page1, page2, ..., pageN]}]
		const pageDictByStudies = await fetchPagesForStudies(db, studies)
		if (!pageDictByStudies) {
			console.log("pagesDict", JSON.stringify(pageDictByStudies))
			return responseFailed(null, "Pages length does not match studies", 400, corsHeaders)
		}

		// Fetch videos for all pages
		// videosDict: [[videoid]: video]
		const videoDict = await fetchVideosForPages(db, pageDictByStudies)
		if (!videoDict) {
			console.log("videosDict", JSON.stringify(videoDict))
			return responseFailed(null, "Videos length does not match pages", 400, corsHeaders)
		}

		// Combine studies with their pages and videos
		const studiesWithPages = combineStudiesWithPagesAndVideos(studies, pageDictByStudies, videoDict)

		return responseSuccess(studiesWithPages, "Fetch studies success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.error("Exception:", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}

// Helper function to fetch pages for all studies
async function fetchPagesForStudies(db, studies) {
	const stmtPages = db.prepare(`SELECT * FROM pages WHERE studyid = ?`)
	const pagesBatch = studies.map((study) => stmtPages.bind(study.id))
	const pagesResults = await db.batch(pagesBatch)

	if (pagesResults.length !== studies.length) {
		console.error("Batch results for pages:", pagesResults)
		return null
	}

	const pagesDict = {}
	pagesResults.forEach((pageRes, index) => {
		const studyId = studies[index].id

		if (pageRes.results.length === 0) {
			console.log("Page with studyId:", studyId, "not found any pages")
		} else {
			pagesDict[studyId] = pageRes.results
		}
	})

	return pagesDict
}

// Helper function to fetch videos for all pages
async function fetchVideosForPages(db, pagesDict) {
	const { results: videoResults } = await db.prepare(`SELECT * FROM videos`).all()
	const videoDict = {}
	const allVideos = Array.from(videoResults).forEach((videoItem) => {
		if (videoDict[videoItem.id]) {
			throw new Error(`Duplicate video id: ${videoItem.id}`)
		} else {
			videoDict[videoItem.id] = []
		}
		videoDict[videoItem.id] = videoItem
	})

	return videoDict
}

// Helper function to combine studies with their pages and videos
function combineStudiesWithPagesAndVideos(studies, pagesDict, videosDict) {
	if (!studies || !pagesDict || !videosDict) {
		return null
	}
	return Array.from(studies).map((study) => {
		const pages = pagesDict[study.id]

		const pagesWithVideos = (pages || []).map((page) => ({
			...page,
			video1: videosDict[page.video1],
			video2: videosDict[page.video2],
		}))

		return {
			...study,
			pages: pagesWithVideos,
		}
	})
}
