export const onRequestGet = async (context) => {
  const bucket = context.env.IMAGES;
  const key = context.params.key;

  const obj = await bucket.get(key);

  if (!obj) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "image/jpeg",
    },
  });
};
