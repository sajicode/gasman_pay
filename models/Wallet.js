const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
	userID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'user',
		unique: true
	},
	availableBalance: {
		type: Number,
		default: 0
	},
	ledgerBalance: {
		type: Number,
		default: 0
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
});

module.exports = mongoose.model('wallet', WalletSchema);
