export const onRequestGet = async (context) => {
  try {
    const bucket = context.env.IMAGES;

    const key =
      context.params.key ||
      context.params["key"];

    if (!key) {
      return new Response(
        "Image key missing",
        {
          status: 400,
        }
      );
    }

    const object =
      await bucket.get(key);

    if (!object) {
      return new Response(
        "Image not found",
        {
          status: 404,
        }
      );
    }

    return new Response(
      object.body,
      {
        headers: {
          "Content-Type":
            object.httpMetadata
              ?.contentType ||
            "image/jpeg",

          "Cache-Control":
            "public,max-age=31536000",
        },
      }
    );

  } catch (err) {
    return Response.json(
      {
        success: false,
        error:
          err?.message ||
          "IMAGE_ERROR",
      },
      {
        status: 500,
      }
    );
  }
};
