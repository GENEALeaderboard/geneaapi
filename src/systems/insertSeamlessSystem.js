import { responseError, responseFailed, responseSuccess } from "../response"

// The four seamless-interaction evaluation pools a system can be registered into.
const SEAMLESS_CATEGORIES = ["seamless-origin-humanlikeness", "seamless-speech-mismatch", "seamless-dyadic-mismatch", "seamless-semantic-mismatch"]

// Registers a single system across one or more seamless evaluation pools in one
// call. Seamless systems are not tied to a submission (team), so submissionid is
// always 0. Insertion is idempotent: a (name, category) pair that already exists
// is skipped rather than duplicated.
export async function insertSeamlessSystem(request, db, corsHeaders) {
	try {
		const { newSystem, categories } = await request.json()

		if (!newSystem) {
			return responseFailed(null, "New system not found", 400, corsHeaders)
		}

		const requiredFields = ["name", "description", "type"]
		const missingFields = requiredFields.filter((field) => !newSystem[field])
		if (missingFields.length > 0) {
			return responseFailed(null, `Missing fields: ${missingFields.join(", ")}`, 400, corsHeaders)
		}

		if (!Array.isArray(categories) || categories.length === 0) {
			return responseFailed(null, "No evaluations selected", 400, corsHeaders)
		}

		const invalid = categories.filter((c) => !SEAMLESS_CATEGORIES.includes(c))
		if (invalid.length > 0) {
			return responseFailed(null, `Invalid evaluations: ${invalid.join(", ")}`, 400, corsHeaders)
		}

		const { name, description, type } = newSystem

		// Skip categories where this system name already exists.
		const existing = await db
			.prepare(`SELECT category FROM systems WHERE name = ? AND category IN (${categories.map(() => "?").join(", ")})`)
			.bind(name, ...categories)
			.all()
		const alreadyIn = new Set((existing.results || []).map((r) => r.category))
		const toCreate = categories.filter((c) => !alreadyIn.has(c))

		if (toCreate.length === 0) {
			return responseSuccess({ created: [], skipped: categories }, "System already exists in all selected evaluations", corsHeaders)
		}

		const statements = toCreate.map((category) =>
			db.prepare("INSERT INTO systems (name, description, type, submissionid, category) VALUES (?, ?, ?, ?, ?)").bind(name, description, type, 0, category)
		)
		const results = await db.batch(statements)

		const failed = results.filter((r) => !r.success)
		if (failed.length > 0) {
			return responseFailed(null, "Failed to create system in one or more evaluations", 400, corsHeaders)
		}

		return responseSuccess({ created: toCreate, skipped: [...alreadyIn] }, `System "${name}" registered in ${toCreate.length} evaluation(s)`, corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
