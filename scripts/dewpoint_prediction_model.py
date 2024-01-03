import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import joblib


def dewpoint_prediction_model(df):
    # Calculate Diurnal Temperature Range (DTR) and mean temperature
    df["DTR"] = df["TMax"] - df["TMin"]
    df["TAvg"] = (df["TMax"] + df["TMin"]) / 2

    # Features and target
    X = df[["TMax", "TMin", "Total"]]
    y = df[["DMax", "DAvg"]]

    # Split the df into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Initialize and train the linear regression model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Make predictions and evaluate the model
    y_pred = model.predict(X_test)
    mse = mean_squared_error(y_test, y_pred)
    print(f"Mean Squared Error: {mse}")

    # Save the model
    joblib_file = "dewpoint_model.pkl"
    joblib.dump(model, joblib_file)
    print(f"Model saved to {joblib_file}")


if __name__ == "__main__":
    df = pd.read_csv("temperature-humidity-data.csv")

    dewpoint_prediction_model(df)
