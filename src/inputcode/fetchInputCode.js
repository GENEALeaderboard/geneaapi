import { responseError, responseSuccess } from "../response"

export async function fetchInputCode(request, db, corsHeaders) {
	try {
		const url = new URL(request.url)
		const type = url.searchParams.get("type") || "origin"

		const response = await db.prepare("SELECT * FROM inputcode WHERE type = ?").bind(type).all()

		if (!response.results || response.results.length === 0) {
			return responseSuccess([], `No inputcode found for type '${type}'`, corsHeaders)
		}

		const raw = response.results[0].code || ""
		const codes = raw === "" ? [] : raw.split(",")

		return responseSuccess(codes, "Fetch codes success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
