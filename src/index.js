import { responseError } from "./response"
import { isValidateToken } from "./validateToken"
import { fetchStudies } from "./studies/fetchStudies"
import { fetchInputCode } from "./inputcode/fetchInputCode"
import { handleGithubCallback } from "./auth/handleGithubCallback"
import { handleGetUser } from "./auth/handleGetUser"
import { handleLogout } from "./auth/handleLogout"
import { updateInputCode } from "./inputcode/updateInputCode"
import { fetchSubmissions } from "./submissions/fetchSubmissions"
import { fetchSystems } from "./systems/fetchSystems"
import { insertSystems } from "./systems/insertSystems"

export default {
	async fetch(request, env, ctx) {
		const corsHeaders = {
			"Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
			"Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS, PATCH",
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Allow-Credentials": "true",
		}

		if (request.method === "OPTIONS") {
			// Handle CORS preflight requests
			return new Response(null, { headers: corsHeaders })
		}

		const url = new URL(request.url)
		const path = url.pathname
		const menthod = request.method

		try {
			if (url.pathname.startsWith("/auth/")) {
				switch (path) {
					case "/auth/callback/github":
						return handleGithubCallback(request, env, corsHeaders)
					case "/auth/user":
						return handleGetUser(request, env, corsHeaders)
					case "/auth/logout":
						return handleLogout(request, env, corsHeaders)
					default:
						return new Response("Invalid api", { status: 404 })
				}
			} else if (url.pathname.startsWith("/api/")) {
				// const isValid = await isValidateToken(request, env)

				// if (!isValid) {
				// 	return responseError(null, "Unauthorized", 401, corsHeaders)
				// }
				const db = env.DB_HEMVIP
				if (!db) {
					return responseError(null, "No database found sssss", 404, corsHeaders)
				}

				if (menthod === "GET") {
					switch (path) {
						case "/api/inputcode":
							return fetchInputCode(request, env, corsHeaders)
						case "/api/studies":
							return fetchStudies(request, env, corsHeaders)
						case "/api/systems":
							return fetchSystems(request, env, corsHeaders)
						case "/api/submissions":
							return fetchSubmissions(request, env, corsHeaders)
						default:
							return new Response("Invalid api", { status: 404 })
					}
				} else if (menthod === "POST") {
					switch (path) {
						case "/api/systems":
							return insertSystems(request, env, corsHeaders)
						default:
							return new Response("Invalid api", { status: 404 })
					}
				} else if (menthod === "PATCH") {
					switch (path) {
						case "/api/inputcode":
							return updateInputCode(request, env, corsHeaders)
						default:
							return new Response("Invalid api", { status: 404 })
					}
				}
			}

			return responseError(null, "Invalid api", 404, corsHeaders)
		} catch (err) {
			const errorMessage = err.message || "An unknown error occurred"
			console.log("Exception", err)
			return responseError(err, errorMessage, 500, corsHeaders)
		}
	},
}
