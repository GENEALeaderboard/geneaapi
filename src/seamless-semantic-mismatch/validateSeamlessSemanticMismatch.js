import { responseError, responseFailed, responseSuccess } from "../response"
import { loadPairMap, normalizeCode } from "../inputcode/inputCodePairsConfig"

// Validates a Seamless Semantic Mismatch study CSV.
// Columns: [model, clip_name (inputcode)].
// There is a single video pool (seamless-semantic-origin); each row must have a
// matching video and a matched/mismatched pair. The two text descriptions (the
// clip's own and the paired clip's) live in R2 and are validated client-side at
// generation time (geneaapi has no R2 binding).
export async function validateSeamlessSemanticMismatch(request, db, corsHeaders) {
	try {
		const { csv } = await request.json()
		if (!csv) {
			return responseFailed(null, "CSV data is required", 400, corsHeaders)
		}

		// The distractor description comes from each clip's paired code, so every
		// clip in the CSV must have a mismatched pair.
		const pairMap = await loadPairMap(db, "seamless-semantic-mismatch")
		if (pairMap.size === 0) {
			return responseFailed(null, "No matched/mismatched pairs found. Upload the pairs list first.", 400, corsHeaders)
		}

		const query = `SELECT * FROM videos
			WHERE systemname = ? AND inputcode = ? AND type = 'seamless-semantic-origin'`
		const stmt = await db.prepare(query)
		const batch = []
		const data = []
		for (let index = 0; index < csv.length; index++) {
			const row = csv[index]
			const systemname = String(row[0]).replace(/\s+/g, "")
			const inputcode = normalizeCode(row[1])

			if (!pairMap.get(inputcode)) {
				return responseFailed(null, `Clip '${inputcode}' in line ${index + 1} has no mismatched pair`, 400, corsHeaders)
			}

			batch.push(stmt.bind(systemname, inputcode))
			data.push({ systemname, inputcode })
		}

		const batchResults = await db.batch(batch)
		if (csv.length !== batchResults.length || csv.length !== data.length) {
			return responseFailed(null, "Failed validate result", 400, corsHeaders)
		}
		const resultItems = batchResults.map((item) => item.results)

		for (let index = 0; index < data.length; index++) {
			const { systemname, inputcode } = data[index]
			if (resultItems[index].length <= 0) {
				return responseFailed(null, `System ${systemname} in line ${index + 1} not found video for: ${inputcode}`, 400, corsHeaders)
			}
		}

		return responseSuccess({}, "Validate success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
