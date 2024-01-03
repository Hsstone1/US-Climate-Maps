import pandas as pd
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import joblib


def nws_prediction_model(df):
    # print(df.head())
    # Select your features and target variables
    X = df[
        [
            "high_temperature",
            "low_temperature",
            "departure_temperature",
            "precipitation",
        ]
    ]  # Features
    y = df[["sunshine_percent", "wind", "wind_gust", "wind_dir", "snow"]]  # Targets

    # Split the data into a training set and a test set
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Initialize the model
    model = RandomForestRegressor(n_estimators=100, random_state=42)

    # Train the model on the training data
    model.fit(X_train, y_train)

    # Make predictions on the test set
    predictions = model.predict(X_test)

    # Evaluate the model's performance
    mae = mean_absolute_error(y_test, predictions)
    print("Mean Absolute Error:", mae)

    # Save the model to a file
    model_filename = "nws_climate_model_simple.pkl"
    joblib.dump(model, model_filename)

    print(f"Model saved to {model_filename}")


if __name__ == "__main__":
    df = pd.read_csv("nws_combined_climate_data.csv")

    nws_prediction_model(df)
