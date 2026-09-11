/* * */

import { type Db, type MongoClient } from '@tmlmobilidade/go-clients-mongo';
import { type Agency, AgencySchema, type AppConfig, AppConfigSchema, type Attachment, AttachmentSchema, type Organization, OrganizationSchema, type Role, RoleSchema, type Session, SessionSchema, type User, UserSchema, type VerificationToken, VerificationTokenSchema } from '@tmlmobilidade/go-types-core';
import { type Extraction, ExtractionSchema } from '@tmlmobilidade/go-types-extractions';

import { createGoDbCollection } from '../factory/create-godb-collection.js';
import { type GoDbCollection } from '../factory/types/godb-collection.type.js';
import { extractionsIndexes } from '../indexes/core/extractions.js';

/* * */

export class CoreDatabase {
	//

	public readonly agencies: GoDbCollection<Agency>;
	public readonly appConfigs: GoDbCollection<AppConfig>;
	public readonly attachments: GoDbCollection<Attachment>;
	public readonly extractions: GoDbCollection<Extraction>;
	public readonly organizations: GoDbCollection<Organization>;
	public readonly roles: GoDbCollection<Role>;
	public readonly sessions: GoDbCollection<Session>;
	public readonly users: GoDbCollection<User>;
	public readonly verificationTokens: GoDbCollection<VerificationToken>;

	private readonly database: Db;
	private readonly databaseName = 'core';

	public constructor(instance: MongoClient) {
		// Create the database instance
		this.database = instance.db(this.databaseName);
		// Create collection interfaces
		this.agencies = createGoDbCollection<Agency>({ collectionName: 'agencies', database: this.database, indexDescription: null, schema: AgencySchema });
		this.appConfigs = createGoDbCollection<AppConfig>({ collectionName: 'app-configs', database: this.database, indexDescription: null, schema: AppConfigSchema });
		this.attachments = createGoDbCollection<Attachment>({ collectionName: 'attachments', database: this.database, indexDescription: null, schema: AttachmentSchema });
		this.extractions = createGoDbCollection<Extraction>({ collectionName: 'extractions', database: this.database, indexDescription: extractionsIndexes, schema: ExtractionSchema });
		this.organizations = createGoDbCollection<Organization>({ collectionName: 'organizations', database: this.database, indexDescription: null, schema: OrganizationSchema });
		this.roles = createGoDbCollection<Role>({ collectionName: 'roles', database: this.database, indexDescription: null, schema: RoleSchema });
		this.sessions = createGoDbCollection<Session>({ collectionName: 'sessions', database: this.database, indexDescription: null, schema: SessionSchema });
		this.users = createGoDbCollection<User>({ collectionName: 'users', database: this.database, indexDescription: null, schema: UserSchema });
		this.verificationTokens = createGoDbCollection<VerificationToken>({ collectionName: 'verification-tokens', database: this.database, indexDescription: null, schema: VerificationTokenSchema });
	}
}
