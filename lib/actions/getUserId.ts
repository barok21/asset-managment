import { auth } from "@clerk/nextjs/server";
type Props = {
  userId: string;
}
export async function getUserId() {
  const session = await auth(); // wait for the Promise to resolve
  return session.userId;
}
