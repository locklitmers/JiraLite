import { db } from "./db";

const RATE_LIMIT_PER_MINUTE = 10;
const RATE_LIMIT_PER_DAY = 100;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn?: number; // seconds until reset
  error?: string;
}

export async function checkAIRateLimit(userId: string): Promise<RateLimitResult> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Count requests in the last minute
  const minuteCount = await db.aICache.count({
    where: {
      issue: {
        OR: [
          { reporterId: userId },
          { assigneeId: userId },
          { project: { team: { members: { some: { userId } } } } },
        ],
      },
      createdAt: { gte: oneMinuteAgo },
    },
  });

  // If over minute limit
  if (minuteCount >= RATE_LIMIT_PER_MINUTE) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: 60,
      error: `Rate limit exceeded. Please wait 1 minute. (${minuteCount}/${RATE_LIMIT_PER_MINUTE} requests)`,
    };
  }

  // Count requests today
  const dayCount = await db.aICache.count({
    where: {
      issue: {
        OR: [
          { reporterId: userId },
          { assigneeId: userId },
          { project: { team: { members: { some: { userId } } } } },
        ],
      },
      createdAt: { gte: startOfDay },
    },
  });

  // If over daily limit
  if (dayCount >= RATE_LIMIT_PER_DAY) {
    const tomorrow = new Date(startOfDay);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const resetIn = Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
    
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      error: `Daily rate limit exceeded. Resets at midnight. (${dayCount}/${RATE_LIMIT_PER_DAY} requests today)`,
    };
  }

  return {
    allowed: true,
    remaining: Math.min(
      RATE_LIMIT_PER_MINUTE - minuteCount,
      RATE_LIMIT_PER_DAY - dayCount
    ),
  };
}

// Simple in-memory rate limiter for non-cached AI calls
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkSimpleRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: RATE_LIMIT_PER_MINUTE - 1 };
  }
  
  if (userLimit.count >= RATE_LIMIT_PER_MINUTE) {
    const resetIn = Math.ceil((userLimit.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetIn,
      error: `Rate limit exceeded. Please wait ${resetIn} seconds.`,
    };
  }
  
  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT_PER_MINUTE - userLimit.count };
}

