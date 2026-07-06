import { responseError, responseFailed, responseSuccess } from "../response"
import { loadPairMap, normalizeCode } from "../inputcode/inputCodePairsConfig"

export async function validateSeamlessDyadicMismatch(request, db, corsHeaders) {
	try {
		const { csv } = await request.json()
		if (!csv) {
			return responseFailed(null, "CSV data is required", 400, corsHeaders)
		}

		// Matched and mismatched stimuli no longer share a filename: the mismatched
		// code is looked up from the uploaded 1:1 pairs list. Load it once and map
		// each CSV matched code to its mismatched partner before checking the pools.
		const pairMap = await loadPairMap(db, "seamless-dyadic-mismatch")
		if (pairMap.size === 0) {
			return responseFailed(null, "No matched/mismatched input-code pairs found. Upload the pairs list first.", 400, corsHeaders)
		}

		const query1 = `SELECT * FROM videos
			WHERE systemname = ? AND inputcode = ? AND type = 'seamless-dyadic-mismatch/matched'`
		const query2 = `SELECT * FROM videos
			WHERE systemname = ? AND inputcode = ? AND type = 'seamless-dyadic-mismatch/mismatched'`
		const stmt1 = await db.prepare(query1)
		const stmt2 = await db.prepare(query2)
		const batch1 = []
		const batch2 = []
		const data = []
		for (let index = 0; index < csv.length; index++) {
			const row = csv[index]
			// CSV columns: [clip, system]. The clip is the matched code; its
			// mismatched partner comes from the pairs map.
			const inputcode = normalizeCode(row[0])
			const systemname = String(row[1]).replace(/\s+/g, "")
			const mismatchedcode = pairMap.get(inputcode)
			if (!mismatchedcode) {
				return responseFailed(null, `Matched code '${inputcode}' in line ${index + 1} has no mismatched pair`, 400, corsHeaders)
			}

			batch1.push(stmt1.bind(systemname, inputcode))
			batch2.push(stmt2.bind(systemname, mismatchedcode))
			data.push({ inputcode, mismatchedcode, systemname })
		}

		const batchResults1 = await db.batch(batch1)
		if (csv.length !== batchResults1.length || csv.length !== data.length) {
			return responseFailed(null, "Failed validate result", 400, corsHeaders)
		}
		const batchResults2 = await db.batch(batch2)
		if (csv.length !== batchResults2.length || csv.length !== data.length) {
			return responseFailed(null, "Failed validate result", 400, corsHeaders)
		}
		const resultItems1 = batchResults1.map((item) => item.results)
		const resultItems2 = batchResults2.map((item) => item.results)

		for (let index = 0; index < data.length; index++) {
			const { inputcode, mismatchedcode, systemname } = data[index]
			if (resultItems1[index].length <= 0) {
				return responseFailed(null, `System ${systemname} in line ${index + 1} not found matched video for: ${inputcode}`, 400, corsHeaders)
			}
			if (resultItems2[index].length <= 0) {
				return responseFailed(null, `System ${systemname} in line ${index + 1} not found mismatched video for: ${mismatchedcode}`, 400, corsHeaders)
			}
		}

		return responseSuccess({}, "Validate success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
