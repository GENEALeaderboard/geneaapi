import { responseError, responseFailed, responseSuccess } from "../response"
import { SUPPORTED_PAIR_TYPES, normalizeCode, pairsStorageType, parsePairsText } from "./inputCodePairsConfig"

// Validates and stores a list of matched-mismatched input-code pairs for a
// mismatching-seamless study (dyadic or speech). The pairs arrive as the raw
// text of an uploaded file, one "(matched, mismatched)" per line. Every code —
// matched and mismatched — must be present in the study's input-code list (the
// "Segment filenames" list stored under `type` in the inputcode table). On
// success the pairs are stored under `${type}-pairs`, encoded as
// "matched:mismatched,matched:mismatched".
export async function updateInputCodePairs(request, db, corsHeaders) {
	try {
		const { pairs: pairsText, type } = await request.json()

		if (!SUPPORTED_PAIR_TYPES.includes(type)) {
			return responseFailed(null, `Unsupported study type for pairs: '${type}'`, 400, corsHeaders)
		}
		if (pairsText === undefined || pairsText === null) {
			return responseFailed(null, "Invalid input", 400, corsHeaders)
		}

		let pairs
		try {
			pairs = parsePairsText(pairsText)
		} catch (parseErr) {
			return responseFailed(null, parseErr.message, 400, corsHeaders)
		}
		if (pairs.length === 0) {
			return responseFailed(null, "No pairs provided", 400, corsHeaders)
		}

		// Load the study's input-code list and validate both sides of each pair
		// against it (not against uploaded video files).
		const listRow = await db.prepare("SELECT code FROM inputcode WHERE type = ?").bind(type).all()
		const rawList = listRow.results && listRow.results.length > 0 ? listRow.results[0].code || "" : ""
		const validCodes = new Set(
			rawList
				.split(",")
				.map((c) => normalizeCode(c))
				.filter(Boolean),
		)

		if (validCodes.size === 0) {
			return responseFailed(null, `No input codes found for '${type}'. Add the input codes first.`, 400, corsHeaders)
		}

		for (const { matched, mismatched, line } of pairs) {
			if (!validCodes.has(matched)) {
				return responseFailed(null, `Matched code '${matched}' (line ${line}) is not in the input code list`, 400, corsHeaders)
			}
			if (!validCodes.has(mismatched)) {
				return responseFailed(null, `Mismatched code '${mismatched}' (line ${line}) is not in the input code list`, 400, corsHeaders)
			}
		}

		const encoded = pairs.map((p) => `${p.matched}:${p.mismatched}`).join(",")
		const storageType = pairsStorageType(type)

		const existing = await db.prepare("SELECT id FROM inputcode WHERE type = ?").bind(storageType).all()
		let response
		if (existing.results && existing.results.length > 0) {
			response = await db.prepare("UPDATE inputcode SET code = ? WHERE type = ?").bind(encoded, storageType).run()
		} else {
			response = await db.prepare("INSERT INTO inputcode (code, type) VALUES (?, ?)").bind(encoded, storageType).run()
		}

		if (!response.success) {
			return responseFailed(null, "Failed to store input code pairs", 400, corsHeaders)
		}

		return responseSuccess({ count: pairs.length }, `Stored ${pairs.length} input code pairs`, corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
