import { responseError, responseSuccess } from "./response"
import { isValidateToken } from "./validateToken"
import { fetchStudies } from "./studies/fetchStudies"
import { fetchInputCode } from "./inputcode/fetchInputCode"
import { handleGithubCallback } from "./auth/handleGithubCallback"
import { handleGetUser } from "./auth/handleGetUser"
import { handleLogout } from "./auth/handleLogout"

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

		const url = new URL(request.url)
		const path = url.pathname

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
				switch (path) {
					case "/api/inputcode":
						return fetchInputCode(request, env, corsHeaders)
					// case "/api/studies":
					// 	return handleGetUser(request, env, corsHeaders)
					// case "/api/logout":
					// 	return handleLogout(request, env, corsHeaders)
					default:
						return new Response("Invalid api", { status: 404 })
				}
			}

			return responseError(null, "Invalid api", 404, corsHeaders)
		} catch (err) {
			console.error("Error", err)
			return responseError(err, err.message, 500, corsHeaders)
		}
	},
}
