import { verify } from "@tsndr/cloudflare-worker-jwt"


export async function isValidateToken(request, env) {
	const cookies = request.headers.get("Cookie") || ""
	const tokenMatch = cookies.match(/genea-auth-token=([^;]+)/)
	const session_token = tokenMatch ? tokenMatch[1] : null
	if (!session_token) {
		return false
	}

	const res = await verify(session_token, env.JWT_SECRET)
	if (!res?.payload || !res.payload.exp) {
		return false
	}

	const isValidToken = res.payload ? res.payload.exp > Math.floor(Date.now() / 1000) : false

	return isValidToken
}
