import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, auc, classification_report,
                             confusion_matrix, roc_curve)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler

data = pd.read_csv('v150000_lung_cancer_mortality_data_v2.csv')


# converting the date to appropriate data structure
data['diagnosis_date'] = pd.to_datetime(data['diagnosis_date'], errors='coerce')
data['beginning_of_treatment_date'] = pd.to_datetime(data['beginning_of_treatment_date'], errors='coerce')
data['end_treatment_date'] = pd.to_datetime(data['end_treatment_date'], errors='coerce')
if 'treatment_duration_days' not in data.columns or data['treatment_duration_days'].isnull().any():
    data['treatment_duration_days'] = (data['end_treatment_date'] - data['beginning_of_treatment_date']).dt.days

# missing values are dropped
data = data.dropna()

X = data.drop(columns=['survived', 'diagnosis_date', 'beginning_of_treatment_date', 
                       'end_treatment_date', 'country'])
y = data['survived']

# numerical and categorical columns
numerical_cols = X.select_dtypes(include=['int64', 'float64', 'int32', 'float32']).columns.tolist()
categorical_cols = X.select_dtypes(include=['object', 'bool']).columns.tolist()
numerical_transformer = StandardScaler()
categorical_transformer = OneHotEncoder(drop='first', sparse=False)

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numerical_transformer, numerical_cols),
        ('cat', categorical_transformer, categorical_cols)
    ])

X_preprocessed = preprocessor.fit_transform(X)

# splitting the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X_preprocessed, y, test_size=0.2, random_state=42)

# training the logistic regression model
model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

# predicting on the test set
y_pred = model.predict(X_test)
y_pred_proba = model.predict_proba(X_test)[:, 1]

# evaluating the model
accuracy = accuracy_score(y_test, y_pred)
report = classification_report(y_test, y_pred)

print("Accuracy:", accuracy)
print("Classification Report:\n", report)

# confusion Matrix
conf_matrix = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(6, 4))
sns.heatmap(conf_matrix, annot=True, fmt='d', cmap='Blues',
            xticklabels=['Did Not Survive', 'Survived'],
            yticklabels=['Did Not Survive', 'Survived'])
plt.ylabel('Actual')
plt.xlabel('Predicted')
plt.title('Confusion Matrix')
plt.show()

# ROC curve
fpr, tpr, thresholds = roc_curve(y_test, y_pred_proba)
roc_auc = auc(fpr, tpr)

plt.figure(figsize=(6, 4))
plt.plot(fpr, tpr, color='darkorange', lw=2, label='ROC curve (AUC = %0.2f)' % roc_auc)
plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
plt.xlim([-0.01, 1.00])
plt.ylim([0.00, 1.05])
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Receiver Operating Characteristic (ROC)')
plt.legend(loc="lower right")
plt.show()