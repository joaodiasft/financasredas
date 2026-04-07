import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret_pink_finance");

export async function sign(payload: any) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 7; // 7 days

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(SECRET);
}

export async function verify(token: string) {
  const { payload } = await jwtVerify(token, SECRET);
  return payload;
}
