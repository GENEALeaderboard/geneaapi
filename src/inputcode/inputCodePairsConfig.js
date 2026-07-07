// Study types that support matched-mismatched input-code pairs.
// - dyadic/speech: the mismatched clip is a separate video file named with the
//   "_M" suffix; pairs are disambiguated by that suffix (order-independent).
// - semantic: a pair links two ordinary clip codes — the second clip's text
//   description is shown as the distractor next to the first clip's video; pairs
//   are positional (matched first, mismatched/distractor second).
export const SUPPORTED_PAIR_TYPES = ["seamless-dyadic-mismatch", "seamless-speech-mismatch", "seamless-semantic-mismatch"]

// Whether pairs for a study type are disambiguated by the "_M" suffix (dyadic /
// speech) or by position (semantic — both codes are ordinary clip codes).
export function pairsUseSuffix(type) {
	return type !== "seamless-semantic-mismatch"
}

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

// The mismatched code in a pair is identified by this suffix, not by its
// position on the line. Exactly one code of each pair must end with it.
export const MISMATCH_SUFFIX = "_M"

// True if a (normalized) input code is a mismatched code, i.e. ends with the
// mismatch suffix.
export function isMismatchedCode(code) {
	return String(code).endsWith(MISMATCH_SUFFIX)
}

// Parses the uploaded pairs text file. Each non-empty line holds two codes
// (comma-separated, parentheses optional). Returns an array of
// { matched, mismatched, line } (normalized) or throws with a readable message.
//
// When `useSuffix` is true (dyadic/speech), order does not matter: the code that
// ends with the mismatch suffix ("_M") is the mismatched one, and exactly one of
// the two must end with it. When false (semantic), pairs are positional — the
// first code is matched, the second is the mismatched/distractor clip.
export function parsePairsText(text, useSuffix = true) {
	const pairs = []
	const lines = String(text).split(/\r?\n/)
	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i].trim()
		if (!raw) continue
		const inner = raw.replace(/^\(/, "").replace(/\)$/, "")
		const parts = inner.split(",").map((p) => normalizeCode(p))
		if (parts.length !== 2 || !parts[0] || !parts[1]) {
			const example = useSuffix ? `(clip, clip${MISMATCH_SUFFIX})` : "(matched_clip, mismatched_clip)"
			throw new Error(`Malformed pair on line ${i + 1}: expected two codes, e.g. "${example}"`)
		}

		const [a, b] = parts
		let matched, mismatched
		if (useSuffix) {
			const aMis = isMismatchedCode(a)
			const bMis = isMismatchedCode(b)
			if (aMis === bMis) {
				throw new Error(
					`Malformed pair on line ${i + 1}: exactly one code must end with "${MISMATCH_SUFFIX}" (the mismatched one), got '${a}' and '${b}'`,
				)
			}
			matched = aMis ? b : a
			mismatched = aMis ? a : b
		} else {
			// Positional: first is matched, second is the mismatched/distractor clip.
			matched = a
			mismatched = b
		}
		pairs.push({ matched, mismatched, line: i + 1 })
	}
	return pairs
}
