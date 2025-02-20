import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchParticipants(request, db, corsHeaders) {
	try {
		const { results } = await db
			.prepare(
				`SELECT *
				FROM studies
				WHERE prolific_userid IS NOT NULL AND prolific_userid <> ''
				GROUP BY prolific_userid;`
			)
			.all()

		if (!results || results.length === 0) {
			return responseFailed(null, "No participants found", 404, corsHeaders)
		}

		return responseSuccess(results, "Fetch participants success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
