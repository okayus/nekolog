/**
 * Pages Functions proxy: method・headers・body・cookie を保ったまま Workers に転送する。
 * Better Auth の Cookie ベース認証が same-origin で成立するための中核。
 */
interface Env {
  API_WORKER_URL: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const apiUrl = new URL(url.pathname + url.search, context.env.API_WORKER_URL);
  return fetch(new Request(apiUrl.toString(), context.request));
};
