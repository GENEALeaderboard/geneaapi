import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchSystemList(request, db, corsHeaders) {
	try {
		const response = await db.prepare("SELECT y.id, y.name, y.description, y.type, y.submissionid, u.email, u.createdat, u.teamname FROM systems y LEFT JOIN submissions u ON y.submissionid = u.id AND y.submissionid IS NOT NULL;").all()

		if (!response.results) {
			return responseFailed(null, "No systems found", 404, corsHeaders)
		}

		return responseSuccess(response.results, "Fetch systems success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
