import { config } from "./config.js";

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

const configured = Boolean(config.SUPABASE_URL && config.SUPABASE_SECRET_KEY);
const endpoint = config.SUPABASE_URL.replace(/\/+$/, "");

function headers(extra: Record<string, string> = {}): HeadersInit {
  return {
    apikey: config.SUPABASE_SECRET_KEY,
    "Content-Type": "application/json",
    ...extra
  };
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(`${endpoint}/rest/v1/${path}`, {
    ...init,
    headers: headers(init.headers as Record<string, string> | undefined)
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Supabase memory request failed (${response.status}): ${detail}`);
  }
  return response;
}

function isConversationMessage(value: unknown): value is ConversationMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (message.role === "user" || message.role === "assistant")
    && typeof message.content === "string";
}

export async function loadConversation(
  guildId: string,
  userId: string
): Promise<ConversationMessage[] | null> {
  if (!configured) return null;
  const query = new URLSearchParams({
    select: "history",
    guild_id: `eq.${guildId}`,
    user_id: `eq.${userId}`,
    limit: "1"
  });
  const response = await request(`airi_conversations?${query.toString()}`);
  const rows = await response.json() as Array<{ history?: unknown }>;
  const history = rows[0]?.history;
  if (!Array.isArray(history)) return [];
  return history.filter(isConversationMessage).slice(-24);
}

export async function saveConversation(
  guildId: string,
  userId: string,
  history: ConversationMessage[]
): Promise<void> {
  if (!configured) return;
  const query = new URLSearchParams({ on_conflict: "guild_id,user_id" });
  await request(`airi_conversations?${query.toString()}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      guild_id: guildId,
      user_id: userId,
      history: history.slice(-24),
      updated_at: new Date().toISOString()
    })
  });
}

export async function deleteConversation(guildId: string, userId: string): Promise<void> {
  if (!configured) return;
  const query = new URLSearchParams({
    guild_id: `eq.${guildId}`,
    user_id: `eq.${userId}`
  });
  await request(`airi_conversations?${query.toString()}`, { method: "DELETE" });
}

export function isPersistentMemoryEnabled(): boolean {
  return configured;
}
