export const onRequestPost = async (context) => {
  const bucket = context.env.IMAGES;

  const formData = await context.request.formData();
  const file = formData.get("image");

  if (!file || !(file instanceof File)) {
    return Response.json({ error: "No image" }, { status: 400 });
  }

  const key = `properties/${crypto.randomUUID()}-${file.name}`;

  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || "image/jpeg",
    },
  });

  return Response.json({
    success: true,
    key,
    url: `/api/images/${key}`,
  });
};
