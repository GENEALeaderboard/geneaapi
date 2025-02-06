import { responseError, responseSuccess } from "./response"
import { fetchStudies } from "./fetchStudies"
import { isValidateToken } from "./validateToken"
import { fetchInputCode } from "./fetchInputCode"
// import { Database } from "@cloudflare/d1"
// import { Miniflare } from "miniflare"

// const mf = new Miniflare({
// 	d1Databases: {
// 		DB_HEMVIP: "36316b2a-afc7-4db4-a639-a68d4f8b212c",
// 	},
// })

export default {
	async fetch(request, env, ctx) {
		const corsHeaders = {
			"Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
			"Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Allow-Credentials": "true",
		}

		if (request.method === "OPTIONS") {
			// Handle CORS preflight requests
			return new Response(null, { headers: corsHeaders })
		}

		const db = env.DB_HEMVIP

		if (!db) {
			// const db = await mf.getD1Database("DB");
		}

		// Verify the JWT token
		const isvalid = await isValidateToken(request, env)
		if (!isvalid) {
			return responseError(null, "Unauthorized", 401, corsHeaders)
		}
		try {
			const result = await db.prepare("SELECT * FROM inputcode").all()
			console.log("result", result)
			return responseSuccess(result, corsHeaders)
		} catch (error) {
			console.error("Error", error)
			return responseError(error, "Failed to connect to Database", 500, corsHeaders)
		}

		const url = new URL(request.url)
		const path = url.pathname

		try {
			if (request.method === "GET") {
				switch (path) {
					// case "/api/studies":
					// 	return fetchStudies(client, request, env, corsHeaders)
					// case "/api/inputcode":
					// 	return fetchInputCode(client, request, env, corsHeaders)
					// case '/api/studies/github':
					// 	return fetchStudies(request, env, corsHeaders)
					// case '/api/studies':
					// 	return handleGetUser(request, env, corsHeaders)
					// case '/api/studies':
					// 	return handleLogout(request, env, corsHeaders)
					default:
						return responseError(null, "Invalid GET api", 404, corsHeaders)
				}
			} else if (request.method === "POST") {
				switch (path) {
					// case '/api/studies/github':
					// 	return fetchStudies(request, env, corsHeaders)
					// case '/api/studies':
					// 	return handleGetUser(request, env, corsHeaders)
					// case '/api/studies':
					// 	return handleLogout(request, env, corsHeaders)
					default:
						return responseError(null, "Invalid POST api", 404, corsHeaders)
				}
			}
		} catch (err) {
			return responseError(err, err.message, 500, corsHeaders)
		}
	},
}
