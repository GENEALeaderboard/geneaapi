import { responseError, responseFailed, responseSuccess } from "../response"

export async function validatePairwiseHumanLikeness(request, db, corsHeaders) {
	try {
		const { csv } = await request.json()
		if (!csv) {
			console.log("request", request)
			return responseFailed(null, "CSV data is required", 400, corsHeaders)
		}

		const query = `SELECT * FROM videos
			WHERE inputcode = ? AND (systemname = ? OR systemname = ?)`
		const stmt = await db.prepare(query)
		const batch = []
		const data = []
		for (let index = 0; index < csv.length; index++) {
			const row = csv[index]

			const inputcode = row[0]
			const sysA = String(row[1]).replace(/\s+/g, "")
			const sysB = String(row[2]).replace(/\s+/g, "")

			batch.push(stmt.bind(inputcode, sysA, sysB))
			data.push({ inputcode: inputcode, sysA: sysA, sysB: sysB })
		}

		const batchResults = await db.batch(batch)
		if (csv.length !== batchResults.length || csv.length !== data.length) {
			console.log("csv", csv)
			console.log("batchResults", batchResults)
			return responseFailed(null, "Failed validate result", 400, corsHeaders)
		}

		for (let index = 0; index < data.length; index++) {
			const { inputcode, sysA, sysB } = data[index]
			const { results } = batchResults[index]

			if (results.length <= 1) {
				const result = results[0]
				let missingNames = []
				if (result.systemname === sysA) {
					missingNames.push(sysB)
				} else {
					console.log("results", JSON.stringify(results))
				}
				if (result.systemname === sysB) {
					missingNames.push(sysA)
				} else {
					console.log("results", JSON.stringify(results))
				}
				return responseFailed(null, `Video ${inputcode} in line ${index} not found for: ${missingNames.join(", ")}`, 400, corsHeaders)
			}
		}

		return responseSuccess({}, "Validate success, continue with generate studies", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
