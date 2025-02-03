# **Lung Cancer Survivability and Treatment Type Prediction**

Welcome to the repository for predicting the survivability and treatment type rates of lung cancer patients. This project leverages machine learning techniques to analyse patient data and provide insights into treatment outcomes.

---

## **Project Overview**

Lung cancer is one of the most prevalent forms of cancer worldwide. This project aims to:
- Predict **patient survivability** based on various features such as cancer stage, smoking status, and treatment type.
- Classify and analyse the effectiveness of different **treatment types** using machine learning models.

### **Key Features**
- Comprehensive data cleaning and preprocessing pipeline to handle raw lung cancer datasets.
- Multiple machine learning models, including Logistic Regression, XGBoost, and K-Nearest Neighbours (KNN), to ensure robust predictions.
- Detailed performance evaluation using metrics like accuracy, precision, ROC-AUC, and classification reports.

---

## **Project Structure**

### **1. Data Cleaning** (`datacleaning.py`)
- Standardises critical features like smoking status, cancer stage, and treatment type.
- Calculates treatment duration based on start and end dates.
- Outputs a cleaned dataset for use in machine learning models.
- File: `processed_lung_cancer_data_cleaned.csv`

### **2. Logistic Regression Model** (`logisticRegression.py`)
- Predicts survivability of lung cancer patients.
- Implements preprocessing steps, including scaling and one-hot encoding.
- Evaluates performance with confusion matrices, ROC curves, and classification reports.

### **3. XGBoost Classifier** (`XGBoostClassifier.py`)
- Focuses on predicting treatment type using advanced ensemble learning techniques.
- Handles categorical encoding with `LabelEncoder` for efficient model input.
- Generates class-wise ROC curves to evaluate treatment type classification.

### **4. K-Nearest Neighbours (KNN)** (`KNN.ipynb`)
- Implements KNN for predicting survivability.
- Provides an alternative approach to evaluate the effectiveness of feature combinations.
- Includes hyperparameter tuning for optimal performance.

---

## **Data Source**
The project uses a lung cancer dataset (`v150000_lung_cancer_mortality_data_v2.csv`) containing anonymised patient records. The dataset includes:
- Demographics (age, gender, country)
- Cancer characteristics (stage, smoking status, family history)
- Treatment details (type, duration)
- Survival outcomes

---

## **CREDITS AND ANNOTATIONS**
This project was done as a team of 4 USyd Engineers.
For the full project report, check out **FinalReport.pdf**

