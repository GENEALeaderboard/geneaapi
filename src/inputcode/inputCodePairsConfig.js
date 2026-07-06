// Maps a mismatching-seamless study type to the video pools each side of a
// matched-mismatched input-code pair must be validated against.
//
// Only dyadic and speech mismatch have matched/mismatched pairs — their matched
// and mismatched clips live in separate pools. Semantic mismatch shows a single
// video at a time, so it has no mismatched input codes and is not included here.
export const INPUT_CODE_PAIR_POOLS = {
	"seamless-dyadic-mismatch": {
		matched: "seamless-dyadic-mismatch/matched",
		mismatched: "seamless-dyadic-mismatch/mismatched",
	},
	"seamless-speech-mismatch": {
		matched: "seamless-speech-mismatch/matched",
		mismatched: "seamless-speech-mismatch/mismatched",
	},
}

// The inputcode-table `type` under which the pairs string is stored, derived
// from the study type. Kept separate from the plain input-code rows.
export function pairsStorageType(type) {
	return `${type}-pairs`
}

// Parses the uploaded pairs text file. Each non-empty line is expected in the
// form "(matched, mismatched)" (parentheses optional). Returns an array of
// { matched, mismatched, line } or throws with a human-readable message.
export function parsePairsText(text) {
	const pairs = []
	const lines = String(text).split(/\r?\n/)
	for (let i = 0; i < lines.length; i++) {
		const raw = lines[i].trim()
		if (!raw) continue
		const inner = raw.replace(/^\(/, "").replace(/\)$/, "")
		const parts = inner.split(",").map((p) => p.trim().replace(/\s+/g, ""))
		if (parts.length !== 2 || !parts[0] || !parts[1]) {
			throw new Error(`Malformed pair on line ${i + 1}: expected "(matched, mismatched)"`)
		}
		pairs.push({ matched: parts[0], mismatched: parts[1], line: i + 1 })
	}
	return pairs
}
