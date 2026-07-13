import { responseError, responseFailed, responseSuccess } from "../response"
import { normalizeCode } from "../inputcode/inputCodePairsConfig"

// The comparative realism votes an attention check can expect. "Reference" is
// excluded on purpose: this endpoint authors a concrete AC-video-vs-distractor
// pair, so the expected vote is always one of the five side judgments.
const REALISM_VOTES = ["LeftClearlyBetter", "LeftSlightlyBetter", "TheyAreEqual", "RightSlightlyBetter", "RightClearlyBetter"]

// Inserts one paired attention check: a single uploaded AC video (shown on the
// LEFT / video1) compared against an existing real video (the distractor, shown
// on the RIGHT / video2), plus the expected vote. The distractor is not
// uploaded — it is referenced by (systemname, inputcode) and resolved to an
// existing `videos` row so study pages keep pointing at the real clip.
export async function insertPairedAttentionCheck(request, db, corsHeaders) {
	try {
		const body = await request.json()
		const { video, expectedVote, distractor } = body
		const category = body.category || "seamless-origin-humanlikeness"
		// The video `type` the distractor is resolved within. For realism this is
		// just the category; for speech/dyadic the real videos live in per-variant
		// pools (`<category>/matched`, `<category>/mismatched`), so the caller must
		// say which. Defaults to the category (the realism case).
		const distractorType = body.distractorType || category
		// generateSeamlessHumanlikeness only picks up checks with type "Text" and
		// volume "Muted"; speech/dyadic want Audio|Text + Unmuted. Caller sets these.
		const type = body.type || "Text"
		const volume = body.volume || "Muted"

		if (!video || !video.path || !video.url) {
			return responseFailed(null, "Attention-check video metadata not found", 400, corsHeaders)
		}
		if (!REALISM_VOTES.includes(expectedVote)) {
			return responseFailed(null, `Expected vote must be one of: ${REALISM_VOTES.join(", ")}`, 400, corsHeaders)
		}
		if (!distractor || !distractor.systemname || !distractor.inputcode) {
			return responseFailed(null, "Distractor systemname and inputcode are required", 400, corsHeaders)
		}

		const sys = String(distractor.systemname).trim()
		const wantedCode = normalizeCode(distractor.inputcode)
		if (!sys || !wantedCode) {
			return responseFailed(null, "Distractor systemname and inputcode are required", 400, corsHeaders)
		}

		// Resolve the distractor to an existing videos row by (systemname,
		// normalized inputcode) WITHIN the given `distractorType` pool. Realism
		// compares two systems on the SAME inputcode, so a real clip is fully
		// identified by system + inputcode (no pairs list). We normalize the code
		// with the shared helper so a trailing ".mp4" or stray whitespace doesn't
		// cause a miss. The match is strictly type-scoped so studies never mix: a
		// video from a different pool must NOT resolve here.
		const { results: candidates } = await db
			.prepare("SELECT id, url, path, inputcode FROM videos WHERE systemname = ? AND type = ?")
			.bind(sys, distractorType)
			.all()
		const distractorRow = (candidates || []).find((v) => normalizeCode(v.inputcode) === wantedCode) || null
		if (!distractorRow) {
			return responseFailed(
				null,
				`No video found for distractor systemname='${sys}', inputcode='${wantedCode}' in the '${distractorType}' pool. Upload that system's videos first.`,
				400,
				corsHeaders
			)
		}

		// Register the uploaded AC video as its own `videos` row (systemname
		// "AttentionCheck", type "check"), matching the existing AC plumbing.
		const { inputcode, path, url } = video
		const videoInsert = await db
			.prepare(`INSERT INTO videos (inputcode, systemname, path, url, systemid, type) VALUES (?, ?, ?, ?, ?, ?)`)
			.bind(inputcode || "attention-check", "AttentionCheck", path, url, 0, "check")
			.run()
		if (!videoInsert.success) {
			return responseFailed(null, "Failed to insert attention check video", 400, corsHeaders)
		}
		const acVideoId = videoInsert.meta.last_row_id

		// video1 = uploaded AC clip (left), video2 = resolved distractor (right).
		// If the attentioncheck insert throws, roll back the orphan AC video row.
		try {
			const checkInsert = await db
				.prepare(
					`INSERT INTO attentioncheck (url1, path1, url2, path2, expected_vote, videoid1, videoid2, type, volume, category)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(url, path, distractorRow.url, distractorRow.path, expectedVote, acVideoId, distractorRow.id, type, volume, category)
				.run()

			if (!checkInsert.success) {
				await db.prepare(`DELETE FROM videos WHERE id = ?`).bind(acVideoId).run()
				return responseFailed(null, "Failed to insert attention check", 400, corsHeaders)
			}
		} catch (checkErr) {
			await db.prepare(`DELETE FROM videos WHERE id = ?`).bind(acVideoId).run()
			const msg = checkErr.message || "Failed to insert attention check"
			console.log("[insertPairedAttentionCheck] attentioncheck insert failed", checkErr)
			return responseFailed(null, `Failed to insert attention check: ${msg}`, 400, corsHeaders)
		}

		return responseSuccess({}, "Attention check created successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
