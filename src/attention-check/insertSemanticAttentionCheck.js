import { responseError, responseFailed, responseSuccess } from "../response"

// Maps the vote the admin picks on the upload page to the option value the study
// app records when a rater clicks the matching button (see hemvip config
// DEFAULT_OPTION and SemanticBoard). The attention check passes when the rater's
// recorded option equals this stored `expected_vote`.
const VOTE_TO_EXPECTED = {
	left: "LeftClearlyBetter",
	right: "RightClearlyBetter",
	both: "BothExpressed",
	neither: "NeitherExpressed",
}

// Inserts one Seamless Semantic Mismatch attention check: a single video shown
// with two fixed descriptions (left and right) plus the expected vote — left,
// right, both, or neither. The left/right texts are stored in the row's
// correct_text/distractor_text columns and the expected vote in expected_vote;
// the video is reused on both slots so the existing two-video plumbing keeps
// working.
export async function insertSemanticAttentionCheck(request, db, corsHeaders) {
	try {
		const body = await request.json()
		const { video, leftText, rightText, expectedVote } = body
		const category = body.category || "seamless-semantic-mismatch"

		if (!video || !video.path || !video.url) {
			return responseFailed(null, "Video metadata not found", 400, corsHeaders)
		}
		if (!leftText || !leftText.trim()) {
			return responseFailed(null, "Left description is required", 400, corsHeaders)
		}
		if (!rightText || !rightText.trim()) {
			return responseFailed(null, "Right description is required", 400, corsHeaders)
		}
		const expected = VOTE_TO_EXPECTED[expectedVote]
		if (!expected) {
			return responseFailed(null, "Expected vote must be one of: left, right, both, neither", 400, corsHeaders)
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

		// If the attentioncheck insert throws (e.g. the correct_text/distractor_text
		// columns are missing), roll back the orphan video row and surface the error
		// instead of leaving a half-written check.
		try {
			const checkInsert = await db
				.prepare(
					`INSERT INTO attentioncheck (url1, path1, url2, path2, expected_vote, videoid1, videoid2, type, volume, category, correct_text, distractor_text)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(url, path, url, path, expected, videoid, videoid, "Text", "Unmuted", category, leftText.trim(), rightText.trim())
				.run()

			if (!checkInsert.success) {
				await db.prepare(`DELETE FROM videos WHERE id = ?`).bind(videoid).run()
				return responseFailed(null, "Failed to insert attention check", 400, corsHeaders)
			}
		} catch (checkErr) {
			await db.prepare(`DELETE FROM videos WHERE id = ?`).bind(videoid).run()
			const msg = checkErr.message || "Failed to insert attention check"
			console.log("[insertSemanticAttentionCheck] attentioncheck insert failed", checkErr)
			return responseFailed(null, `Failed to insert attention check: ${msg}`, 400, corsHeaders)
		}

		return responseSuccess({}, "Semantic attention check created successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
