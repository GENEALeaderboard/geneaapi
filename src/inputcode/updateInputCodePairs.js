import { responseError, responseFailed, responseSuccess } from "../response"
import { INPUT_CODE_PAIR_POOLS, pairsStorageType, parsePairsText } from "./inputCodePairsConfig"

// Validates and stores a list of matched-mismatched input-code pairs for a
// mismatching-seamless study (dyadic or speech). The pairs arrive as the raw
// text of an uploaded file, one "(matched, mismatched)" per line. Every matched
// code must exist in the study's matched video pool and every mismatched code in
// its mismatched pool. On success the pairs are stored in the inputcode table
// under `${type}-pairs`, encoded as "matched:mismatched,matched:mismatched".
export async function updateInputCodePairs(request, db, corsHeaders) {
	try {
		const { pairs: pairsText, type } = await request.json()

		const pools = INPUT_CODE_PAIR_POOLS[type]
		if (!pools) {
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

		// Validate every code exists in its pool. Matched checks then mismatched
		// checks are run as two batches, index-aligned with `pairs`.
		const stmt = await db.prepare("SELECT 1 FROM videos WHERE inputcode = ? AND type = ? LIMIT 1")
		const matchedBatch = pairs.map((p) => stmt.bind(p.matched, pools.matched))
		const mismatchedBatch = pairs.map((p) => stmt.bind(p.mismatched, pools.mismatched))

		const matchedResults = await db.batch(matchedBatch)
		const mismatchedResults = await db.batch(mismatchedBatch)

		for (let i = 0; i < pairs.length; i++) {
			const { matched, mismatched, line } = pairs[i]
			if ((matchedResults[i].results || []).length <= 0) {
				return responseFailed(null, `Matched code '${matched}' (line ${line}) not found in ${pools.matched}`, 400, corsHeaders)
			}
			if ((mismatchedResults[i].results || []).length <= 0) {
				return responseFailed(null, `Mismatched code '${mismatched}' (line ${line}) not found in ${pools.mismatched}`, 400, corsHeaders)
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
