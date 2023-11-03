# Use an official lightweight Python image.
FROM public.ecr.aws/lambda/python:3.8

# Set the working directory to /var/task
WORKDIR /var/task

# Copy only the specified files into the container at /var/task
COPY lambda_climate_data.py climate_point_interpolation.py climate_point_interpolation_helpers.py requirements.txt ./

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Set the CMD to the handler (lambda_climate_data.lambda_handler)
CMD ["lambda_climate_data.lambda_handler"]