import Fetch from "api-fetch-wrapper"

const func = json => {
	// do something
}

const fetchService = new Fetch(
	"https://example.com",
	{
		// params: the params the server expects / returns.
		auth_token: "auth_token", // auth token param in server response
		refresh_token: "refresh_token", // POST param for refreshing token
		error: "message" // if an error occurs, what's the name of the param the server returns? {"message": "ERROR MESSAGE"}
	},
	{
		// keys in async storage
		auth_token: "auth_token",
		refresh_token: "refresh_token"
	},
	{
		EXPIRED_TOKEN: "_handleExpiredToken", // built in in class
		INVALID_TOKEN: func
	},
	2, // maximum requests to be sent
	"login/refresh_token" // refresh token endpoint
)

const resp = await fetchService.fetch("/endpoint", {
	method: "POST",
	body: {
		param: "hello world"
	}
})

// resp.json and resp.status
