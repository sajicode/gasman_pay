const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const authURL = process.env.AUTH_URL;

const getToken = (attrs) => {
	return axios
		.post(`${authURL}/token`, attrs)
		.then((response) => {
			if (response.status !== 200) {
				console.error(Date(), 'Could not relay to auth service');
				return {
					status: 'fail',
					message: 'Connection error'
				};
			}

			return response.data;
		})
		.catch((err) => {
			console.error(Date(), err.message);
			return {
				status: 'fail',
				message: err.message
			};
		});
};

const authUser = (req, res, next) => {
	const { authorization } = req.headers;

	if (!authorization) {
		return res.status(401).send({ status: 'fail', message: 'No auth token' });
	}

	const token = authorization.replace('Bearer ', '');

	return axios
		.post(`${authURL}/verify`, { token })
		.then((response) => {
			if (response.status !== 200) {
				console.error(Date(), 'Could not relay to auth service');
				return res.status(422).send({ status: 'fail', message: 'Unable to authenticate' });
			}

			req.user = response.data.data;
			next();
			// return response.data;
		})
		.catch((err) => {
			console.error(Date(), err.message);
			res.status(500).send({ status: 'fail', message: 'Unable to authenticate' });
		});
};

module.exports = {
	getToken,
	authUser
};
