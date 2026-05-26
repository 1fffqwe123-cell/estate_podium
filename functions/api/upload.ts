export const onRequestPost = async (context) => {
  try {
    const bucket = context.env.IMAGES;

    if (!bucket) {
      return Response.json(
        {
          success: false,
          error: "R2_NOT_CONNECTED",
          message: "IMAGES binding not found",
        },
        { status: 500 }
      );
    }

    const formData = await context.request.formData();

    const files = formData.getAll("images");

    if (!files.length) {
      return Response.json(
        {
          success: false,
          error: "NO_IMAGES",
          message: "No images uploaded",
        },
        { status: 400 }
      );
    }

    const uploaded = [];

    for (const item of files) {
      if (!(item instanceof File)) continue;

      const ext =
        item.name.split(".").pop() || "jpg";

      const key =
        `properties/${
          crypto.randomUUID()
        }.${ext}`;

      await bucket.put(
        key,
        await item.arrayBuffer(),
        {
          httpMetadata: {
            contentType:
              item.type ||
              "image/jpeg",
          },
        }
      );

      uploaded.push({
        key,
        url: `/api/images/${key}`,
      });
    }

    return Response.json({
      success: true,
      uploaded,
    });

  } catch (err) {
    return Response.json(
      {
        success: false,
        error: "UPLOAD_FAILED",
        message:
          err?.message ||
          "Unknown upload error",
      },
      {
        status: 500,
      }
    );
  }
};
