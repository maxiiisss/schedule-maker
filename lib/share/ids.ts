import "server-only"

import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto"

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

export const SHARE_ID_LENGTH = 10
export const SHARE_ID_PATTERN = /^[0-9A-Za-z]{10}$/

/** Unguessable public id (10 base62 chars from a CSPRNG, about 59 bits). */
export function createShareId(): string {
  let id = ""
  for (let i = 0; i < SHARE_ID_LENGTH; i++) id += ALPHABET[randomInt(ALPHABET.length)]
  return id
}

/** Secret the owner keeps in their browser to revoke the link later. */
export function createEditToken(): string {
  return randomBytes(24).toString("base64url")
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function tokenMatches(token: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashToken(token), "hex")
  const expected = Buffer.from(expectedHash, "hex")
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
