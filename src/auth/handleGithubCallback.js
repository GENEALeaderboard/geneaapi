import { sign } from "@tsndr/cloudflare-worker-jwt"
import { responseFailed } from "../response"

export async function handleGithubCallback(request, env, corsHeaders) {
	const url = new URL(request.url)
	const code = url.searchParams.get("code")

	if (!code) {
		return responseFailed(null, "No code provided", 400, corsHeaders)
	}

	console.log("env", env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET, code)

	// Exchange code for access token
	const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({
			client_id: env.GITHUB_CLIENT_ID,
			client_secret: env.GITHUB_CLIENT_SECRET,
			code,
		}),
	})

	console.log("tokenResponse", tokenResponse)

	// Check if token response is OK
	if (!tokenResponse.ok) {
		const errorText = await tokenResponse.text()
		console.error("GitHub Token Error:", errorText)
		return responseFailed(null, `GitHub token request failed: ${errorText}`, 400, corsHeaders)
	}

	const tokenData = await tokenResponse.json()

	if (!tokenData.access_token) {
		return responseFailed(null, `Invalid GitHub OAuth response: ${JSON.stringify(tokenData)}`, 400, corsHeaders)
	}

	// Get user data from GitHub
	const userResponse = await fetch("https://api.github.com/user", {
		headers: {
			Authorization: `Bearer ${tokenData.access_token}`,
			Accept: "application/json",
			"User-Agent": '"Mozilla/5.0 (compatible; Cloudflare-Worker/1.0)"',
		},
	})

	if (!userResponse.ok) {
		const errorText = await userResponse.text()
		console.error("GitHub API Error:", userResponse.status, errorText)
		return responseFailed(null, `GitHub API Error: ${userResponse.status} - ${errorText}`, userResponse.status, corsHeaders)
	}

	const userData = await userResponse.json()

	// *********************** Create JWT token ***********************
	const token = await sign(
		{
			userid: userData.id.toString(),
			username: userData.login,
			email: userData.email,
			name: userData.name,
			avatar: userData.avatar_url,
			exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
		},
		env.JWT_SECRET
	)

	// Create a new response with the updated headers
	const response = Response.redirect(`${env.ALLOWED_ORIGIN}/getting-started`, 302)

	// Set the Set-Cookie header using the correct method
	const responseWithCookie = new Response(response.body, response)
	responseWithCookie.headers.set(
		"Set-Cookie",
		`genea-auth-token=${token}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${24 * 60 * 60}`
	)

	return responseWithCookie
}
