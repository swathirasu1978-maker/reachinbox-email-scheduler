import { Client } from "@elastic/elasticsearch";
import { env } from "../config/env";

const elastic = env.ELASTICSEARCH_URL
  ? new Client({ node: env.ELASTICSEARCH_URL })
  : null;

export async function ensureIndex() {
  if (!elastic) return;

  const exists = await elastic.indices.exists({
    index: env.ELASTICSEARCH_INDEX
  });

  if (!exists) {
    await elastic.indices.create({
      index: env.ELASTICSEARCH_INDEX,
      mappings: {
        properties: {
          emailId: { type: "keyword" },
          userId: { type: "keyword" },
          recipient: { type: "text" },
          subject: { type: "text" },
          body: { type: "text" },
          status: { type: "keyword" },
          scheduledAt: { type: "date" },
          sentAt: { type: "date" }
        }
      }
    });
  }
}

export async function indexEmail(email: any) {
  if (!elastic) return;

  await ensureIndex();

  await elastic.index({
    index: env.ELASTICSEARCH_INDEX,
    id: email.id,
    document: {
      emailId: email.id,
      userId: email.userId,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      status: email.status,
      scheduledAt: email.scheduledAt,
      sentAt: email.sentAt
    },
    refresh: "wait_for"
  });
}

export async function searchEmails(userId: string, q: string) {
  if (!elastic) return [];

  await ensureIndex();

  const result = await elastic.search({
    index: env.ELASTICSEARCH_INDEX,
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query: q,
              fields: ["recipient^3", "subject^2", "body"]
            }
          }
        ],
        filter: [{ term: { userId } }]
      }
    },
    sort: [{ scheduledAt: "desc" }]
  });

  return result.hits.hits.map((hit: any) => hit._source);
}