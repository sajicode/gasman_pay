const express = require('express');
const router = express.Router();
const { config } = require('dotenv');
const Rave = require('../helpers/flutterwave');

config();

router.get('/test', (req, res) => {
	res.status(200).send({ status: 'success', data: 'Pump It' });
});

router.post('/charge', (req, res) => {
	const rave = new Rave(process.env.PUBLIC_KEY, process.env.SECRET_KEY);

	const { card_no, cvv, expiry_month, expiry_year, pin, email, phone, first_name, last_name, amount } = req.body;

	rave
		.initiatePayment({
			cardno: card_no,
			cvv: cvv,
			expirymonth: expiry_month,
			expiryyear: expiry_year,
			currency: 'NGN',
			pin: pin,
			country: 'NG',
			amount: amount,
			email: email,
			suggested_auth: 'PIN',
			phonenumber: phone,
			firstname: first_name,
			lastname: last_name,
			txRef: 'GM-' + Date.now()
		})
		.then((result) => {
			res.status(200).send(result);
		})
		.catch((err) => {
			res.status(422).send({ status: 'fail', message: err.message });
		});
});

module.exports = router;
