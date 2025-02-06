export function responseSuccess(data, corsHeaders) {
	return new Response(JSON.stringify({ succes: true, error: null, data }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
}

export function responseFailed(data, msg, status, corsHeaders) {
	return new Response(JSON.stringify({ succes: false, error: null, msg: msg, data }), { status: status, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
}

export function responseError(error, msg, status, corsHeaders) {
	return new Response(JSON.stringify({ succes: false, error: error, msg: msg, data: null }), { status: status, headers: { 'Content-Type': 'application/json', ...corsHeaders } })
}
