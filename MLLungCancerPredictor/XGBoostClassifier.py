import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, classification_report, roc_auc_score, roc_curve, auc
import matplotlib.pyplot as plt

# Load your data
data = pd.read_csv('v150000_lung_cancer_mortality_data_v2.csv')

# Preprocessing: Drop non-feature columns like IDs, dates, etc.
df = data.drop(columns=['diagnosis_date', 'beginning_of_treatment_date', 'end_treatment_date', 'id']) 

# Label encoding for categorical features
label_encoders = {}
for column in ['gender', 'country', 'cancer_stage', 'family_history', 'smoking_status', 'treatment_type']:
    le = LabelEncoder()
    df[column] = le.fit_transform(df[column])
    label_encoders[column] = le

# Set features and target variable (treatment_type)
X = df.drop(columns=['treatment_type'])  # Features
y = df['treatment_type']  # Target

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Initialize and train XGBoost Classifier
xgb_model = XGBClassifier(use_label_encoder=False, eval_metric='mlogloss', random_state=42)
xgb_model.fit(X_train, y_train)

# Predict on test data
y_pred = xgb_model.predict(X_test)

# Accuracy and Precision
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted')
print(f"Accuracy: {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print("Classification Report:")
print(classification_report(y_test, y_pred))

# ROC Curve
y_prob = xgb_model.predict_proba(X_test)

# Compute ROC curve and ROC area for each class
fpr = {}
tpr = {}
roc_auc = {}
n_classes = len(label_encoders['treatment_type'].classes_)

for i in range(n_classes):
    fpr[i], tpr[i], _ = roc_curve(y_test == i, y_prob[:, i])
    roc_auc[i] = auc(fpr[i], tpr[i])

# Plot ROC curve for each class
plt.figure(figsize=(8, 6))
colors = ['blue', 'orange', 'green', 'red']
for i, color in zip(range(n_classes), colors):
    plt.plot(fpr[i], tpr[i], color=color, lw=2, label=f'Class {label_encoders["treatment_type"].inverse_transform([i])[0]} (AUC = {roc_auc[i]:.2f})')

plt.plot([0, 1], [0, 1], 'k--', lw=2, label='No Skill (AUC = 0.5)')
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve for XGBoost Classifier')
plt.legend(loc='lower right')
plt.show()
