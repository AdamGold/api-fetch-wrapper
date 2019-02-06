# api-fetch-wrapper

This is a small wrapper to handle custom responses from your server.

### Example scenario

Every time you get `EXPIRED_TOKEN`, you want to send a `refresh_token` request, and then re-send the original request - but not more than 3 times.

## Installation

`npm install api-fetch-wrapper`

## Usage

```js
import Fetch from "api-fetch-wrapper"

const func = json => {
	// do something
}

const fetchService = new Fetch(
	"http://example.com",
	{
		param: "auth_token", // auth token parameter got in response from server
		key: "auth_token" // Storage key
	},
	{
		param: "refresh_token", // refresh token parameter to send in request to server
		key: "refresh_token" // Storage key
	},
	{
		EXPIRED_TOKEN: "_handleExpiredToken", // built in in class
		ANOTHER_THING: func
	},
	2
)
const resp = await fetchService.fetch("/some_endpoint", {
	method: "POST",
	body: JSON.stringify({
		exchange_token: token
	})
})

// resp.json and resp.status
```
