import { responseError, responseFailed, responseSuccess } from "../response"

export async function validatePairwiseHumanLikeness(request, db, corsHeaders) {
	try {
		const { csv } = await request.json()

		if (!csv) {
			console.log("request", request)
			return responseFailed(null, "CSV data is required", 400, corsHeaders)
		}

		const resultQueries = await Promise.all(
			Array.from(csv).map(async (row, index) => {
				const inputcode = row[0]
				const sysA = String(row[1]).replace(/\s+/g, "")
				const sysB = String(row[2]).replace(/\s+/g, "")

				// const queryA = { inputcode, systemname: sysA }
				// const queryB = { inputcode, systemname: sysB }

				const rsA = await db.prepare("SELECT * FROM videos v WHERE v.inputcode = ? AND systemname = ?").bind(inputcode, sysA).run()
				const rsB = await db.prepare("SELECT * FROM videos v WHERE v.inputcode = ? AND systemname = ?").bind(inputcode, sysB).run()
				console.log("rsB", rsB, "rsA", rsA)

				// const [rsA, rsB] = await Promise.all([db.collection("videos").findOne(queryA), db.collection("videos").findOne(queryB)])

				// console.log("rsA", rsA, "rsB", rsB)

				return {
					inputcode: inputcode,
					name1: sysA,
					name2: sysB,
					result1: rsA,
					result2: rsB,
					index: String(index + 1),
				}
			})
		)

		for (const { inputcode, name1, name2, result1, result2, index } of resultQueries) {
			if (!result1 || !result2) {
				let missingNames = []
				if (!result1) missingNames.push(name1)
				if (!result2) missingNames.push(name2)

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
