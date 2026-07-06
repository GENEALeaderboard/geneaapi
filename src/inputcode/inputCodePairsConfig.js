// Study types that support matched-mismatched input-code pairs. Only dyadic and
// speech mismatch have pairs — semantic mismatch shows a single video at a time,
// so it has no mismatched input codes.
export const SUPPORTED_PAIR_TYPES = ["seamless-dyadic-mismatch", "seamless-speech-mismatch"]

// The inputcode-table `type` under which the pairs string is stored, derived
// from the study type. Kept separate from the plain input-code list rows.
export function pairsStorageType(type) {
	return `${type}-pairs`
}

// Normalizes an input code for comparison: trims whitespace and drops a trailing
// file extension (e.g. ".mp4"), so codes compare equal regardless of whether the
// extension was included in the pairs file or the input-code list.
export function normalizeCode(code) {
	return String(code).trim().replace(/\s+/g, "").replace(/\.[^.]+$/, "")
}

// Loads the stored matched-mismatched pairs for a study type and returns a
// Map<matchedCode, mismatchedCode> with both sides normalized. Reads the
// "matched:mismatched,..." encoding written by updateInputCodePairs. Returns an
// empty map when no pairs are stored.
export async function loadPairMap(db, type) {
	const storageType = pairsStorageType(type)
	const row = await db.prepare("SELECT code FROM inputcode WHERE type = ?").bind(storageType).all()
	const raw = row.results && row.results.length > 0 ? row.results[0].code || "" : ""
	const map = new Map()
	raw
		.split(",")
		.map((token) => token.trim())
		.filter(Boolean)
		.forEach((token) => {
			const [matched, mismatched] = token.split(":").map((c) => normalizeCode(c))
			if (matched && mismatched) map.set(matched, mismatched)
		})
	return map
}

// Parses the uploaded pairs text file. Each non-empty line is expected in the
// form "(matched, mismatched)" (parentheses optional). Returns an array of
// { matched, mismatched, line } (normalized) or throws with a readable message.
export function parsePairsText(text) {
	const pairs = []
	const lines = String(text).split(/\r?\n/)
	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i].trim()
		if (!raw) continue
		const inner = raw.replace(/^\(/, "").replace(/\)$/, "")
		const parts = inner.split(",").map((p) => normalizeCode(p))
		if (parts.length !== 2 || !parts[0] || !parts[1]) {
			throw new Error(`Malformed pair on line ${i + 1}: expected "(matched, mismatched)"`)
		}
		pairs.push({ matched: parts[0], mismatched: parts[1], line: i + 1 })
	}
	return pairs
}
