const express = require('express');
const cors = require('cors');
const logger = require('morgan');
const dotenv = require('dotenv');

const indexRouter = require('./routes');

dotenv.config();

const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', indexRouter);

app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.send({ status: 'fail', message: err.message });
});

const port = process.env.PORT || 5300;

app.listen(port, () => console.log(`Payment Server listening on port ${port}`));
