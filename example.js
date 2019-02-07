import Fetch from "api-fetch-wrapper"

const handleInvalidToken = json => {
	// do something
}

const storeFunction = async (key, value = "") => {
	/* the library sends the keys `auth_token` and `refresh_token` */
	if (value == "") {
		// get value
		return await AsyncStorage.getItem(value)
	}
	return await AsyncStorage.setItem(key, value)
}

const fetchService = new Fetch(
	"https://example.com",
	{
		// params: the params the server expects / returns, and the keys to send to storeFunction
		auth_token: "auth_token", // auth token param in server response
		refresh_token: "refresh_token", // POST param for refreshing token
		error: "message" // if an error occurs, what's the name of the param the server returns? {"message": "ERROR MESSAGE"}
	},
	storeFunction, // function to handle get / set tokens
	{
		EXPIRED_TOKEN: "_handleExpiredToken", // built in in class
		INVALID_TOKEN: handleInvalidToken
	},
	2, // maximum requests to be sent
	"login/refresh_token" // refresh token endpoint
)

try {
	const resp = await fetchService.fetch("/endpoint", {
		method: "POST",
		body: {
			param: "hello world"
		}
	})

	// resp.json and resp.status
} catch (error) {
	// error.message is either an error from your server (if you defined params.error)
	// or a default error
}
