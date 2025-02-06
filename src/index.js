import { App, Credentials } from "realm-web"
import { responseError } from "./response"
import { fetchStudies } from "./fetchStudies"
import { isValidateToken } from "./validateToken"
import { fetchInputCode } from "./fetchInputCode"

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

		// Verify the JWT token
		const isvalid = await isValidateToken(request, env)
		if (!isvalid) {
			return responseError(null, "Unauthorized", 401, corsHeaders)
		}

		const app = new App({ id: env.REALM_APP_ID })
		const credentials = Credentials.apiKey(env.REALM_APP_SECRET_TOKEN)
		const user = await app.logIn(credentials)
		var client = user.mongoClient("mongodb-atlas")
		if (!client) {
			return responseError(null, "Failed to connect to MongoDB", 500, corsHeaders)
		}

		const url = new URL(request.url)
		const path = url.pathname

		try {
			if (request.method === "GET") {
				switch (path) {
					case "/api/studies":
						return fetchStudies(client, request, env, corsHeaders)
					case "/api/inputcode":
						return fetchInputCode(client, request, env, corsHeaders)
					// case '/api/studies/github':
					// 	return fetchStudies(request, env, corsHeaders)
					// case '/api/studies':
					// 	return handleGetUser(request, env, corsHeaders)
					// case '/api/studies':
					// 	return handleLogout(request, env, corsHeaders)
					default:
						return new Response("Invalid api", { status: 404 })
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
						return new Response("Invalid api", { status: 404 })
				}
			}
		} catch (err) {
			return responseError(err, err.message, 500, corsHeaders)
		}
	},
}
