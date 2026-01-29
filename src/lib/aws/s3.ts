export const uploadImageToS3 = async (
  file: File,
  userId: string
): Promise<string> => {
  try {
    // Step 1: Get pre-signed URL from our API
    const response = await fetch("/api/upload/presigned-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    const { presignedUrl, finalUrl } = await response.json();

    // Step 2: Upload file directly to S3 using pre-signed URL
    const uploadResponse = await fetch(presignedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to S3");
    }

    return finalUrl;
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    throw error;
  }
};

export const deleteImageFromS3 = async (imageUrl: string): Promise<void> => {
  try {
    const cloudfrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
    if (cloudfrontUrl && imageUrl.startsWith(cloudfrontUrl)) {
      // Extract the key from the URL for future implementation
      // const key = imageUrl.replace(`${cloudfrontUrl}/`, "");
      // TODO: Implement delete via API route with AWS SDK
      console.warn("Delete image functionality needs to be implemented via API route");
    }
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    throw error;
  }
};
