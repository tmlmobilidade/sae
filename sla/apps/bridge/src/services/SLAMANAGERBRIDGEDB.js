/* * */

import LOGGER from '@helperkits/logger';
import pg from 'pg';

/* * */

const client = new pg.Client({
	connectionTimeoutMillis: 10000,
	database: process.env.SLAMANAGERBRIDGEDB_DB,
	host: process.env.SLAMANAGERBRIDGEDB_HOST,
	password: process.env.SLAMANAGERBRIDGEDB_PASSWORD,
	port: process.env.SLAMANAGERBRIDGEDB_PORT || 5432,
	user: process.env.SLAMANAGERBRIDGEDB_USER,
});

async function connect() {
	await client.connect();
	LOGGER.success('Connected to SLAMANAGERBRIDGEDB');
}

async function disconnect() {
	await client.end();
	LOGGER.success('Disconnected from SLAMANAGERBRIDGEDB');
}

/* * */

const slamanagerbridgedb = {
	client,
	connect,
	disconnect,
};

/* * */

export default slamanagerbridgedb;
