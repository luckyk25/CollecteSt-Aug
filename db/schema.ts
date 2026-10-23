import { integer, sqliteTable, text, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const subscriptions = sqliteTable('sms_subscriptions', {
 userId: text('user_id').primaryKey(), phone: text('phone').notNull(), address: text('address').notNull(),
 streetId: text('street_id').notNull(), sector: integer('sector').notNull(), types: text('types').notNull(),
 consentAt: text('consent_at').notNull(), consentVersion: text('consent_version').notNull(),
 createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull()
},t=>[uniqueIndex('subscription_phone_unique').on(t.phone)]);
export const challenges = sqliteTable('sms_challenges', {
 userId:text('user_id').primaryKey(), challengeId:text('challenge_id').notNull(), phone:text('phone').notNull(),
 address:text('address').notNull(), streetId:text('street_id').notNull(), sector:integer('sector').notNull(), types:text('types').notNull(),
 consentAt:text('consent_at').notNull(), expiresAt:integer('expires_at').notNull(), attempts:integer('attempts').notNull().default(0)
});
export const rateLimits = sqliteTable('sms_rate_limits',{
 key:text('key').primaryKey(), day:text('day').notNull(), count:integer('count').notNull(), lastAt:integer('last_at').notNull()
});
export const deliveries = sqliteTable('sms_deliveries',{
 id:text('id').primaryKey(), userId:text('user_id').notNull(), collectionDate:text('collection_date').notNull(),
 status:text('status').notNull(), providerSid:text('provider_sid'), createdAt:text('created_at').notNull(), updatedAt:text('updated_at').notNull()
},t=>[uniqueIndex('delivery_once').on(t.userId,t.collectionDate)]);

export const telegramInvites=sqliteTable('telegram_invites',{
 id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),tokenHash:text('token_hash').notNull(),
 address:text('address').notNull(),streetId:text('street_id').notNull(),sector:integer('sector').notNull(),types:text('types').notNull(),
 expiresAt:integer('expires_at').notNull(),createdAt:text('created_at').notNull()
},t=>[uniqueIndex('telegram_invite_token_unique').on(t.tokenHash),index('telegram_invite_owner').on(t.ownerId),index('telegram_invite_expiry').on(t.expiresAt)]);
export const telegramSubscriptions=sqliteTable('telegram_subscriptions',{
 id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),chatId:text('chat_id').notNull(),displayName:text('display_name').notNull(),username:text('username').notNull(),
 address:text('address').notNull(),streetId:text('street_id').notNull(),sector:integer('sector').notNull(),types:text('types').notNull(),
 consentAt:text('consent_at').notNull(),consentVersion:text('consent_version').notNull(),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()
},t=>[uniqueIndex('telegram_chat_unique').on(t.chatId),index('telegram_subscription_owner_created').on(t.ownerId,t.createdAt)]);
export const telegramDeliveries=sqliteTable('telegram_deliveries',{
 id:text('id').primaryKey(),recipientId:text('recipient_id').notNull(),collectionDate:text('collection_date').notNull(),status:text('status').notNull(),
 messageId:text('message_id'),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull()
},t=>[uniqueIndex('telegram_delivery_once').on(t.recipientId,t.collectionDate)]);
export const telegramState=sqliteTable('telegram_state',{
 key:text('key').primaryKey(),value:text('value').notNull(),untilAt:integer('until_at').notNull()
});
