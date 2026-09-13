export { default } from "next-auth/middleware";
export const config = { matcher: ["/changes/new", "/changes/:path*/edit"] };
