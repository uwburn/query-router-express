# Query router middleware

A simple Express middleware to route last-mile based on query parameters.

### Usage

```javascript
const express = require('express');
const queryRouter = require('query-router-express');

const router = express.Router();

router.get('/', queryRouter([
	{
		default: true,
		query: {
			criteria: "box"
		}
		handler: async function(req, res) {
			let objs = await getFromDbByBox();

			res.send(objs);
		}
	},
	{
		query: {
			criteria: "near"
		}
		handler: async function(req, res) {
			let objs = await getFromDbNear();

			res.send(objs);
		}
	}
]));
```

### Notes
The middleware requires ES6 async/await as it support async handlers
and any error thrown by them will be passed to `next`.
