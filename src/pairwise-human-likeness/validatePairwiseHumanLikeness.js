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
				console.log("row", row);

				const inputcode = row[0];
				const sysA = String(row[1]).replace(/\s+/g, "");
				const sysB = String(row[2]).replace(/\s+/g, "");

				console.log({ inputcode, systemname1: sysA, systemname2: sysB });

				// Optimized SQL query to fetch both results in one go
				const query = `
					SELECT * FROM videos
					WHERE inputcode = ? AND (systemname = ? OR systemname = ?)
				`;

				const { results } = await db.prepare(query).bind(inputcode, sysA, sysB).run();

				// Ensure both results exist
				const rsA = results.find(row => row.systemname === sysA);
				const rsB = results.find(row => row.systemname === sysB);

				if (!rsA || !rsB) {
					const missingNames = [];
					if (!rsA) missingNames.push(sysA);
					if (!rsB) missingNames.push(sysB);

					throw responseFailed(null, `Video ${inputcode} in line ${index + 1} not found for: ${missingNames.join(", ")}`, 400, corsHeaders);
				}

				console.log("rsB", rsB, "rsA", rsA);

				return {
					inputcode: inputcode,
					name1: sysA,
					name2: sysB,
					result1: [rsA], // Wrapping single object in an array to match original structure
					result2: [rsB],
					index: String(index + 1),
				};
			})
		);

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
