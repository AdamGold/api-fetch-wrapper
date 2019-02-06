import { AsyncStorage } from "react-native"

module.exports = class FetchWrapper {
	_RESEND = Symbol("RESEND")

	constructor(
		rootUrl,
		authToken,
		refreshToken,
		requestsLimit,
		customExceptions
	) {
		this.sentRequests = 0
		this._requestsLimit = requestsLimit
		this.defaultHeaders = {
			Accept: "application/json",
			"Content-Type": "application/json"
		}
		this._definedExceptions = customExceptions
		this._refresh = refreshToken
		this._auth = authToken
		this.rootURL = rootUrl
	}

	/*
    General exception manager.
    Checks for every known exception we might get
    from our server and calls the corresponding method
    */
	async _handleExceptions(json) {
		if (
			this._definedExceptions.hasOwnProperty(
				json[this._response["error"]]
			)
		) {
			const func = this._definedExceptions[json[this._response["error"]]]
			let handling = func
			if (typeof func == "String") {
				handling = this[func]
			}
			return await handling(json)
		}
		return json
	}

	/*
    Handle expired tokens.
    Send request to refresh the token,
    and re-send the original request.
    */
	async _handleExpiredToken() {
		const refresh_token = await AsyncStorage.getItem(this._refresh["key"])
		if (!refresh_token) {
			// don't have a refresh token, will have to login again
			return {}
		}
		const resp = await fetch(this.rootURL + this._refresh["endpoint"], {
			method: "POST",
			headers: this.defaultHeaders,
			body: JSON.stringify({
				[this._refresh["param"]]: refresh_token
			})
		})
		const respJSON = await resp.json()
		this._throwError(resp.status, respJSON)
		await Storage.setItem(this._auth["key"], respJSON[this._auth["param"]])
		return { symbol: this._RESEND }
	}

	_throwError(status, json) {
		if (400 <= status && status < 600) {
			// we have an error
			let msg = json
			if (msg.hasOwnProperty(this._response["error"]))
				msg = msg[this._response["error"]]
			throw new Error(msg)
		}
	}
	/* main fetch method --> calls fetch with
    exception handling */
	async fetch(...fetchParams) {
		if (this.sentRequests > this._requestsLimit) {
			this.sentRequests = 0
			throw new Error("Too many requests.")
		}
		const token = await AsyncStorage.getItem(this.authToken["key"])
		fetchParams[1]["headers"] = {
			...this.defaultHeaders,
			...fetchParams[1]["headers"],
			Authorization: "Bearer " + token
		}
		const resp = await fetch(this.rootURL + fetchParams[0], fetchParams[1])
		let respJSON = await resp.json()
		respJSON = await this._handleExceptions(respJSON)
		if (
			respJSON.hasOwnProperty("symbol") &&
			respJSON["symbol"] == this._RESEND
		) {
			this.sentRequests += 1
			return await this.fetch(...fetchParams)
		}
		this.sentRequests = 0 // reset sentRequests
		this._throwError(resp.status, respJSON)
		return { json: respJSON, status: resp.status }
	}
}
