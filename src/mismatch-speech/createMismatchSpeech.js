import { responseError, responseFailed, responseSuccess } from "../response"

export async function createMismatchSpeech(request, db, corsHeaders) {
	try {
		const { studiesCSV, systemType: studyType, videos } = await request.json()

		if (!studiesCSV || !studyType) {
			console.log("request", request)
			return responseFailed(null, "CSV data and system type is required", 400, corsHeaders)
		}

		const { results: studyConfigs } = await db.prepare("SELECT * FROM configs WHERE type = ?").bind(studyType).run()
		if (!results || results.length === 0) {
			console.log("results", results)
			return responseFailed(null, "No system found", 404, corsHeaders)
		}

		const studyConfig = studyConfigs[0]

		// const queryVideo = `SELECT * FROM videos`
		// const { results: videos } = await db.prepare(queryVideo).bind(systemType).run()

		const queryStudy = `INSERT INTO studies (type, pages, createdat, time_start, status)
			WHERE inputcode = ?)`
		const studies = await Promise.all(
			studiesCSV.map(async (studyData) => {
				const pairwises = await Promise.all(
					studyData.map(async (row, index) => {
						const inputcode = row[0]
						const sysA = String(row[1]).trim()
						const sysB = String(row[2]).trim()

						// Fetch videos in parallel
						const [videoA, videoB] = await Promise.all([
							db.collection("videos").findOne({ inputcode, systemname: sysA }),
							db.collection("videos").findOne({ inputcode, systemname: sysB }),
						])

						return {
							type: "video",
							name: `Page ${index + 1} of ${studyData.length}`,
							question: "Pairwise Comparison of Gesture Generation AI Model Studies",
							selected: {},
							actions: [],
							systems: [sysA, sysB],
							videos: [videoA, videoB],
						}
					})
				)

				const { insertedIds } = await db.collection("pages").insertMany(pairwises)
				const pageIds = Object.values(insertedIds)

				// Fetch the inserted pages
				const pages = await db
					.collection("pages")
					.find({ _id: { $in: pageIds } })
					.toArray()

				console.log("Final Pages:", pages)

				return {
					...studyConfig,
					pages,
					type: studyType,
					time_start: null,
					status: "new",
				}
			})
		)
		// const pages =

		// const studies = { ...studyConfig }

		return responseSuccess({ studies }, "Your studies are generated successfully.", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
