import { responseError, responseFailed, responseSuccess } from "../response"

export async function updateInputCode(request, db, corsHeaders) {
	try {
		const { codes, type = "origin" } = await request.json()
		if (codes === undefined || codes === null) {
			return responseFailed(null, "Invalid input", 400, corsHeaders)
		}

		const existing = await db.prepare("SELECT id FROM inputcode WHERE type = ?").bind(type).all()
		let response
		if (existing.results && existing.results.length > 0) {
			response = await db.prepare("UPDATE inputcode SET code = ? WHERE type = ?").bind(codes, type).run()
		} else {
			response = await db.prepare("INSERT INTO inputcode (code, type) VALUES (?, ?)").bind(codes, type).run()
		}

		if (!response.success) {
			return responseFailed(null, "Failed to update inputcode", 400, corsHeaders)
		}

		return responseSuccess({}, "Input Codes updated successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
