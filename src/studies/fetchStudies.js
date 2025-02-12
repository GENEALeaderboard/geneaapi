import { responseError, responseFailed, responseSuccess } from "../response"

export async function fetchStudies(request, db, corsHeaders) {
	try {
		const configs = await db.prepare("SELECT * FROM configs").first()
		if (!configs) {
			return responseFailed(null, "No study configs found", 404, corsHeaders)
		}
		const studyTypes = Array.from(configs).map((config) => {
			return {
				[config.type]: { ...config },
			}
		})

		const rsStudiesList = await db.prepare("SELECT * FROM studies s, configs c WHERE c.type = s.type").all()
		if (rsStudiesList.length === 0) {
			return responseFailed(null, "No studies found", 404, corsHeaders)
		}

		const studies = Array.from(rsStudiesList).forEach((study) => {
			return {
				...study,
			}
		})

		return responseSuccess({ studies: studies }, "Fetch studies success", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
