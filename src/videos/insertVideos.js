import { responseError, responseFailed, responseSuccess } from "../response"

export async function insertVideos(request, db, corsHeaders) {
	try {
		const { videos } = await request.json()
		if (!videos) {
			return responseFailed(null, "New videos not found", 400, corsHeaders)
		}

		for (const video of videos) {
			const { inputcode, systemname, path, url, systemid } = video

			const response = await db
				.prepare("INSERT INTO videos (inputcode, systemname, path, url, systemid, type) VALUES (?, ?, ?, ?, ?, ?)")
				.bind(inputcode, systemname, path, url, systemid, "video")
				.run()

			if (!response.success) {
				return responseFailed(null, `Failed to insert video with inputcode: ${inputcode}`, 400, corsHeaders)
			}
		}

		return responseSuccess({}, "All videos updated successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
