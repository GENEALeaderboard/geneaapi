import { fetchAllStudies } from "./studies/fetchAllStudies"
import { fetchAttentionCheck } from "./attention-check/fetchAttentionCheck"
import { fetchConfigs } from "./configs/fetchConfigs"
import { fetchInputCode } from "./inputcode/fetchInputCode"
import { fetchInputCodePairs } from "./inputcode/fetchInputCodePairs"
import { fetchMismatch } from "./mismatch/fetchMismatch"
import { fetchParticipants } from "./participants/fetchParticipants"
import { fetchStudies } from "./studies/fetchStudies"
import { fetchSubmissionFiltered } from "./submissions/fetchSubmissionFiltered"
import { fetchSubmissions } from "./submissions/fetchSubmissions"
import { fetchSystemList } from "./systems/fetchSystemList"
import { fetchSystems } from "./systems/fetchSystems"
import { fetchVideoList } from "./videos/fetchVideoList"
import { fetchVideos } from "./videos/fetchVideos"

import { handleGetUser } from "./auth/handleGetUser"
import { handleGithubCallback } from "./auth/handleGithubCallback"
import { handleLogout } from "./auth/handleLogout"

import { insertAttentionCheck } from "./attention-check/insertAttentionCheck"
import { insertSemanticAttentionCheck } from "./attention-check/insertSemanticAttentionCheck"
import { insertMismatch } from "./mismatch/insertMismatch"
import { insertPages } from "./pages/insertPages"
import { deleteStudies } from "./studies/deleteStudies"
import { failNewStudies } from "./studies/failNewStudies"
import { insertStudies } from "./studies/insertStudies"
import { insertSubmission } from "./submissions/insertSubmission"
import { insertSystems } from "./systems/insertSystems"
import { insertSeamlessSystem } from "./systems/insertSeamlessSystem"
import { insertUsers } from "./users/insertUsers"
import { insertVideos } from "./videos/insertVideos"

import { isValidateToken } from "./validateToken"
import { responseError, responseFailed } from "./response"
import { updateInputCode } from "./inputcode/updateInputCode"
import { updateInputCodePairs } from "./inputcode/updateInputCodePairs"
import { updateSubmission } from "./submissions/updateSubmission"

import { validateMismatchSpeech } from "./mismatch-speech/validateMismatchSpeech"
import { validatePairwiseHumanLikeness } from "./pairwise-humanlikeness/validatePairwiseHumanLikeness"
import { validateSeamlessHumanLikeness } from "./seamless-humanlikeness/validateSeamlessHumanLikeness"
import { validateSeamlessSpeechMismatch } from "./seamless-speech-mismatch/validateSeamlessSpeechMismatch"
import { validateSeamlessDyadicMismatch } from "./seamless-dyadic-mismatch/validateSeamlessDyadicMismatch"
import { validateSeamlessSemanticMismatch } from "./seamless-semantic-mismatch/validateSeamlessSemanticMismatch"

export default {
	async fetch(request, env, ctx) {
		const corsHeaders = {
			"Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
			"Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS, PATCH, DELETE",
			"Access-Control-Allow-Headers": "Content-Type",
			"Access-Control-Allow-Credentials": "true",
			"Access-Control-Max-Age": "86400",
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
						return responseFailed(null, "Invalid api", 404, corsHeaders)
				}
			} else if (url.pathname.startsWith("/api/")) {
				// const isValid = await isValidateToken(request, env)

				// if (!isValid) {
				// 	return responseError(null, "Unauthorized", 401, corsHeaders)
				// }
				const db = env.DB_HEMVIP
				if (!db) {
					return responseError(null, "No database found", 404, corsHeaders)
				}

				if (menthod === "GET") {
					switch (path) {
						case "/api/inputcode":
							return fetchInputCode(request, db, corsHeaders)
						case "/api/inputcode-pairs":
							return fetchInputCodePairs(request, db, corsHeaders)
						case "/api/participants":
							return fetchParticipants(request, db, corsHeaders)
						case "/api/study":
							return fetchStudies(request, db, corsHeaders)
						case "/api/studies":
							return fetchAllStudies(request, db, corsHeaders)
						case "/api/configs":
							return fetchConfigs(request, db, corsHeaders)
						case "/api/systems":
							return fetchSystems(request, db, corsHeaders)
						case "/api/system-list":
							return fetchSystemList(request, db, corsHeaders)
						case "/api/submissions":
							return fetchSubmissions(request, db, corsHeaders)
						case "/api/submission-filtered":
							return fetchSubmissionFiltered(request, db, corsHeaders)
						case "/api/videos":
							return fetchVideos(request, db, corsHeaders)
						case "/api/video-list":
							return fetchVideoList(request, db, corsHeaders)
						case "/api/mismatch":
							return fetchMismatch(request, db, corsHeaders)
						case "/api/attention-check":
							return fetchAttentionCheck(request, db, corsHeaders)
						default:
							return responseFailed(null, "Invalid api", 404, corsHeaders)
					}
				} else if (menthod === "POST") {
					switch (path) {
						case "/api/systems":
							return insertSystems(request, db, corsHeaders)
						case "/api/systems/seamless":
							return insertSeamlessSystem(request, db, corsHeaders)
						case "/api/users":
							return insertUsers(request, db, corsHeaders)
						case "/api/videos":
							return insertVideos(request, db, corsHeaders)
						case "/api/mismatch":
							return insertMismatch(request, db, corsHeaders)
						case "/api/attention-check":
							return insertAttentionCheck(request, db, corsHeaders)
						case "/api/attention-check/semantic":
							return insertSemanticAttentionCheck(request, db, corsHeaders)
						case "/api/pages":
							return insertPages(request, db, corsHeaders)
						case "/api/studies":
							return insertStudies(request, db, corsHeaders)
						case "/api/submissions":
							return insertSubmission(request, db, corsHeaders)
						// case "/api/pairwise-humanlikeness":
						// 	return createPairwiseHumanLikeness(request, db, corsHeaders)
						// case "/api/mismatch-speech":
						// 	return createMismatchSpeech(request, db, corsHeaders)
						default:
							return responseFailed(null, "Invalid api", 404, corsHeaders)
					}
				} else if (menthod === "PATCH") {
					switch (path) {
						case "/api/inputcode":
							return updateInputCode(request, db, corsHeaders)
						case "/api/inputcode-pairs":
							return updateInputCodePairs(request, db, corsHeaders)
						case "/api/studies/fail-new":
							return failNewStudies(request, db, corsHeaders)
						case "/api/submissions":
							return updateSubmission(request, db, corsHeaders)
						case "/api/pairwise-humanlikeness":
							return validatePairwiseHumanLikeness(request, db, corsHeaders)
						case "/api/seamless-humanlikeness":
							return validateSeamlessHumanLikeness(request, db, corsHeaders)
						case "/api/seamless-speech-mismatch":
							return validateSeamlessSpeechMismatch(request, db, corsHeaders)
						case "/api/seamless-dyadic-mismatch":
							return validateSeamlessDyadicMismatch(request, db, corsHeaders)
						case "/api/seamless-semantic-mismatch":
							return validateSeamlessSemanticMismatch(request, db, corsHeaders)
						case "/api/mismatch-speech":
							return validateMismatchSpeech(request, db, corsHeaders)
						default:
							return responseFailed(null, "Invalid api", 404, corsHeaders)
					}
				} else if (menthod === "DELETE") {
					switch (path) {
						case "/api/studies":
							return deleteStudies(request, db, corsHeaders)
						default:
							return responseFailed(null, "Invalid api", 404, corsHeaders)
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
