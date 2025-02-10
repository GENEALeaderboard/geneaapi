import { responseError, responseFailed, responseSuccess } from "../response"

export async function validatePairwiseHumanLikeness(request, db, corsHeaders) {
	try {
		const { csv } = await request.json()

		if (!csv) {
			console.log("request", request)
			return responseFailed(null, "CSV data is required", 400, corsHeaders)
		}

		const resultQueries = []
		for (let index = 0; index < csv.length; index++) {
			const row = csv[index]

			const inputcode = row[0]
			const sysA = String(row[1]).replace(/\s+/g, "")
			const sysB = String(row[2]).replace(/\s+/g, "")

			const query = `SELECT * FROM videos
			WHERE inputcode = ? AND (systemname = ? OR systemname = ?)`

			const { results } = await db.prepare(query).bind(inputcode, sysA, sysB).run()
			if (results.length <= 1) {
				console.log({ inputcode, sysA, sysB })
				console.log("results", results)
				return responseFailed(null, `Video ${inputcode} in line ${index + 1} not found for: ${sysB}`, 400, corsHeaders)
			}

			resultQueries.push({
				inputcode: inputcode,
				name1: sysA,
				name2: sysB,
				result1: results,
				result2: results,
				index: String(index + 1),
			})
		}

		for (const { inputcode, name1, name2, result1, result2, index } of resultQueries) {
			if (!result1 || !result2) {
				let missingNames = []
				if (!result1) missingNames.push(name1)
				if (!result2) missingNames.push(name2)

				console.log("result1", result1, "result2", result2)
				return responseFailed(null, `Video ${inputcode} in line ${index} not found for: ${missingNames.join(", ")}`, 400, corsHeaders)
			}
		}

		return responseSuccess({}, "Validate success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
