import { verify } from "@tsndr/cloudflare-worker-jwt"
import { responseError, responseFailed, responseSuccess } from "../response"
import { getCookie } from "../utils"

export async function handleGetUser(request, env, corsHeaders) {
	const cookies = request.headers.get("Cookie") || ""
	const token = getCookie(cookies, "genea-auth-token")

	if (!token) {
		console.log("cookies", cookies)
		return responseFailed(null, "No token provided", 401, corsHeaders)
	}

	try {
		const res = await verify(token, env.JWT_SECRET)
		if (res?.payload) {
			return responseSuccess(res.payload, "Authenticate successfully",corsHeaders)
		} else {
			return responseFailed(null, "Invalid token", 401, corsHeaders)
		}
	} catch (err) {
		responseError(err, "Invalid token", 401, corsHeaders)
	}
}
