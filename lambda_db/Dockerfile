# Use an official lightweight Python image.
FROM public.ecr.aws/lambda/python:3.8

# Set the working directory to /var/task
WORKDIR /var/task

# Copy only the specified files into the container at /var/task
COPY db_climate_data.py db_helper.py db_lambda_function.py requirements.txt ./

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Set the CMD to the handler (db_lambda_function.lambda_handler)
CMD ["db_lambda_function.lambda_handler"]