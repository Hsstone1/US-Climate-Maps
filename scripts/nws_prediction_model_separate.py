import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import joblib

# Load your data
df = pd.read_csv("nws_training_data.csv")


# Define your features
X = df[
    [
        "high_temperature",
        "low_temperature",
        "departure_temperature",
        "precip",
        "sun_angle",
    ]
]

# Define your targets
targets = {
    # "sunlight": "sunshine_percent",
    # "wind": ["wind", "wind_gust", "wind_dir"],
    "snow": "snow",
}

# Parameters for GridSearchCV
param_grid = {
    "n_estimators": [100, 150],
    "max_features": ["auto", "sqrt", "log2"],
    "max_depth": [4, 6, 8],
}


def train_model(X, y, model_name):
    # Split the data into a training set and a test set
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    """
    # Initialize the Linear Regression model
    model = LinearRegression()

    # Train the model on the training data
    model.fit(X_train, y_train)

    # Make predictions on the test set
    predictions = model.predict(X_test)

    # Evaluate the model's performance using Mean Squared Error
    mae = mean_absolute_error(y_test, predictions)
    print(f"Mean Squared Error for {model_name}: {mae}")

    # Save the model to a file
    model_filename = f"{model_name}_linear_regression_model.pkl"
    joblib.dump(model, model_filename)

    print(f"Model for {model_name} saved to {model_filename}")
    """
    # """
    # Initialize the model
    model = RandomForestRegressor(random_state=42)

    # Initialize GridSearchCV
    grid_search = GridSearchCV(
        estimator=model, param_grid=param_grid, cv=3, n_jobs=3, verbose=2
    )

    # Train the model on the training data using Grid Search
    grid_search.fit(X_train, y_train)

    # Make predictions on the test set
    predictions = grid_search.best_estimator_.predict(X_test)

    # Evaluate the model's performance
    mae = mean_absolute_error(y_test, predictions)
    print(f"Mean Absolute Error for {model_name}: {mae}")

    # Save the model to a file
    model_filename = f"{model_name}_prediction_model.pkl"
    joblib.dump(grid_search.best_estimator_, model_filename)

    print(f"Model for {model_name} saved to {model_filename}")
    # """


# Train and save models for each target
for model_name, target in targets.items():
    print(f"Training model for {model_name}")
    y = df[target] if isinstance(target, str) else df[target].values
    train_model(X, y, model_name)
