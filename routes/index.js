const express = require('express');
const router = express.Router();
const axios = require('axios');
const { check, validationResult } = require('express-validator');
const { config } = require('dotenv');
const Rave = require('../helpers/flutterwave');
const { authUser } = require('../middleware/auth');
const Wallet = require('../models/Wallet');

config();

const payment_url = process.env.PAYMENT_URL;

router.get('/test', (req, res) => {
	res.status(200).send({ status: 'success', data: 'Pump It' });
});

router.post(
	'/charge',
	authUser,
	[
		check('card_no', 'Card Number is required').not().isEmpty().isString(),
		check('cvv', 'The card cvv is required').notEmpty().isString(),
		check('expiry_month', 'Enter the card expiry month').notEmpty().isString(),
		check('expiry_year', 'Enter the card expiry year').notEmpty().isString(),
		check('pin', 'Enter the card pin').notEmpty().isString(),
		check('amount', 'Enter the transaction amount').notEmpty().isNumeric()
	],
	async (req, res) => {
		const rave = new Rave(process.env.PUBLIC_KEY, process.env.SECRET_KEY);

		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ status: 'fail', errors: errors.array() });
		}

		const { card_no, cvv, expiry_month, expiry_year, pin, amount } = req.body;

		let { email, phone, fullName } = req.user;

		fullName = fullName.split(' ');
		const first_name = fullName[0],
			last_name = fullName[1];

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
	}
);

router.post(
	'/validate',
	authUser,
	[
		check('transaction_reference', 'The transaction reference is required').not().isEmpty().isString(),
		check('otp', 'The OTP is required').notEmpty().isString()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ status: 'fail', errors: errors.array() });
		}

		const { transaction_reference, otp } = req.body;

		try {
			const response = await axios.post(`${payment_url}/validatecharge`, {
				PBFPubKey: process.env.PUBLIC_KEY,
				transaction_reference: transaction_reference,
				otp: otp
			});

			res.status(200).send(response.data);
		} catch (error) {
			res.status(400).send({ status: 'fail', message: error.message });
		}
	}
);

/* 
	create user wallet endpoint
*/
router.post(
	'/create-wallet',
	[ check('userID', 'The User ID is required').notEmpty().isString() ],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			console.log(errors.array());
			return res.status(400).json({ status: 'fail', errors: errors.array() });
		}

		const userID = req.body.userID;

		const wallet = {
			userID
		};

		try {
			const newWallet = Wallet.create(wallet);
			return res.status(200).send({ status: 'success', data: newWallet });
		} catch (error) {
			console.log('Wallet creation error', error.message);
			return res.status(500).send({ status: 'fail', message: error.message });
		}
	}
);

/*
fund wallet endpoint
*/

router.post(
	'/fund-wallet',
	authUser,
	[ check('amount', 'Wallet fund amount is required').notEmpty().isNumeric() ],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ status: 'fail', errors: errors.array() });
		}

		const user_id = req.user.id;
		const amount = req.body.amount;

		const userWallet = await Wallet.findOne({ userID: user_id });

		if (!userWallet) {
			return res.status(404).send({ status: 'fail', message: 'User has no wallet' });
		}

		try {
			const wallet = await Wallet.findOneAndUpdate(
				{ userID: user_id },
				{ $inc: { ledgerBalance: amount, availableBalance: amount } },
				{ new: true }
			);

			return res.status(200).send({ status: 'success', data: wallet });
		} catch (error) {
			console.log('Wallet fund error', error.message);
			return res.status(500).send({ status: 'fail', message: error.message });
		}
	}
);

/*
fund wallet endpoint
*/

router.post(
	'/charge-wallet',
	authUser,
	[ check('amount', 'Wallet fund amount is required').notEmpty().isNumeric() ],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ status: 'fail', errors: errors.array() });
		}

		const user_id = req.user.id;
		const amount = req.body.amount;

		const userWallet = await Wallet.findOne({ userID: user_id });

		if (!userWallet) {
			return res.status(404).send({ status: 'fail', message: 'User has no wallet' });
		}

		if (userWallet.availableBalance < amount) {
			return res.status(400).send({ status: 'fail', message: 'Insufficient funds' });
		}

		try {
			const wallet = await Wallet.findOneAndUpdate(
				{ userID: user_id },
				{ $inc: { ledgerBalance: -amount, availableBalance: -amount } },
				{ new: true }
			);

			return res.status(200).send({ status: 'success', data: wallet });
		} catch (error) {
			console.log('Wallet charge error', error.message);
			return res.status(500).send({ status: 'fail', message: error.message });
		}
	}
);

module.exports = router;
