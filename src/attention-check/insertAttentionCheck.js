import { responseError, responseFailed, responseSuccess } from "../response"

export async function insertAttentionCheck(request, db, corsHeaders) {
	try {
		const { checks } = await request.json()
		if (!checks) {
			return responseFailed(null, "Videos not found", 400, corsHeaders)
		}

		for (const check of checks) {
			const { inputcode, path, url } = check

			const response = await db
				.prepare("INSERT INTO videos (inputcode, systemname, path, url, systemid, type) VALUES (?, ?, ?, ?, ?, ?)")
				.bind(inputcode, "AttentionCheck", path, url, 0, "check")
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
