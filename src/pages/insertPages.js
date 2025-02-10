import { responseError, responseFailed, responseSuccess } from "../response"

export async function insertPages(request, db, corsHeaders) {
	try {
		const { pages } = await request.json()
		if (!pages) {
			return responseFailed(null, "New pages not found", 400, corsHeaders)
		}

		for (const page of pages) {
			const { type, name, question, selected, actions, options, system1, system2, video1, video2 } = page

			if (!type || !name || !question || !selected || !actions || !options || !system1 || !system2 || !video1 || !video2) {
				return responseFailed(null, "Missing required fields", 400, corsHeaders)
			}

			const response = await db
				.prepare("INSERT INTO pages (type, name, question, selected, actions, options, system1, system2, video1, video2) VALUES (?, ?, ?, ?, ?)")
				.bind(type, name, question, selected, actions, options, system1, system2, video1, video2)
				.run()

			if (!response.success) {
				return responseFailed(null, `Failed to insert video with inputcode: ${inputcode}`, 400, corsHeaders)
			}
		}

		return responseSuccess({}, "All pages updated successfully", corsHeaders)
	} catch (err) {
		const errorMessage = err.message || "An unknown error occurred"
		console.log("Exception", err)
		return responseError(err, errorMessage, 401, corsHeaders)
	}
}
