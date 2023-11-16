# Use an official lightweight Python image.
FROM public.ecr.aws/lambda/python:3.8

# Set the working directory to /var/task
WORKDIR /var/task

# Copy only the specified files into the container at /var/task
COPY climate_point_interpolation.py climate_point_interpolation_helpers.py climate_data_lambda_handler.py requirements.txt ./

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Set the CMD to the handler (climate_data_lambda_handler.lambda_handler)
CMD ["climate_data_lambda_handler.lambda_handler"]