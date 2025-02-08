import { responseError, responseFailed, responseSuccess } from "../response"

export async function insertSubmission(request, db, corsHeaders) {
	try {
		const { submission } = await request.json()
		if (!submission) {
			return responseFailed(null, "New submission not found", 400, corsHeaders)
		}

		const { email, teamname, teamid, status: submitStatus } = submission

		const response = await db
			.prepare("INSERT INTO submissions (email, teamname, teamid, status) VALUES (?, ?, ?, ?)")
			.bind(email, teamname, teamid, submitStatus)
			.run()

		if (!response.success) {
			return responseFailed(null, `Failed to insert submission with teamname: ${teamname}`, 400, corsHeaders)
		}
		return responseSuccess({ msg: "Your submission is successful" }, "Your submission is successful", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
