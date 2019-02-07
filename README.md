# api-fetch-wrapper

This is a small wrapper to handle custom responses from your server. The package automatically adds an auth header to all your requests - it fetches the auth token using a function it receives as a parameter (I recommend using [rn-secure-storage](https://github.com/talut/rn-secure-storage)). If the token is expired, it can send a refresh request and then re-send the original request. You can also define your own functions based on the server's response.

### Example scenario

Every time you get `EXPIRED_TOKEN`, you want to send a `refresh_token` request, and then re-send the original request - but not more than 3 times.

## Installation

`npm install api-fetch-wrapper`

## Usage

```js
import Fetch from "api-fetch-wrapper"

const handleInvalidToken = json => {
	// do something
}

const storeFunction = async (key, value = "") => {
	/* the library sends the keys you define in params */
	if (value == "") {
		// get value
		return await AsyncStorage.getItem(value)
	}
	// set value
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
```
