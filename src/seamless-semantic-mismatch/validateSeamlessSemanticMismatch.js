import { responseError, responseFailed, responseSuccess } from "../response"

// Validates a Seamless Semantic Mismatch study CSV.
// Columns: [model, clip_name (inputcode), mismatched_text].
// There is a single video pool (seamless-semantic-origin); each row must have a
// matching video. The correct text lives in the video's .txt and is validated
// client-side at generation time (geneaapi has no R2 binding).
export async function validateSeamlessSemanticMismatch(request, db, corsHeaders) {
	try {
		const { csv } = await request.json()
		if (!csv) {
			return responseFailed(null, "CSV data is required", 400, corsHeaders)
		}

		const query = `SELECT * FROM videos
			WHERE systemname = ? AND inputcode = ? AND type = 'seamless-semantic-origin'`
		const stmt = await db.prepare(query)
		const batch = []
		const data = []
		for (let index = 0; index < csv.length; index++) {
			const row = csv[index]
			const systemname = String(row[0]).replace(/\s+/g, "")
			const inputcode = String(row[1]).replace(/\s+/g, "")
			const mismatchedText = String(row[2] ?? "").trim()

			if (!mismatchedText) {
				return responseFailed(null, `Missing mismatched text in line ${index + 1}`, 400, corsHeaders)
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
