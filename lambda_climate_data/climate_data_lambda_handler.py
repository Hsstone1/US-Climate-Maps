import boto3
import uuid
import json
from climate_point_interpolation import optimized_climate_data
from botocore.exceptions import NoCredentialsError

# Initialize a boto3 S3 client
s3_client = boto3.client("s3")
BUCKET_NAME = "us-climate-maps-json-url"


def create_presigned_url(bucket_name, object_name, expiration=3600):
    """Generate a presigned URL to share an S3 object"""
    # Generate a presigned URL for the S3 object
    try:
        response = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket_name, "Key": object_name},
            ExpiresIn=expiration,
        )
    except NoCredentialsError:
        print("Credentials not available")
        return None
    return response


def upload_to_s3(bucket_name, object_name, data):
    """Upload JSON data to S3 as a file"""
    try:
        s3_client.put_object(Bucket=bucket_name, Key=object_name, Body=json.dumps(data))
    except NoCredentialsError:
        print("Credentials not available")
        return None


def lambda_handler(event, context):
    if (
        event.get("source") == "aws.events"
        and event.get("detail-type") == "Scheduled Event"
    ):
        print("Warm-up invocation - exiting early.")
        return {"statusCode": 200, "body": "Warm-up successful"}

    # Parse the incoming JSON from the event body
    body = json.loads(event["body"])

    # Check if the necessary data is in the body of the request
    if "latitude" in body and "longitude" in body and "elevation" in body:
        latitude = float(body["latitude"])
        longitude = float(body["longitude"])
        elevation = float(body["elevation"])

        # Get the climate and location data
        climate_data, location_data = optimized_climate_data(
            latitude, longitude, elevation
        )

        # Prepare the data to return
        result_data = {
            "climate_data": climate_data,
            "location_data": location_data,
        }

        # Generate a unique file name
        file_name = f"climate_data/{uuid.uuid4()}_{latitude}_{longitude}.json"

        # Upload the result data to S3
        upload_to_s3(BUCKET_NAME, file_name, result_data)

        # Generate the presigned URL
        presigned_url = create_presigned_url(BUCKET_NAME, file_name, expiration=3600)

        if presigned_url:
            # Construct the response object with the presigned URL
            response = {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",  # Adjust if you have a specific domain
                },
                "body": json.dumps({"url": presigned_url}),
            }
            print("RESPONSE: ", response)
        else:
            # Handle the error in case URL generation failed
            response = {
                "statusCode": 500,
                "body": json.dumps({"error": "Could not generate the presigned URL"}),
            }

        return response

    else:
        # If the necessary data isn't in the body, return an error
        response = {
            "statusCode": 400,
            "body": json.dumps(
                {"error": "Missing latitude, longitude, or elevation in the request"}
            ),
        }
        return response
