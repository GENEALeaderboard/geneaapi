import { responseError, responseFailed, responseSuccess } from "../response"

// Inserts one text-based Seamless Semantic Mismatch attention check: a single
// video shown with an expected (correct) description and a distractor. The two
// texts are stored on the attentioncheck row; the video is reused on both slots
// so the existing two-video plumbing keeps working.
export async function insertSemanticAttentionCheck(request, db, corsHeaders) {
	try {
		const body = await request.json()
		const { video, correctText, distractorText } = body
		const category = body.category || "seamless-semantic-mismatch"

		if (!video || !video.path || !video.url) {
			return responseFailed(null, "Video metadata not found", 400, corsHeaders)
		}
		if (!correctText || !correctText.trim()) {
			return responseFailed(null, "Expected text is required", 400, corsHeaders)
		}
		if (!distractorText || !distractorText.trim()) {
			return responseFailed(null, "Distractor text is required", 400, corsHeaders)
		}

		const { inputcode, path, url } = video

		const videoInsert = await db
			.prepare(`INSERT INTO videos (inputcode, systemname, path, url, systemid, type) VALUES (?, ?, ?, ?, ?, ?)`)
			.bind(inputcode || "semantic-check", "AttentionCheck", path, url, 0, "check")
			.run()

		if (!videoInsert.success) {
			return responseFailed(null, "Failed to insert attention check video", 400, corsHeaders)
		}
		const videoid = videoInsert.meta.last_row_id

		const checkInsert = await db
			.prepare(
				`INSERT INTO attentioncheck (url1, path1, url2, path2, expected_vote, videoid1, videoid2, type, volume, category, correct_text, distractor_text)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(url, path, url, path, "TextChoice", videoid, videoid, "Text", "Unmuted", category, correctText.trim(), distractorText.trim())
			.run()

		if (!checkInsert.success) {
			return responseFailed(null, "Failed to insert attention check", 400, corsHeaders)
		}

		return responseSuccess({}, "Semantic attention check created successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
