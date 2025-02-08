import { responseError, responseFailed, responseSuccess } from "../response"

export async function insertVideos(request, env, corsHeaders) {
	try {
		const db = env.DB_HEMVIP
		if (!db) {
			return responseFailed(null, "No database found", 404, corsHeaders)
		}

		const { newSystem } = await request.json()
		if (!newSystem) {
			return responseFailed(null, "New videos not found", 400, corsHeaders)
		}

		const requiredFields = ["name", "description", "type", "submissionid"]
		const missingFields = requiredFields.filter((field) => !newSystem[field])
		if (missingFields.length > 0) {
			return responseFailed(null, `Missing fields: ${missingFields.join(", ")}`, 400, corsHeaders)
		}

		const { name, description, type, submissionid } = newSystem

		const response = await db
			.prepare("INSERT INTO videos (name, description, type, submissionid) VALUES (?, ?, ?, ?)")
			.bind(name, description, type, submissionid)
			.run()
		if (!response.success) {
			return responseFailed(null, "Failed to update inputcode", 400, corsHeaders)
		}

		return responseSuccess({}, "New videos updated successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
