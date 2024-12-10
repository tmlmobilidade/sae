/* * */

import LOGGER from '@helperkits/logger';
import pg from 'pg';

/* * */

const client = new pg.Client({
	connectionTimeoutMillis: 10000,
	database: process.env.BRIDGEDB_DB,
	host: process.env.BRIDGEDB_HOST,
	password: process.env.BRIDGEDB_PASSWORD,
	port: process.env.BRIDGEDB_PORT || 5432,
	user: process.env.BRIDGEDB_USER,
});

async function connect() {
	await client.connect();
	LOGGER.success('Connected to BRIDGEDB');
}

async function disconnect() {
	await client.end();
	LOGGER.success('Disconnected from BRIDGEDB');
}

/* * */

const slamanagerbridgedb = {
	client,
	connect,
	disconnect,
};

/* * */

export default slamanagerbridgedb;
