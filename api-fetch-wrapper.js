import { AsyncStorage } from "react-native"

module.exports = class FetchWrapper {
	_RESEND = Symbol("RESEND")

	constructor(
		rootUrl,
		params,
		storage = {},
		customExceptions = {},
		requestsLimit = 2,
		refreshEndPoint = ""
	) {
		this.sentRequests = 0
		this._requestsLimit = requestsLimit
		this.defaultHeaders = {
			Accept: "application/json",
			"Content-Type": "application/json"
		}
		this._definedExceptions = customExceptions
		this._params = params
		this._storage = storage
		this._refreshEndPoint = refreshEndPoint
		this.rootURL = rootUrl
	}

	/*
    General exception manager.
    Checks for every known exception we might get
    from our server and calls the corresponding method
    */
	async _handleExceptions(json) {
		if (
			this._params.hasOwnProperty("error") &&
			this._definedExceptions.hasOwnProperty(json[this._params["error"]])
		) {
			const func = this._definedExceptions[json[this._params["error"]]]
			let handling
			if (typeof func === "string") {
				handling = await this[func](json)
			} else {
				handling = await func(json)
			}
			return handling
		}
		return json
	}

	/*
    Handle expired tokens.
    Send request to refresh the token,
    and re-send the original request.
    */
	async _handleExpiredToken(json) {
		if (!this._storage || !this._refreshEndPoint) return {}
		const refresh_token = await AsyncStorage.getItem(
			this._storage["refresh_token"]
		)
		if (!refresh_token) {
			// don't have a refresh token, will have to login again
			return {}
		}
		const resp = await fetch(this.rootURL + this._refreshEndPoint, {
			method: "POST",
			headers: this.defaultHeaders,
			body: JSON.stringify({
				[this._params["refresh_token"]]: refresh_token
			})
		})
		const respJSON = await resp.json()
		console.log(respJSON)
		this._throwError(resp.status, respJSON)
		await AsyncStorage.setItem(
			this._storage["auth_token"],
			respJSON[this._params["auth_token"]]
		)
		return { symbol: this._RESEND }
	}

	_throwError(status, json) {
		if (400 <= status && status < 600) {
			// we have an error
			let msg = "Something went wrong."
			if (
				this._params.hasOwnProperty("error") &&
				json.hasOwnProperty(this._params["error"])
			)
				msg = json[this._params["error"]]
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
		const token = await AsyncStorage.getItem(this._storage["auth_token"])
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
