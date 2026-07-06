import { responseError, responseSuccess } from "../response"
import { pairsStorageType } from "./inputCodePairsConfig"

// Returns the stored matched-mismatched input-code pairs for a study type as an
// array of { matched, mismatched }. Mirrors fetchInputCode but decodes the
// "matched:mismatched,..." encoding written by updateInputCodePairs.
export async function fetchInputCodePairs(request, db, corsHeaders) {
	try {
		const url = new URL(request.url)
		const type = url.searchParams.get("type")
		if (!type) {
			return responseSuccess([], "Missing type", corsHeaders)
		}

		const storageType = pairsStorageType(type)
		const response = await db.prepare("SELECT * FROM inputcode WHERE type = ?").bind(storageType).all()

		if (!response.results || response.results.length === 0) {
			return responseSuccess([], `No input code pairs found for type '${type}'`, corsHeaders)
		}

		const raw = response.results[0].code || ""
		const pairs = raw
			.split(",")
			.map((token) => token.trim())
			.filter(Boolean)
			.map((token) => {
				const [matched, mismatched] = token.split(":").map((c) => c.trim())
				return { matched, mismatched }
			})
			.filter((p) => p.matched && p.mismatched)

		return responseSuccess(pairs, "Fetch input code pairs success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
