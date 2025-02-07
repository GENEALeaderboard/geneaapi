export async function handleLogout(request, env, corsHeaders) {
	const response = new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
	const secure = env.ENVIRONMENT === "development" ? "SameSite=Lax;" : "Secure; SameSite=None;"

	response.headers.set("Set-Cookie", `genea-auth-token=; Path=/; HttpOnly; ${secure} Max-Age=0`)
	response.headers.set(
		"Set-Cookie",
		`genea-api-token=; Domain=${env.NEXT_PUBLIC_API_ENDPOINT}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${24 * 60 * 60}`
	)

	return response
}
