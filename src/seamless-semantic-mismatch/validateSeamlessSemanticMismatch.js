import { responseError, responseFailed, responseSuccess } from "../response"

export async function validateSeamlessSemanticMismatch(request, db, corsHeaders) {
	try {
		const { csv } = await request.json()
		if (!csv) {
			return responseFailed(null, "CSV data is required", 400, corsHeaders)
		}

		const query1 = `SELECT * FROM videos
			WHERE systemname = ? AND inputcode = ? AND type = 'seamless-semantic-origin'`
		const query2 = `SELECT * FROM videos
			WHERE systemname = ? AND inputcode = ? AND type = 'seamless-semantic-mismatch'`
		const stmt1 = await db.prepare(query1)
		const stmt2 = await db.prepare(query2)
		const batch1 = []
		const batch2 = []
		const data = []
		for (let index = 0; index < csv.length; index++) {
			const row = csv[index]
			const inputcode1 = String(row[0]).replace(/\s+/g, "")
			const systemname = String(row[1]).replace(/\s+/g, "")
			const inputcode2 = String(row[2]).replace(/\s+/g, "")

			batch1.push(stmt1.bind(systemname, inputcode1))
			batch2.push(stmt2.bind(systemname, inputcode2))
			data.push({ inputcode1, systemname, inputcode2 })
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
			const { inputcode1, systemname, inputcode2 } = data[index]
			if (resultItems1[index].length <= 0) {
				return responseFailed(null, `System ${systemname} in line ${index + 1} not found video for: ${inputcode1}`, 400, corsHeaders)
			}
			if (resultItems2[index].length <= 0) {
				return responseFailed(null, `System ${systemname} in line ${index + 1} not found video for: ${inputcode2}`, 400, corsHeaders)
			}
		}

		return responseSuccess({}, "Validate success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
