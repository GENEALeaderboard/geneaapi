import { responseError, responseSuccess } from "../response"

// Marks every study still in the "new" state as "failed" so the user-study
// worker (which only serves studies with status 'new' or 'uncomplete') stops
// handing them out. The studies and their pages/submissions are kept intact —
// this is a soft disable, not a delete.
export async function failNewStudies(request, db, corsHeaders) {
	try {
		const result = await db.prepare("UPDATE studies SET status = 'failed' WHERE status = 'new'").run()
		const count = result?.meta?.changes ?? 0
		return responseSuccess({ count }, `Disabled ${count} new stud${count === 1 ? "y" : "ies"}`, corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.error("Exception:", err)
		return responseError(err, errorMessage, 500, corsHeaders)
	}
}
