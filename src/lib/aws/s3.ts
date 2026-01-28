import { uploadData, getUrl } from "aws-amplify/storage";
import { v4 as uuidv4 } from "uuid";

export const uploadImageToS3 = async (
  file: File,
  userId: string
): Promise<string> => {
  try {
    const fileExtension = file.name.split(".").pop();
    const fileName = `${userId}/${uuidv4()}.${fileExtension}`;

    await uploadData({
      key: fileName,
      data: file,
      options: {
        contentType: file.type,
      },
    }).result;

    const cloudfrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
    if (cloudfrontUrl) {
      return `${cloudfrontUrl}/${fileName}`;
    }

    const url = await getUrl({
      key: fileName,
      options: {
        expiresIn: 3600,
      },
    });

    return url.url.toString();
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    throw error;
  }
};

export const deleteImageFromS3 = async (imageUrl: string): Promise<void> => {
  try {
    const cloudfrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
    if (cloudfrontUrl && imageUrl.startsWith(cloudfrontUrl)) {
      const key = imageUrl.replace(`${cloudfrontUrl}/`, "");
      // Note: Amplify Storage doesn't have a delete method in v6
      // You may need to use AWS SDK directly or implement via AppSync mutation
      console.warn("Delete image functionality needs to be implemented via AppSync");
    }
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    throw error;
  }
};
