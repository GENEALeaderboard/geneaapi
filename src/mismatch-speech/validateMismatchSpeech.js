import { responseError, responseFailed, responseSuccess } from "../response"

export async function validateMismatchSpeech(request, db, corsHeaders) {
	try {
		// const type = "mismatch-speech"
		const { csv } = await request.json()
		if (!csv) {
			console.log("request", request)
			return responseFailed(null, "CSV data is required", 400, corsHeaders)
		}

		const query1 = `SELECT * FROM videos
			WHERE systemname = ? AND inputcode = ? AND type = 'origin'`
		const query2 = `SELECT * FROM videos
			WHERE systemname = ? AND inputcode = ? AND type = 'mismatch-speech'`
		const stmt1 = await db.prepare(query1)
		const stmt2 = await db.prepare(query1)
		const batch1 = []
		const batch2 = []
		const data = []
		for (let index = 0; index < csv.length; index++) {
			const row = csv[index]

			const inputcode1 = String(row[0]).replace(/\s+/g, "")
			const systemname = String(row[1]).replace(/\s+/g, "")
			const inputcode2 = String(row[2]).replace(/\s+/g, "")
			console.log("systemname, inputcode1, inputcode2", systemname, inputcode1, inputcode2)

			batch1.push(stmt1.bind(systemname, inputcode1))
			batch2.push(stmt2.bind(systemname, inputcode2))
			data.push({ inputcode1: inputcode1, systemname: systemname, inputcode2: inputcode2 })
		}

		const batchResults = await db.batch(batch1)
		if (csv.length !== batchResults.length || csv.length !== data.length) {
			console.log("csv", csv)
			console.log("batchResults", batchResults)
			return responseFailed(null, "Failed validate result", 400, corsHeaders)
		}

		for (let index = 0; index < data.length; index++) {
			const { inputcode1, systemname, inputcode2 } = data[index]
			const { results } = batchResults[index]
			console.log("batchResults", JSON.stringify(batchResults))

			if (results.length <= 1) {
				const result = results[0]
				let missingNames = []
				if (result.inputcode1 === inputcode1) {
					missingNames.push(inputcode1)
				} else {
					console.log("results", JSON.stringify(results))
				}
				if (result.inputcode2 === inputcode2) {
					missingNames.push(inputcode2)
				} else {
					console.log("results", JSON.stringify(results))
				}
				return responseFailed(null, `Video ${systemname} in line ${index + 1} not found for: ${missingNames.join(", ")}`, 400, corsHeaders)
			}
		}

		return responseSuccess({}, "Validate success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
