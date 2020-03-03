const forge = require('node-forge');
const axios = require('axios');
const dotenv = require('dotenv');
const md5 = require('md5');

dotenv.config();

const payment_url = process.env.PAYMENT_URL;

const options = {
	url: '',
	method: '',
	data: {
		PBFPubKey: '',
		alg: '3DES-24',
		client: ''
	},
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json'
	}
};

class Rave {
	constructor(public_key, secret_key) {
		this.public_key = public_key;
		this.secret_key = secret_key;
	}

	encryptCardDetails(card_details) {
		card_details = JSON.stringify(card_details);
		let cipher = forge.cipher.createCipher('3DES-ECB', forge.util.createBuffer(this.getKey()));
		cipher.start({ iv: '' });
		cipher.update(forge.util.createBuffer(card_details, 'utf8'));
		cipher.finish();
		let encrypted = cipher.output;
		return forge.util.encode64(encrypted.getBytes());
	}

	getKey() {
		let sec_key = this.secret_key;
		let keymd5 = md5(sec_key);
		let keymd5last12 = keymd5.substr(-12);

		let seckeyadjusted = sec_key.replace('FLWSECK-', '');
		let seckeyadjustedfirst12 = seckeyadjusted.substr(0, 12);

		return seckeyadjustedfirst12 + keymd5last12;
	}

	initiatePayment(card_details) {
		return new Promise((resolve, reject) => {
			let encrypted_card_details = this.encryptCardDetails(card_details);
			let payment_options = Object.assign({}, options);
			payment_options.url = `${payment_url}/charge`;
			payment_options.data.client = encrypted_card_details;
			payment_options.method = 'post';
			payment_options.data.PBFPubKey = this.public_key;

			axios(payment_options)
				.then((result) => {
					resolve(result.data);
				})
				.catch((err) => {
					reject(err);
				});
		});
	}
}

module.exports = Rave;
