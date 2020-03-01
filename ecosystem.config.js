module.exports = {
	/**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
	apps: [
		{
			name: 'Gasman-Payment Server',
			script: './app.js',
			source_map_support: true,
			exec_mode: 'cluster',
			instances: 'max'
		}
	]
};
