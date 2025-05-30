import { responseError, responseFailed, responseSuccess } from "../response"

export async function insertAttentionCheck(request, db, corsHeaders) {
	try {
		const { videos } = await request.json()
		if (!videos) {
			console.log("videos", videos)
			return responseFailed(null, "Video meta data not found", 400, corsHeaders)
		}

		console.log("videos", videos)

		const stmt = await db.prepare(`INSERT INTO videos (inputcode, systemname, path, url, systemid, type) VALUES (?, ?, ?, ?, ?, ?)`)
		console.log("stmt", stmt)

		const batch = Array.from(videos).map((video) => {
			const { inputcode, path, url } = video
			return stmt.bind(inputcode, "AttentionCheck", path, url, 0, "check")
		})
		const videoResults = await db.batch(batch)
		console.log("videoResults", videoResults)

		const insertedIds = videoResults.map((result) => result.meta.last_row_id)
		console.log("insertedIds", insertedIds)

		
		if (insertedIds.length !== videos.length) {
			console.log("videoResults", JSON.stringify(videoResults))
			return responseFailed(null, `Failed to insert video`, 400, corsHeaders)
		}

		const pairAttentionCheck = {}
		for (let i = 0; i < videos.length; i++) {
			const { path, url, expectedVote, idx, type, volume } = videos[i]
			const videoid = insertedIds[i]
			if (!pairAttentionCheck[idx]) {
				pairAttentionCheck[idx] = []
			}
			pairAttentionCheck[idx].push({ path, url, expectedVote, videoid, type, volume })
		}

		const stmtAttentionCheck = await db.prepare(
			`INSERT INTO attentioncheck (url1, path1, url2, path2, expected_vote, videoid1, videoid2, type, volume)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		console.log("pairAttentionCheck", pairAttentionCheck)
		const batchAttentionCheck = []
		for (let [idx, attentionCheck] of Object.entries(pairAttentionCheck)) {
			if (attentionCheck.length !== 2) {
				console.log("attentionCheck", attentionCheck)
				return responseFailed(null, `Attention check meta data not found for idx: ${idx}`, 400, corsHeaders)
			}
			const { path: path1, url: url1, expectedVote: expectedVote1, videoid: videoid1, type: type1, volume: volume1 } = attentionCheck[0]
			const { path: path2, url: url2, expectedVote: expectedVote2, videoid: videoid2, type: type2, volume: volume2 } = attentionCheck[1]

			let expectedVote = expectedVote1
			if (expectedVote1 === "Reference") {
				expectedVote = expectedVote2
			} else if (expectedVote2 !== "Reference") {
				console.log("attentionCheck", JSON.stringify(attentionCheck))
				console.log("expectedVote2", expectedVote2)
				return responseFailed(null, `Expected vote not found for idx: ${idx}`, 400, corsHeaders)
			}

			let type = type1 == null ? type2 : type1
			let volume = volume1 == null ? volume2 : volume1

			batchAttentionCheck.push(stmtAttentionCheck.bind(url1, path1, url2, path2, expectedVote, videoid1, videoid2, type, volume))
		}
		
		const attentionCheckResults = await db.batch(batchAttentionCheck)
		const successAll = Array.from(attentionCheckResults).every((result) => result.success)

		if (successAll) {
			return responseSuccess({}, "All attention check updated successfully", corsHeaders)
		} else {
			return responseFailed(null, "Failed to insert attention check", 400, corsHeaders)
		}
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
