import pandas as pd

# Load the IBTrACS CSV file
file_path = "data/ibtracs_all_list_v04r01.csv"  # adjust if path is different
df = pd.read_csv(file_path, low_memory=False)

# Preview to identify key columns
print(df.columns[:30])  # show first 30 columns to locate IDs and coords
print(f"Sample SID values: {df['SID'].head(10).tolist()}")  # Check what SID values look like
print(f"Total records: {len(df)}")

# Common IBTrACS columns:
# 'SID' (storm ID), 'NAME', 'SEASON', 'ISO_TIME', 'LAT', 'LON'

# Create YEAR column from first 4 digits of SID
# First, clean the SID column and handle any invalid values
original_count = len(df)
df['SID_clean'] = df['SID'].astype(str).str.strip()  # Remove whitespace
df['YEAR'] = pd.to_numeric(df['SID_clean'].str[:4], errors='coerce')  # Convert to numeric, invalid values become NaN

# Remove rows where YEAR couldn't be extracted (invalid SID format)
df = df.dropna(subset=['YEAR'])
df['YEAR'] = df['YEAR'].astype(int)  # Convert to int after removing NaN values

# Filter data to only include the last 20 years (2005-2025)
df_filtered = df[(df['YEAR'] >= 2005) & (df['YEAR'] <= 2025)]

# Drop the temporary SID_clean column
df_filtered = df_filtered.drop(columns=['SID_clean'])

# Sort by time to ensure earliest record is first
df_sorted = df_filtered.sort_values(by=["SID", "NUMBER", "ISO_TIME"])

# Drop duplicates, keeping only the first row per storm ID
first_points = df_sorted.drop_duplicates(subset=["SID", "NUMBER"], keep="first")


# Save to new CSV
output_path = "data/ibtracs_first_locations.csv"
first_points.to_csv(output_path, index=False)

print(f"Saved {len(first_points)} first storm locations from 2005-2025 to {output_path}")
print(f"Original dataset had {original_count} records")
print(f"After cleaning invalid SID values: {len(df)} records") 
print(f"After filtering to 2005-2025: {len(df_filtered)} records")
print(f"Final first locations: {len(first_points)} records")
