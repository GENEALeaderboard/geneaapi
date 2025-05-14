import { responseError, responseFailed, responseSuccess } from "../response"

export async function insertAttentionCheck(request, db, corsHeaders) {
	try {
		const { videos } = await request.json()
		if (!videos) {
			console.log("videos", videos)
			return responseFailed(null, "Video meta data not found", 400, corsHeaders)
		}

		const stmt = await db.prepare(`INSERT INTO videos (inputcode, systemname, path, url, systemid, type) VALUES (?, ?, ?, ?, ?, ?)`)
		const batch = Array.from(videos).map((video) => {
			const { inputcode, path, url } = video
			return stmt.bind(inputcode, "AttentionCheck", path, url, 0, "check")
		})
		const videoResults = await db.batch(batch)
		const insertedIds = videoResults.map((result) => result.meta.last_row_id)

		if (insertedIds.length !== videos.length) {
			console.log("videoResults", JSON.stringify(videoResults))
			return responseFailed(null, `Failed to insert video`, 400, corsHeaders)
		}

		const pairAttentionCheck = {}
		for (let i = 0; i < videos.length; i++) {
			const { path, url, expectedVote, idx } = videos[i]
			const videoid = insertedIds[i]
			if (!pairAttentionCheck[idx]) {
				pairAttentionCheck[idx] = []
			}
			pairAttentionCheck[idx].push({ path, url, expectedVote, videoid })
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
			const { path: path1, url: url1, expectedVote: expectedVote1, videoid: videoid1 } = attentionCheck[0]
			const { path: path2, url: url2, expectedVote: expectedVote2, videoid: videoid2 } = attentionCheck[1]

			let expectedVote = expectedVote1
			let metadataPath = path1;

			if (expectedVote1 === "Reference") {
				expectedVote = expectedVote2
				metadataPath = path2
			} else if (expectedVote2 !== "Reference") {
				console.log("attentionCheck", JSON.stringify(attentionCheck))
				console.log("expectedVote2", expectedVote2)
				return responseFailed(null, `Expected vote not found for idx: ${idx}`, 400, corsHeaders)
			}

			// console.log("metadataPath", metadataPath)
			// const filename = metadataPath.replace(/\.[^.]+$/, "")
			// console.log("filename", filename)
			// const type = filename.split("_")[2]
			// console.log("type", type)
			// const volume = filename.split("_")[3]
			// console.log("volume", volume)

			console.log("metadataPath", metadataPath)
			const nameParts = metadataPath.split("/").pop().split(".")[0].split("_");
			console.log("filename", filename)
			const type = nameParts[2] || null;
			console.log("type", type)
			const volume = nameParts[3] || null;
			console.log("volume", volume)

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
