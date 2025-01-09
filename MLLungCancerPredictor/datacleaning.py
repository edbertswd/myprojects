import pandas as pd

file_path = 'v150000_lung_cancer_mortality_data_v2.csv'  
# Uncomment this if you want to do it on the test data
# file_path = 'lung_cancer_mortality_data_test_v2.csv'
data = pd.read_csv(file_path)

# Remove the 'id' column if it exists
if 'id' in data.columns:
    data = data.drop(columns=['id'])

# Convert date columns to datetime and calculate the duration of treatment (in days)
data['beginning_of_treatment_date'] = pd.to_datetime(data['beginning_of_treatment_date'], format='%d/%m/%Y', errors='coerce')
data['end_treatment_date'] = pd.to_datetime(data['end_treatment_date'], format='%d/%m/%Y', errors='coerce')

# Calculate the treatment duration (end date - start date) in days
data['treatment_duration_days'] = (data['end_treatment_date'] - data['beginning_of_treatment_date']).dt.days

# Standardize 'smoking_status'
def standardize_smoking_status(value):
    value = str(value).strip().lower()
    if value in ['current smoker', 'current-smoker', 'current']:
        return 'Current Smoker'
    elif value in ['former smoker', 'former-smoker', 'former']:
        return 'Former Smoker'
    elif value in ['never smoked', 'never-smoked', 'never']:
        return 'Never Smoked'
    elif value in ['passive smoker', 'passive-smoker', 'passive']:
        return 'Passive Smoker'
    else:
        return 'Other'

data['smoking_status'] = data['smoking_status'].apply(standardize_smoking_status)

# Standardize 'cancer_stage'
def standardize_cancer_stage(value):
    value = str(value).strip().lower()
    if value in ['stage i', 'stage 1', 'stage 1a', 'stage 1b']:
        return 'Stage I'
    elif value in ['stage ii', 'stage 2', 'stage 2a', 'stage 2b']:
        return 'Stage II'
    elif value in ['stage iii', 'stage 3', 'stage 3a', 'stage 3b']:
        return 'Stage III'
    elif value in ['stage iv', 'stage 4', 'stage 4a', 'stage 4b']:
        return 'Stage IV'
    else:
        return 'Other'

data['cancer_stage'] = data['cancer_stage'].apply(standardize_cancer_stage)

# Standardize 'treatment_type'
def standardize_treatment_type(value):
    value = str(value).strip().lower()
    if value in ['chemotherapy', 'chemo']:
        return 'Chemotherapy'
    elif value == 'radiation':
        return 'Radiation'
    elif value == 'surgery':
        return 'Surgery'
    elif value == 'combined':
        return 'Combined'
    else:
        return 'Other'

data['treatment_type'] = data['treatment_type'].apply(standardize_treatment_type)

# Print unique values after standardization
print("Unique smoking_status values after standardization:", data['smoking_status'].unique())
print("Unique cancer_stage values after standardization:", data['cancer_stage'].unique())
print("Unique treatment_type values after standardization:", data['treatment_type'].unique())

# One-hot encoding for the cleaned categorical variables
data_encoded = pd.get_dummies(
    data, columns=['smoking_status', 'cancer_stage', 'treatment_type'], drop_first=True
)

# Output the processed data to a CSV file
output_file_path = 'processed_lung_cancer_data_cleaned.csv'

# Change it to this if you are using the test csv
# output_file_path = 'processed_lung_cancer_data_using_test.csv'
data_encoded.to_csv(output_file_path, index=False)

print(f"Processed data has been saved to {output_file_path}")
