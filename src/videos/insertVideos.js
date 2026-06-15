import { responseError, responseFailed, responseSuccess } from "../response"

export async function insertVideos(request, db, corsHeaders) {
	try {
		const { videos } = await request.json()
		if (!videos) {
			return responseFailed(null, "New videos not found", 400, corsHeaders)
		}

		for (const video of videos) {
			const { inputcode, systemname, path, url, systemid, type } = video

			// Upsert keyed on (inputcode, systemname, type): a re-upload must refresh the
			// existing row's path/url in place so study pages keep resolving the video,
			// instead of inserting a duplicate row that nothing references.
			const existing = await db
				.prepare("SELECT id FROM videos WHERE inputcode = ? AND systemname = ? AND type = ?")
				.bind(inputcode, systemname, type)
				.first()

			const response = existing
				? await db
						.prepare("UPDATE videos SET path = ?, url = ?, systemid = ? WHERE id = ?")
						.bind(path, url, systemid, existing.id)
						.run()
				: await db
						.prepare("INSERT INTO videos (inputcode, systemname, path, url, systemid, type) VALUES (?, ?, ?, ?, ?, ?)")
						.bind(inputcode, systemname, path, url, systemid, type)
						.run()

			if (!response.success) {
				return responseFailed(null, `Failed to upsert video with inputcode: ${inputcode}`, 400, corsHeaders)
			}
		}

		return responseSuccess({}, "All videos updated successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
