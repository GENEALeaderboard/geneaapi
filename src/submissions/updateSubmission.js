import { responseError, responseFailed, responseSuccess } from "../response"

export async function updateSubmission(request, db, corsHeaders) {
	try {
		const { submitStatus, submitid } = await request.json()
		if (!submitStatus || !submitid) {
			return responseFailed(null, "SubmitStatus, SubmitID not found", 400, corsHeaders)
		}

		const response = await db.prepare("UPDATE submissions SET status = ? WHERE id = ?").bind(submitStatus, submitid).run()
		if (!response.success) {
			return responseFailed(null, "Failed to update submissions", 400, corsHeaders)
		}

		return responseSuccess({}, "Input Codes updated successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
