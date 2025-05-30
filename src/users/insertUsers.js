import { responseError, responseFailed, responseSuccess } from "../response"

export async function insertUsers(request, db, corsHeaders) {
	try {
		// const { newSystem } = await request.json()
		// if (!newSystem) {
		// 	return responseFailed(null, "New Systems not found", 400, corsHeaders)
		// }

		// const requiredFields = ["name", "description", "type", "submissionid"]
		// const missingFields = requiredFields.filter((field) => !newSystem[field])
		// if (missingFields.length > 0) {
		// 	return responseFailed(null, `Missing fields: ${missingFields.join(", ")}`, 400, corsHeaders)
		// }

		// const { name, description, type, submissionid } = newSystem

		// // const response = await db
		// // 	.prepare("INSERT INTO users (name, username, email, avatar, exp, githubid) VALUES (?, ?, ?, ?, ?, ?)")
		// // 	.bind(userData.name, userData.login, userData.email, userData.avatar_url, expiredDate, githubid)
		// // 	.run()
		// if (!response.success) {
		// 	return responseFailed(null, "Failed to update inputcode", 400, corsHeaders)
		// }

		return responseSuccess({}, "New systems updated successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
